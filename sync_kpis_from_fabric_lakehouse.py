import argparse
import datetime as dt
import json
import re
import subprocess
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import unquote, urlparse


@dataclass
class OneLakeTable:
    host: str
    workspace: str
    lakehouse: str
    table: str

    @property
    def https_uri(self) -> str:
        return f"https://{self.host}/{self.workspace}/{self.lakehouse}/Tables/{self.table}"

    @property
    def abfss_uri(self) -> str:
        return f"abfss://{self.workspace}@{self.host}/{self.lakehouse}/Tables/{self.table}"


def get_az_token(resource: str) -> str:
    az_cmd = resolve_az_cmd()
    cmd = [
        az_cmd,
        "account",
        "get-access-token",
        "--resource",
        resource,
        "--query",
        "accessToken",
        "-o",
        "tsv",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "Failed to get Azure access token via az CLI")
    token = result.stdout.strip()
    if not token:
        raise RuntimeError("Azure token response was empty. Run az login first.")
    return token


def resolve_az_cmd() -> str:
    candidates = [
        r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
        r"C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate

    found = shutil.which("az") or shutil.which("az.cmd")
    if found:
        return found

    raise RuntimeError("Azure CLI not found. Install Azure CLI or add az.cmd to PATH.")


def parse_onelake_table_url(raw: str) -> OneLakeTable:
    value = raw.strip()
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "abfss"}:
        raise ValueError(f"Unsupported URL scheme: {parsed.scheme}")

    if parsed.scheme == "https":
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) < 4 or parts[2].lower() != "tables":
            raise ValueError(f"URL path does not look like a OneLake table path: {value}")

        workspace = parts[0]
        lakehouse = parts[1]
        table = "/".join(parts[3:])
    else:
        host = parsed.hostname or ""
        workspace = (parsed.username or "").strip()
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) < 3 or parts[1].lower() != "tables":
            raise ValueError(f"URL path does not look like a OneLake table path: {value}")
        lakehouse = parts[0]
        table = "/".join(parts[2:])
        return OneLakeTable(host=host, workspace=workspace, lakehouse=lakehouse, table=clean_table_name(table))

    host = parsed.hostname or ""
    return OneLakeTable(host=host, workspace=workspace, lakehouse=lakehouse, table=clean_table_name(table))


def clean_table_name(value: str) -> str:
    table = unquote(value.strip())
    if table.startswith("[") and table.endswith("]"):
        table = table[1:-1].strip()
    return table


def load_delta_table_as_dict_rows(table_ref: OneLakeTable, storage_token: str) -> List[Dict]:
    try:
        from deltalake import DeltaTable
    except ImportError as exc:
        raise RuntimeError(
            "Missing dependency 'deltalake'. Install with: .\\.venv\\Scripts\\python.exe -m pip install deltalake pyarrow"
        ) from exc

    attempt_errors: List[str] = []

    uris = [
        table_ref.https_uri,
        table_ref.abfss_uri,
        table_ref.https_uri.replace(table_ref.host, "onelake.dfs.fabric.microsoft.com"),
        table_ref.abfss_uri.replace(table_ref.host, "onelake.dfs.fabric.microsoft.com"),
    ]

    storage_option_attempts = [
        {"azure_storage_token": storage_token},
        {"bearer_token": storage_token},
        {
            "azure_storage_token": storage_token,
            "azure_storage_allow_http": "false",
        },
    ]

    last_exc: Optional[Exception] = None
    for uri in uris:
        for opts in storage_option_attempts:
            try:
                dt_obj = DeltaTable(uri, storage_options=opts)
                rows = dt_obj.to_pyarrow_table().to_pylist()
                if rows:
                    return rows
                return []
            except Exception as exc:
                last_exc = exc
                attempt_errors.append(f"{uri} | {json.dumps(opts)} | {exc}")

    error_text = "\n".join(attempt_errors[-6:])
    raise RuntimeError(f"Unable to read delta table. Last error: {last_exc}\nRecent attempts:\n{error_text}")


def pick_ticket_value(rows: List[Dict], explicit_column: Optional[str] = None) -> int:
    if not rows:
        raise RuntimeError("Table has no rows")

    if explicit_column:
        values = [coerce_number(r.get(explicit_column)) for r in rows]
        nums = [v for v in values if v is not None]
        if not nums:
            raise RuntimeError(f"Column '{explicit_column}' has no numeric values")
        return int(round(nums[0] if len(rows) == 1 else sum(nums)))

    # Build a map of lowercase-key to actual key for lookup
    key_map = {k.lower(): k for k in rows[0].keys()}
    first_keys = set(key_map.keys())
    ticket_id_signals = {
        "incidentid",
        "sourceincidentid",
        "sys_id",
        "number",
        "ticketid",
        "requestid",
    }
    # If table has ticket/incident ID column, count UNIQUE IDs (handles duplicates)
    if len(rows) > 1:
        for signal in ticket_id_signals:
            if signal in first_keys:
                actual_key = key_map[signal]
                unique_ids = {r.get(actual_key) for r in rows if r.get(actual_key) is not None}
                return len(unique_ids)

    keys = list(rows[0].keys())
    keyword_order = ["ticket", "tickets", "mtd", "count", "value", "total"]

    numeric_scores: List[Tuple[int, str, List[float]]] = []
    for key in keys:
        vals = [coerce_number(r.get(key)) for r in rows]
        nums = [v for v in vals if v is not None]
        if not nums:
            continue
        score = 0
        key_lower = key.lower()
        for idx, kw in enumerate(keyword_order):
            if kw in key_lower:
                score += (len(keyword_order) - idx) * 10
        if "id" == key_lower or key_lower.endswith("_id"):
            score -= 100
        numeric_scores.append((score, key, nums))

    if not numeric_scores:
        raise RuntimeError("Could not find numeric columns in table rows")

    numeric_scores.sort(key=lambda item: (item[0], len(item[2])), reverse=True)
    _, best_key, best_vals = numeric_scores[0]
    return int(round(best_vals[0] if len(rows) == 1 else sum(best_vals)))


def coerce_number(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().replace(",", "")
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def update_external_kpi(data_js_path: Path, snow_value: int, icm_value: int, iso_date: str) -> None:
    text = data_js_path.read_text(encoding="utf-8")

    snow_pattern = re.compile(
        r"(\{\s*name:\s*'SNOW Tickets MTD',\s*value:\s*)([-0-9.]+)(\s*,\s*unit:\s*'tickets',\s*source:\s*'ServiceNow',\s*lastUpdated:\s*')([^']*)(')",
        re.MULTILINE,
    )
    icm_pattern = re.compile(
        r"(\{\s*name:\s*'ICM Tickets MTD',\s*value:\s*)([-0-9.]+)(\s*,\s*unit:\s*'tickets',\s*source:\s*'ICM System',\s*lastUpdated:\s*')([^']*)(')",
        re.MULTILINE,
    )

    if not snow_pattern.search(text):
        raise RuntimeError("Could not find SNOW Tickets MTD entry in data.js")
    if not icm_pattern.search(text):
        raise RuntimeError("Could not find ICM Tickets MTD entry in data.js")

    text = snow_pattern.sub(rf"\g<1>{snow_value}\g<3>{iso_date}\5", text, count=1)
    text = icm_pattern.sub(rf"\g<1>{icm_value}\g<3>{iso_date}\5", text, count=1)

    data_js_path.write_text(text, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Sync SNOW/ICM Tickets MTD from Fabric Lakehouse tables into data.js")
    parser.add_argument("--snow-url", required=True, help="OneLake table URL for SNOW tickets MTD")
    parser.add_argument("--icm-url", required=True, help="OneLake table URL for ICM tickets MTD")
    parser.add_argument("--snow-column", default=None, help="Optional explicit numeric column for SNOW value")
    parser.add_argument("--icm-column", default=None, help="Optional explicit numeric column for ICM value")
    parser.add_argument("--data-js", default="data.js", help="Path to data.js")
    parser.add_argument("--dry-run", action="store_true", help="Read and print values without editing data.js")
    args = parser.parse_args()

    snow_ref = parse_onelake_table_url(args.snow_url)
    icm_ref = parse_onelake_table_url(args.icm_url)

    storage_token = get_az_token("https://storage.azure.com")

    snow_rows = load_delta_table_as_dict_rows(snow_ref, storage_token)
    icm_rows = load_delta_table_as_dict_rows(icm_ref, storage_token)

    snow_value = pick_ticket_value(snow_rows, args.snow_column)
    icm_value = pick_ticket_value(icm_rows, args.icm_column)

    today = dt.date.today().isoformat()

    print(f"SNOW Tickets MTD = {snow_value}")
    print(f"ICM Tickets MTD = {icm_value}")

    if args.dry_run:
        print("Dry run enabled. data.js was not modified.")
        return

    data_js_path = Path(args.data_js)
    if not data_js_path.exists():
        raise RuntimeError(f"data.js not found at: {data_js_path}")

    update_external_kpi(data_js_path, snow_value, icm_value, today)
    print(f"Updated {data_js_path} with SNOW={snow_value}, ICM={icm_value}, lastUpdated={today}")


if __name__ == "__main__":
    main()
