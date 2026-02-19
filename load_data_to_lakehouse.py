"""
Load SLS MBR data to Fabric Lakehouse as Delta tables.

This script:
  1. Exports data from data.js (or reads from CSV) to CSV files
  2. Uploads CSV files to OneLake Files folder
  3. Loads each CSV into a Delta table via the Lakehouse Table Load API

Prerequisites:
  - Azure CLI logged in (az login)
  - pip install azure-storage-file-datalake azure-identity

Usage:
  python load_data_to_lakehouse.py --workspace scm-dev
  python load_data_to_lakehouse.py --workspace scm-dev --upload-only
  python load_data_to_lakehouse.py --workspace scm-dev --load-only
"""

import argparse, csv, json, logging, os, subprocess, sys, time
from pathlib import Path
from datetime import datetime

LOG_FILE = Path(__file__).parent / "load_data_lakehouse.log"

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, mode="w", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

ONELAKE_URL = "https://msit-onelake.dfs.fabric.microsoft.com"
UPLOAD_FOLDER = "sls_mbr_data"
DATA_DIR = Path(__file__).parent / "lakehouse_data"

AZ_CMD = r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if not os.path.exists(AZ_CMD):
    AZ_CMD = "az"

# Tables to create
TABLES = {
    "dim_Publisher": "dim_Publisher.csv",
    "dim_Date": "dim_Date.csv",
    "fact_Spend": "fact_Spend.csv",
    "fact_Risk": "fact_Risk.csv",
    "dim_ManagedTitle": "dim_ManagedTitle.csv",
    "fact_ExternalKPI": "fact_ExternalKPI.csv",
}


def get_token(resource):
    r = subprocess.run(
        [AZ_CMD, "account", "get-access-token", "--resource", resource,
         "--query", "accessToken", "-o", "tsv"],
        capture_output=True, text=True, timeout=30,
        shell=AZ_CMD.endswith(".cmd"))
    if r.returncode:
        raise RuntimeError(f"az error: {r.stderr}")
    return r.stdout.strip()


def api(method, url, token, data=None):
    import urllib.request, urllib.error
    hdrs = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            txt = resp.read().decode()
            return resp.status, json.loads(txt) if txt.strip() else {}, dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode()[:2000]}, dict(e.headers) if hasattr(e, "headers") else {}


# =============================================================================
# Step 0: Export data.js to CSV files
# =============================================================================

def export_data_to_csv():
    """Read data.js and export to CSV files for lakehouse loading."""
    log.info("=== Exporting data.js to CSV files ===")
    
    DATA_DIR.mkdir(exist_ok=True)
    
    # Read data.js and parse the defaultRawData
    data_js_path = Path(__file__).parent / "data.js"
    if not data_js_path.exists():
        log.error("data.js not found")
        return False
    
    text = data_js_path.read_text(encoding="utf-8")
    
    # Extract JSON-like data from JavaScript
    # Find the defaultRawData object
    import re
    
    # Parse publishers
    publishers = extract_js_array(text, "publishers")
    spend_data = extract_js_array(text, "spendData")
    risk_data = extract_js_array(text, "riskData")
    managed_titles = extract_js_array(text, "managedTitles")
    external_kpis = extract_js_array(text, "externalKpis")
    
    # Export dim_Publisher
    with open(DATA_DIR / "dim_Publisher.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["publisher_id", "name", "title", "type", "contact", "renewalDate", "status", "savingsAmount", "savingsType"])
        for p in publishers:
            writer.writerow([
                p.get("id", 0),
                p.get("name", ""),
                p.get("title", ""),
                p.get("type", ""),
                p.get("contact", ""),
                p.get("renewalDate", ""),
                p.get("status", ""),
                p.get("savingsAmount", 0),
                p.get("savingsType", ""),
            ])
    log.info(f"  dim_Publisher.csv: {len(publishers)} rows")
    
    # Export dim_Date (generate date dimension)
    dates = generate_date_dimension()
    with open(DATA_DIR / "dim_Date.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "year", "month", "month_name", "quarter", "fiscal_year"])
        for d in dates:
            writer.writerow(d)
    log.info(f"  dim_Date.csv: {len(dates)} rows")
    
    # Export fact_Spend
    with open(DATA_DIR / "fact_Spend.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["publisher", "companySpend", "msdSpend", "tiamSpend", "fiscalYear", "notes"])
        for s in spend_data:
            writer.writerow([
                s.get("publisher", ""),
                s.get("companySpend", 0),
                s.get("msdSpend", 0),
                s.get("tiamSpend", 0),
                s.get("fiscalYear", ""),
                s.get("notes", ""),
            ])
    log.info(f"  fact_Spend.csv: {len(spend_data)} rows")
    
    # Export fact_Risk
    with open(DATA_DIR / "fact_Risk.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["publisher", "sspa", "po", "finance", "legal", "inventory", "details"])
        for r in risk_data:
            writer.writerow([
                r.get("publisher", ""),
                r.get("sspa", ""),
                r.get("po", ""),
                r.get("finance", ""),
                r.get("legal", ""),
                r.get("inventory", ""),
                r.get("details", ""),
            ])
    log.info(f"  fact_Risk.csv: {len(risk_data)} rows")
    
    # Export dim_ManagedTitle
    with open(DATA_DIR / "dim_ManagedTitle.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["title", "publisher", "category", "licenseCount", "notes"])
        for t in managed_titles:
            writer.writerow([
                t.get("title", ""),
                t.get("publisher", ""),
                t.get("category", ""),
                t.get("licenseCount", 0),
                t.get("notes", ""),
            ])
    log.info(f"  dim_ManagedTitle.csv: {len(managed_titles)} rows")
    
    # Export fact_ExternalKPI
    with open(DATA_DIR / "fact_ExternalKPI.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "value", "unit", "source", "lastUpdated"])
        for k in external_kpis:
            writer.writerow([
                k.get("name", ""),
                k.get("value", 0),
                k.get("unit", ""),
                k.get("source", ""),
                k.get("lastUpdated", ""),
            ])
    log.info(f"  fact_ExternalKPI.csv: {len(external_kpis)} rows")
    
    return True


def extract_js_array(text, array_name):
    """Extract a JavaScript array from data.js text."""
    import re
    
    # Find the array declaration
    pattern = rf"{array_name}:\s*\["
    match = re.search(pattern, text)
    if not match:
        log.warning(f"Could not find {array_name} array")
        return []
    
    start = match.end() - 1  # Include the [
    
    # Find matching ]
    bracket_count = 0
    end = start
    for i, c in enumerate(text[start:], start):
        if c == '[':
            bracket_count += 1
        elif c == ']':
            bracket_count -= 1
            if bracket_count == 0:
                end = i + 1
                break
    
    array_text = text[start:end]
    
    # Convert JS object syntax to JSON
    # Replace single quotes with double quotes
    array_text = re.sub(r"'([^']*)'", r'"\1"', array_text)
    # Add quotes around unquoted keys
    array_text = re.sub(r'(\s)(\w+):', r'\1"\2":', array_text)
    # Handle trailing commas
    array_text = re.sub(r',(\s*[\]}])', r'\1', array_text)
    # Handle null values
    array_text = array_text.replace(": null", ": null")
    
    try:
        return json.loads(array_text)
    except json.JSONDecodeError as e:
        log.warning(f"Failed to parse {array_name}: {e}")
        # Try a more lenient approach - extract individual objects
        return extract_objects_manually(array_text, array_name)


def extract_objects_manually(array_text, array_name):
    """Manually extract objects from JS array when JSON parsing fails."""
    import re
    
    objects = []
    # Find all {...} blocks, including nested content
    i = 0
    while i < len(array_text):
        if array_text[i] == '{':
            # Find matching closing brace
            brace_count = 0
            start = i
            for j, c in enumerate(array_text[i:], i):
                if c == '{':
                    brace_count += 1
                elif c == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        obj_text = array_text[start:j+1]
                        # Convert to proper JSON
                        obj_text = re.sub(r"'([^'\\]*(?:\\.[^'\\]*)*)'", r'"\1"', obj_text)
                        obj_text = re.sub(r'(\s)(\w+):', r'\1"\2":', obj_text)
                        obj_text = re.sub(r',(\s*})', r'\1', obj_text)
                        # Escape newlines and tabs in string values
                        obj_text = obj_text.replace('\n', '\\n').replace('\t', '\\t')
                        
                        try:
                            obj = json.loads(obj_text)
                            objects.append(obj)
                        except json.JSONDecodeError:
                            # Try simpler extraction for this object
                            obj = extract_obj_simple(array_text[start:j+1], array_name)
                            if obj:
                                objects.append(obj)
                        i = j
                        break
        i += 1
    
    log.info(f"  Manually extracted {len(objects)} objects from {array_name}")
    return objects


def extract_obj_simple(obj_text, array_name):
    """Extract key-value pairs from a JS object using simple regex."""
    import re
    
    obj = {}
    # Handle risk data fields specifically 
    if array_name == "riskData":
        fields = ["publisher", "sspa", "po", "finance", "legal", "inventory", "details"]
        for field in fields:
            # Match field: 'value' or field: ''
            pattern = rf"{field}:\s*'([^']*(?:\\'[^']*)*)'"
            match = re.search(pattern, obj_text)
            if match:
                obj[field] = match.group(1).replace("\\'", "'")
            else:
                obj[field] = ""
        if obj.get("publisher"):
            return obj
    return None


def generate_date_dimension():
    """Generate a date dimension for FY26."""
    dates = []
    # Generate dates for FY26 (July 2025 - June 2026)
    from datetime import date, timedelta
    
    start = date(2025, 7, 1)
    end = date(2026, 6, 30)
    
    current = start
    while current <= end:
        month_names = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"]
        quarter = (current.month - 1) // 3 + 1
        fiscal_year = "FY26" if current >= date(2025, 7, 1) else "FY25"
        
        dates.append([
            current.isoformat(),
            current.year,
            current.month,
            month_names[current.month - 1],
            quarter,
            fiscal_year,
        ])
        current += timedelta(days=1)
    
    return dates


# =============================================================================
# Step 1: Upload CSVs to OneLake
# =============================================================================

def upload_csvs_to_onelake(workspace_id, lakehouse_id):
    """Upload CSV files to the Lakehouse Files folder via ADLS Gen2 SDK."""
    from azure.storage.filedatalake import DataLakeServiceClient
    from azure.identity import DefaultAzureCredential

    log.info("=== Uploading CSVs to OneLake ===")
    credential = DefaultAzureCredential()
    service_client = DataLakeServiceClient(account_url=ONELAKE_URL, credential=credential)

    # The filesystem is the workspace GUID
    fs_client = service_client.get_file_system_client(workspace_id)

    # The directory path uses Lakehouse GUID: {lakehouse_guid}/Files/{folder}
    lakehouse_path = f"{lakehouse_id}/Files/{UPLOAD_FOLDER}"
    dir_client = fs_client.get_directory_client(lakehouse_path)

    # Ensure directory exists
    try:
        dir_client.create_directory()
        log.info(f"Created directory: {lakehouse_path}")
    except Exception:
        log.info(f"Directory exists: {lakehouse_path}")

    uploaded = 0
    for table_name, csv_file in TABLES.items():
        csv_path = DATA_DIR / csv_file
        if not csv_path.exists():
            log.warning(f"  SKIP {csv_file} — not found")
            continue

        file_size = csv_path.stat().st_size
        file_client = dir_client.get_file_client(csv_file)

        log.info(f"  Uploading {csv_file} ({file_size:,} bytes)...")
        with open(csv_path, "rb") as f:
            file_client.upload_data(f, overwrite=True)
        uploaded += 1
        log.info(f"  [OK] {csv_file}")

    log.info(f"Uploaded {uploaded}/{len(TABLES)} files to {lakehouse_path}")
    return uploaded


# =============================================================================
# Step 2: Load CSVs into Delta tables
# =============================================================================

def load_tables(fabric_token, workspace_id, lakehouse_id):
    """Load each CSV into a Delta table via Lakehouse Table Load API."""
    log.info("=== Loading CSVs into Delta tables ===")

    loaded = 0
    failed = 0

    for table_name, csv_file in TABLES.items():
        log.info(f"  Loading {table_name} from {csv_file}...")

        load_body = {
            "relativePath": f"Files/{UPLOAD_FOLDER}/{csv_file}",
            "pathType": "File",
            "mode": "Overwrite",
            "formatOptions": {
                "format": "Csv",
                "header": True,
                "delimiter": ",",
            },
        }

        url = (f"https://api.fabric.microsoft.com/v1/workspaces/{workspace_id}"
               f"/lakehouses/{lakehouse_id}/tables/{table_name}/load")

        code, data, headers = api("POST", url, fabric_token, load_body)

        if code == 202:
            # Poll for completion
            op_url = headers.get("Location", "")
            retry_after = int(headers.get("Retry-After", "10"))
            if op_url:
                ok = poll_table_load(op_url, fabric_token, table_name, retry_after)
                if ok:
                    loaded += 1
                else:
                    failed += 1
            else:
                log.info(f"  [OK] {table_name} (accepted, no poll URL)")
                loaded += 1
        elif code == 200:
            log.info(f"  [OK] {table_name} (instant)")
            loaded += 1
        else:
            log.error(f"  [FAIL] {table_name}: {code} - {json.dumps(data)[:500]}")
            failed += 1

    log.info(f"Loaded {loaded}/{len(TABLES)} tables ({failed} failed)")
    return loaded, failed


def poll_table_load(op_url, token, table_name, initial_wait=10, max_polls=30):
    """Poll a long-running operation until success or failure."""
    time.sleep(initial_wait)
    for i in range(max_polls):
        code, data, _ = api("GET", op_url, token)
        status = data.get("status", "Unknown")
        pct = data.get("percentComplete", "?")

        if status in ("Succeeded", "Completed"):
            log.info(f"  [OK] {table_name} (poll {i+1})")
            return True
        elif status in ("Failed", "Cancelled"):
            log.error(f"  [FAIL] {table_name}: {status} - {json.dumps(data)[:500]}")
            return False
        else:
            log.info(f"  {table_name}: {status} ({pct}%) - poll {i+1}")
            time.sleep(5)

    log.error(f"  [TIMEOUT] {table_name}")
    return False


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Load SLS MBR data to Fabric Lakehouse")
    parser.add_argument("--workspace", default="scm-dev", help="Fabric workspace name")
    parser.add_argument("--upload-only", action="store_true", help="Only upload CSVs, skip table load")
    parser.add_argument("--load-only", action="store_true", help="Only load tables, skip CSV export/upload")
    parser.add_argument("--skip-export", action="store_true", help="Skip data.js export, use existing CSVs")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("SLS MBR DATA LOAD TO LAKEHOUSE")
    log.info("=" * 60)

    # Get tokens
    fabric_token = get_token("https://api.fabric.microsoft.com")

    # Find workspace
    _, ws_data, _ = api("GET", "https://api.fabric.microsoft.com/v1/workspaces", fabric_token)
    ws_id = None
    for ws in ws_data.get("value", []):
        if ws["displayName"].lower() == args.workspace.lower():
            ws_id = ws["id"]
            break
    if not ws_id:
        log.error(f"Workspace '{args.workspace}' not found")
        sys.exit(1)
    log.info(f"Workspace: {args.workspace} ({ws_id})")

    # Find lakehouse
    _, items_data, _ = api("GET",
        f"https://api.fabric.microsoft.com/v1/workspaces/{ws_id}/items?type=Lakehouse",
        fabric_token)
    lakehouses = items_data.get("value", [])
    if not lakehouses:
        log.error("No lakehouse found in workspace")
        sys.exit(1)
    lakehouse = lakehouses[0]
    lakehouse_id = lakehouse["id"]
    log.info(f"Lakehouse: {lakehouse['displayName']} ({lakehouse_id})")

    # Step 0: Export data.js to CSV
    if not args.load_only and not args.skip_export:
        log.info("")
        log.info("STEP 0: Export data.js to CSV files")
        log.info("-" * 40)
        if not export_data_to_csv():
            log.error("Failed to export data")
            sys.exit(1)

    # Step 1: Upload CSVs
    if not args.load_only:
        log.info("")
        log.info("STEP 1: Upload CSVs to OneLake")
        log.info("-" * 40)
        upload_csvs_to_onelake(ws_id, lakehouse_id)

    # Step 2: Load tables
    if not args.upload_only:
        log.info("")
        log.info("STEP 2: Load CSVs into Delta tables")
        log.info("-" * 40)
        loaded, failed = load_tables(fabric_token, ws_id, lakehouse_id)
        if failed > 0:
            log.warning(f"{failed} tables failed to load")

    log.info("")
    log.info("=" * 60)
    log.info("DATA LOAD COMPLETE")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
