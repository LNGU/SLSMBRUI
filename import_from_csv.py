#!/usr/bin/env python3
"""
Import SLS MBR data from the flat CSV into data.js.

The CSV has one row per publisher with all data (publisher info, spend, risks)
in a single flat table. This script parses it and maps to the data.js structure.
"""

import csv
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


def parse_currency(val: str) -> float:
    """Parse a currency string like '$13,644,684.70' to float."""
    if not val or not val.strip():
        return 0
    s = val.strip().replace('$', '').replace(',', '').replace(' ', '')
    if s == '-' or s == '$-':
        return 0
    try:
        return float(s)
    except ValueError:
        return 0


def parse_date(val: str) -> str:
    """Parse various date formats to YYYY-MM-DD. Return '' if not a valid date."""
    if not val or not val.strip():
        return ''
    s = val.strip()
    
    # Handle dates with extra text (e.g., "10/24/2026 but it is up for debate...")
    # Take just the date part
    date_match = re.match(r'(\d{1,2}/\d{1,2}/\d{4})', s)
    if date_match:
        s = date_match.group(1)
    else:
        # Try YYYY-MM-DD format
        date_match2 = re.match(r'(\d{4}-\d{2}-\d{2})', s)
        if date_match2:
            return date_match2.group(1)
        return ''
    
    # Parse M/D/YYYY
    try:
        dt = datetime.strptime(s, '%m/%d/%Y')
        return dt.strftime('%Y-%m-%d')
    except ValueError:
        pass
    
    return ''


def map_status(invoice_status: str) -> str:
    """Map FY26 Invoice Status to publisher status."""
    s = (invoice_status or '').strip().lower()
    if s == 'completed':
        return 'Active'
    elif s == 'pending':
        return 'Pending'
    elif s == 'tbd' or s == '':
        return 'In Review'
    return 'Active'


def clean_title(title: str) -> str:
    """Clean up title text - remove bullet markers, normalize whitespace."""
    if not title:
        return ''
    # Replace bullet characters
    s = title.replace('•', '•').replace('�', '•')
    # Normalize whitespace but preserve intentional line breaks for compound titles
    s = re.sub(r'\n+', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def split_titles(title: str, publisher: str) -> List[Dict]:
    """Split a compound title into individual managed title entries."""
    if not title:
        return []
    
    titles = []
    # Check if it has bullet points
    if '•' in title or '�' in title:
        parts = re.split(r'[•�]', title)
        for p in parts:
            p = p.strip().strip('–').strip()
            if p:
                titles.append({'title': p, 'publisher': publisher, 'category': 'Other', 'licenseCount': 0, 'notes': 'active'})
    elif '\n' in title:
        # Multi-line titles
        parts = title.split('\n')
        for p in parts:
            p = p.strip().strip('–').strip()
            if p:
                titles.append({'title': p, 'publisher': publisher, 'category': 'Other', 'licenseCount': 0, 'notes': 'active'})
    else:
        # Check for known multi-title patterns like "Camtasia & Snagit"
        if ' & ' in title:
            parts = title.split(' & ')
            for p in parts:
                p = p.strip()
                if p:
                    titles.append({'title': p, 'publisher': publisher, 'category': 'Other', 'licenseCount': 0, 'notes': 'active'})
        else:
            titles.append({'title': title.strip(), 'publisher': publisher, 'category': 'Other', 'licenseCount': 0, 'notes': 'active'})
    
    return titles


def js_value(val: Any) -> str:
    """Serialize a Python value to JavaScript literal syntax."""
    if val is None:
        return 'null'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        if isinstance(val, float) and val == int(val) and abs(val) < 1e15:
            return str(int(val))
        return str(val)
    s = str(val).replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
    return f"'{s}'"


def js_object_oneline(obj: Dict[str, Any], key_order: List[str]) -> str:
    """Serialize a dict as a one-line JS object literal."""
    parts = []
    for key in key_order:
        if key in obj:
            parts.append(f'{key}: {js_value(obj[key])}')
    for key in obj:
        if key not in key_order:
            parts.append(f'{key}: {js_value(obj[key])}')
    return '{ ' + ', '.join(parts) + ' }'


def generate_js_data(data: Dict[str, Any]) -> str:
    """Generate the full defaultRawData JavaScript declaration."""
    lines = ['const defaultRawData = {']

    if 'publishers' in data:
        key_order = ['id', 'name', 'title', 'type', 'contact', 'renewalDate', 'status', 'savingsAmount', 'savingsType']
        lines.append('    publishers: [')
        for pub in data['publishers']:
            lines.append(f'        {js_object_oneline(pub, key_order)},')
        lines.append('    ],')

    if 'spendData' in data:
        key_order = ['publisher', 'companySpend', 'msdSpend', 'tiamSpend', 'fiscalYear', 'notes']
        lines.append('    spendData: [')
        for s in data['spendData']:
            lines.append(f'        {js_object_oneline(s, key_order)},')
        lines.append('    ],')

    if 'riskData' in data:
        key_order = ['publisher', 'sspa', 'po', 'finance', 'legal', 'inventory', 'details']
        lines.append('    riskData: [')
        for r in data['riskData']:
            lines.append(f'        {js_object_oneline(r, key_order)},')
        lines.append('    ],')

    if 'managedTitles' in data:
        key_order = ['title', 'publisher', 'category', 'licenseCount', 'notes']
        lines.append('    managedTitles: [')
        for t in data['managedTitles']:
            lines.append(f'        {js_object_oneline(t, key_order)},')
        lines.append('    ],')

    version = data.get('datasetVersion', f"FY26_CSV_IMPORT_{date.today().isoformat()}")
    lines.append(f"    datasetVersion: {js_value(version)},")

    if 'externalKpis' in data:
        key_order = ['name', 'value', 'unit', 'source', 'lastUpdated', 'notes']
        lines.append('    externalKpis: [')
        for k in data['externalKpis']:
            lines.append(f'        {js_object_oneline(k, key_order)},')
        lines.append('    ]')

    lines.append('};')
    return '\n'.join(lines)


def update_data_js(data_js_path: Path, new_data: Dict[str, Any]) -> str:
    """Replace the defaultRawData object in data.js."""
    content = data_js_path.read_text(encoding='utf-8')

    pattern = re.compile(r'(//[^\n]*\n)*\s*const\s+defaultRawData\s*=\s*\{', re.MULTILINE)
    match = pattern.search(content)
    if not match:
        raise RuntimeError("Could not find 'const defaultRawData = {' in data.js")

    start = match.start()

    # Find matching closing };
    brace_count = 0
    end = -1
    in_string = False
    string_char = None
    i = match.end() - 1

    for idx in range(i, len(content)):
        c = content[idx]
        if in_string:
            if c == '\\' and idx + 1 < len(content):
                continue
            if c == string_char and (idx == 0 or content[idx - 1] != '\\'):
                in_string = False
            continue
        if c in ("'", '"', '`'):
            in_string = True
            string_char = c
            continue
        if c == '{':
            brace_count += 1
        elif c == '}':
            brace_count -= 1
            if brace_count == 0:
                rest = content[idx + 1:idx + 5]
                semi = rest.find(';')
                end = idx + 1 + semi + 1 if semi >= 0 else idx + 2
                break

    if end == -1:
        raise RuntimeError("Could not find end of defaultRawData")

    # Preserve leading comments
    leading = content[:start]
    comment_lines = []
    pre_lines = leading.rstrip().split('\n')
    for line in reversed(pre_lines):
        stripped = line.strip()
        if stripped.startswith('//'):
            comment_lines.insert(0, line)
        elif stripped == '':
            comment_lines.insert(0, line)
        else:
            break

    comment_block = '\n'.join(comment_lines).rstrip()
    pre_content = '\n'.join(pre_lines[:len(pre_lines) - len(comment_lines)]) if comment_lines else leading.rstrip()

    new_declaration = generate_js_data(new_data)

    if comment_block.strip():
        new_content = pre_content + '\n' + comment_block + '\n' + new_declaration + content[end:]
    else:
        new_content = content[:start] + new_declaration + content[end:]

    return new_content


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Import SLS MBR data from CSV into data.js')
    parser.add_argument('--file', '-f', required=True, help='Path to CSV file')
    parser.add_argument('--data-js', default='data.js', help='Path to data.js')
    parser.add_argument('--dry-run', action='store_true', help='Preview without modifying')
    args = parser.parse_args()

    csv_path = Path(args.file)
    if not csv_path.exists():
        print(f'ERROR: File not found: {csv_path}', file=sys.stderr)
        sys.exit(1)

    data_js_path = Path(args.data_js)
    if not data_js_path.exists():
        print(f'ERROR: data.js not found: {data_js_path}', file=sys.stderr)
        sys.exit(1)

    print(f'Reading: {csv_path}')

    # Read CSV (try utf-8-sig first, fall back to cp1252 for Windows Excel exports)
    for encoding in ('utf-8-sig', 'utf-8', 'cp1252', 'latin-1'):
        try:
            with open(csv_path, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            print(f'  Encoding: {encoding}')
            break
        except UnicodeDecodeError:
            continue
    else:
        print('ERROR: Could not decode CSV with any known encoding', file=sys.stderr)
        sys.exit(1)

    print(f'  Found {len(rows)} rows')
    print(f'  Columns: {", ".join(rows[0].keys()) if rows else "none"}')

    publishers = []
    spend_data = []
    risk_data = []
    managed_titles = []

    for i, row in enumerate(rows):
        publisher_name = (row.get('Publisher') or '').strip()
        # Normalize newlines in publisher names (CSV multi-line cells)
        publisher_name = re.sub(r'\s*\n\s*', ' ', publisher_name).strip()
        if not publisher_name:
            continue

        title_raw = (row.get('Title') or '').strip()
        title_clean = clean_title(title_raw)
        license_type = (row.get('On Prem vs. SaaS') or '').strip()
        contact = (row.get('SLS FTE Point of Contact') or '').strip()
        renewal_date = parse_date(row.get('License / Renewal / Subscription End Date', ''))
        invoice_status = (row.get('FY26 Invoice Status') or '').strip()
        status = map_status(invoice_status)
        savings = parse_currency(row.get('FY26 Savings', ''))
        savings_type = (row.get('Savings Type') or '').strip() or None

        # Publisher record
        publishers.append({
            'id': i + 1,
            'name': publisher_name,
            'title': title_clean,
            'type': license_type,
            'contact': contact,
            'renewalDate': renewal_date,
            'status': status,
            'savingsAmount': savings,
            'savingsType': savings_type,
        })

        # Spend record
        company_spend = parse_currency(row.get('FY26 Company Annual Spend', ''))
        msd_spend = parse_currency(row.get('FY26 MSD Annual Spend', ''))
        tiam_spend = parse_currency(row.get('FY26 TI&M Annual Spend', ''))
        spend_notes = (row.get('FY26 Company Annual Spend Notes') or '').strip()

        spend_data.append({
            'publisher': publisher_name,
            'companySpend': company_spend,
            'msdSpend': msd_spend,
            'tiamSpend': tiam_spend,
            'fiscalYear': 'FY26',
            'notes': spend_notes,
        })

        # Risk record
        risk_data.append({
            'publisher': publisher_name,
            'sspa': (row.get('Risks : SSPA') or '').strip(),
            'po': (row.get('Risks : PO') or '').strip(),
            'finance': (row.get('Risks : Finance') or '').strip(),
            'legal': (row.get('Risks : Legal') or '').strip(),
            'inventory': (row.get('Risks : Inventory') or '').strip(),
            'details': (row.get('Comments (Does not require publishing on Power BI)') or '').strip(),
        })

        # Managed titles - split compound titles
        title_entries = split_titles(title_raw, publisher_name)
        managed_titles.extend(title_entries)

    # Preserve existing external KPIs (they come from a different source)
    existing_kpis = _get_existing_kpis(data_js_path)

    data = {
        'publishers': publishers,
        'spendData': spend_data,
        'riskData': risk_data,
        'managedTitles': managed_titles,
        'datasetVersion': f'FY26_NEFAYPGRAFF_{date.today().isoformat()}',
        'externalKpis': existing_kpis,
    }

    print(f'\n  Publishers: {len(publishers)}')
    print(f'  Spend records: {len(spend_data)}')
    print(f'  Risk records: {len(risk_data)}')
    print(f'  Managed titles: {len(managed_titles)}')
    print(f'  External KPIs: {len(existing_kpis)} (preserved from existing)')

    new_content = update_data_js(data_js_path, data)

    if args.dry_run:
        print('\n--- DRY RUN ---')
        match = re.search(r'const defaultRawData = \{', new_content)
        if match:
            print(new_content[match.start():match.start() + 3000])
        print('\nDry run complete. No files modified.')
        return

    data_js_path.write_text(new_content, encoding='utf-8')
    print(f'\n✓ Updated {data_js_path}')
    print(f'  Dataset version: {data["datasetVersion"]}')


def _get_existing_kpis(data_js_path: Path) -> List[Dict]:
    """Try to extract existing externalKpis from data.js."""
    try:
        import subprocess, json
        node_script = f"""
        const fs = require('fs');
        const content = fs.readFileSync('{data_js_path.resolve().as_posix()}', 'utf-8');
        const match = content.match(/const\\s+defaultRawData\\s*=\\s*(\\{{[\\s\\S]*?\\n\\}});/);
        if (match) {{
            eval('var result = ' + match[1]);
            console.log(JSON.stringify(result.externalKpis || []));
        }}
        """
        result = subprocess.run(['node', '-e', node_script], capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout.strip())
    except Exception:
        pass
    # Fallback
    return [
        {'name': 'SNOW Tickets MTD', 'value': 315, 'unit': 'tickets', 'source': 'ServiceNow', 'lastUpdated': date.today().isoformat(), 'notes': ''},
        {'name': 'ICM Tickets MTD', 'value': 135, 'unit': 'tickets', 'source': 'ICM System', 'lastUpdated': date.today().isoformat(), 'notes': ''},
    ]


if __name__ == '__main__':
    main()
