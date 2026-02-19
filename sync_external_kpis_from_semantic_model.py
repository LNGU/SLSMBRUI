#!/usr/bin/env python3
"""
Sync external KPI values in data.js from a Power BI / Fabric semantic model.

Reads measure values (default: SNOW Tickets MTD, ICM Tickets MTD) from a dataset
in a Fabric workspace, then updates defaultRawData.externalKpis in data.js.

Usage:
  python sync_external_kpis_from_semantic_model.py \
    --workspace-id d3c735d2-8f5c-4d1a-b825-0cc5353a8de2 \
    --dataset-name "SLS MBR Dashboard"
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

AZ_CMD = r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if not os.path.exists(AZ_CMD):
    AZ_CMD = "az"

PBI_RESOURCE = "https://analysis.windows.net/powerbi/api"
PBI_API_BASE = "https://api.powerbi.com/v1.0/myorg"


def get_token(resource: str) -> str:
    result = subprocess.run(
        [AZ_CMD, "account", "get-access-token", "--resource", resource, "--query", "accessToken", "-o", "tsv"],
        capture_output=True,
        text=True,
        timeout=60,
        shell=AZ_CMD.endswith(".cmd"),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to get Azure token: {result.stderr.strip()}")
    token = result.stdout.strip()
    if not token:
        raise RuntimeError("Azure token response was empty.")
    return token


def api_json(method: str, url: str, token: str, payload: Optional[dict] = None) -> dict:
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url=url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            text = resp.read().decode("utf-8")
            return json.loads(text) if text.strip() else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API error {e.code} {url}: {detail}")


def find_dataset_id(workspace_id: str, dataset_name: str, token: str) -> str:
    url = f"{PBI_API_BASE}/groups/{workspace_id}/datasets"
    data = api_json("GET", url, token)
    datasets = data.get("value", [])
    for ds in datasets:
        if ds.get("name") == dataset_name:
            return ds.get("id")
    available = ", ".join(sorted(ds.get("name", "<unnamed>") for ds in datasets))
    raise RuntimeError(
        f"Dataset '{dataset_name}' not found in workspace {workspace_id}. "
        f"Available datasets: {available or '<none>'}"
    )


def execute_dax(workspace_id: str, dataset_id: str, dax_query: str, token: str) -> dict:
    url = f"{PBI_API_BASE}/groups/{workspace_id}/datasets/{dataset_id}/executeQueries"
    payload = {
        "queries": [{"query": dax_query}],
        "serializerSettings": {"includeNulls": True},
    }
    return api_json("POST", url, token, payload)


def get_measure_value(workspace_id: str, dataset_id: str, measure_name: str, token: str) -> float:
    dax = f"EVALUATE ROW(\"Value\", [{measure_name}])"
    data = execute_dax(workspace_id, dataset_id, dax, token)

    try:
        row = data["results"][0]["tables"][0]["rows"][0]
    except (KeyError, IndexError, TypeError):
        raise RuntimeError(f"Unexpected executeQueries response for measure '{measure_name}': {data}")

    if "Value" in row:
        value = row["Value"]
    elif "[Value]" in row:
        value = row["[Value]"]
    else:
        first_key = next(iter(row), None)
        value = row.get(first_key) if first_key else None

    if value is None:
        raise RuntimeError(f"Measure '{measure_name}' returned null.")

    try:
        return float(value)
    except (ValueError, TypeError):
        raise RuntimeError(f"Measure '{measure_name}' returned non-numeric value: {value!r}")


def list_measure_names(workspace_id: str, dataset_id: str, token: str) -> list[str]:
    try:
        data = execute_dax(
            workspace_id,
            dataset_id,
            "EVALUATE SELECTCOLUMNS(INFO.MEASURES(), \"Name\", [Name])",
            token,
        )
        rows = data.get("results", [{}])[0].get("tables", [{}])[0].get("rows", [])
        names: list[str] = []
        for row in rows:
            if "Name" in row:
                names.append(str(row["Name"]))
            elif "[Name]" in row:
                names.append(str(row["[Name]"]))
        return sorted(set(names))
    except Exception:
        return []


def update_external_kpi_value(content: str, kpi_name: str, value: int, last_updated: str) -> str:
    pattern = re.compile(
        rf"(\{{\s*name:\s*'{re.escape(kpi_name)}',\s*value:\s*)\d+(\s*,\s*unit:\s*'tickets',\s*source:\s*'[^']+',\s*lastUpdated:\s*')([^']*)(')",
        re.MULTILINE,
    )

    def repl(match: re.Match[str]) -> str:
        return f"{match.group(1)}{value}{match.group(2)}{last_updated}{match.group(4)}"

    new_content, count = pattern.subn(repl, content, count=1)
    if count != 1:
        raise RuntimeError(f"Could not find/update KPI '{kpi_name}' in data.js")
    return new_content


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync SNOW/ICM MTD from semantic model into data.js")
    parser.add_argument("--workspace-id", required=True, help="Fabric/Power BI workspace ID")
    parser.add_argument("--dataset-name", required=True, help="Semantic model (dataset) name")
    parser.add_argument("--data-file", default="data.js", help="Path to data.js")
    parser.add_argument("--snow-measure", default="SNOW Tickets MTD", help="Measure name for SNOW MTD")
    parser.add_argument("--icm-measure", default="ICM Tickets MTD", help="Measure name for ICM MTD")
    parser.add_argument("--snow-only", action="store_true", help="Update only SNOW Tickets MTD")
    parser.add_argument("--dry-run", action="store_true", help="Show fetched values, do not modify file")
    args = parser.parse_args()

    try:
        token = get_token(PBI_RESOURCE)
        dataset_id = find_dataset_id(args.workspace_id, args.dataset_name, token)

        snow_value = round(get_measure_value(args.workspace_id, dataset_id, args.snow_measure, token))
        icm_value: Optional[int] = None
        if not args.snow_only:
            icm_value = round(get_measure_value(args.workspace_id, dataset_id, args.icm_measure, token))

        print(f"Workspace: {args.workspace_id}")
        print(f"Dataset: {args.dataset_name} ({dataset_id})")
        print(f"Fetched SNOW Tickets MTD = {snow_value}")
        if icm_value is not None:
            print(f"Fetched ICM Tickets MTD = {icm_value}")

        if args.dry_run:
            print("Dry run only. No file changes made.")
            return 0

        data_file = Path(args.data_file)
        if not data_file.exists():
            raise RuntimeError(f"Data file not found: {data_file}")

        content = data_file.read_text(encoding="utf-8")
        today = dt.date.today().isoformat()

        content = update_external_kpi_value(content, "SNOW Tickets MTD", snow_value, today)
        if icm_value is not None:
            content = update_external_kpi_value(content, "ICM Tickets MTD", icm_value, today)

        data_file.write_text(content, encoding="utf-8")
        print(f"Updated {data_file} successfully.")
        return 0

    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)

        # Helpful fallback: suggest candidate measures
        try:
            token = get_token(PBI_RESOURCE)
            dataset_id = find_dataset_id(args.workspace_id, args.dataset_name, token)
            measures = list_measure_names(args.workspace_id, dataset_id, token)
            if measures:
                interesting = [m for m in measures if "snow" in m.lower() or "icm" in m.lower() or "ticket" in m.lower()]
                if interesting:
                    print("Possible measure names:", file=sys.stderr)
                    for name in interesting:
                        print(f"  - {name}", file=sys.stderr)
        except Exception:
            pass

        return 1


if __name__ == "__main__":
    raise SystemExit(main())
