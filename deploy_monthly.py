"""
Monthly SLS MBR deployment to Fabric via Git.

This orchestrates the full monthly pipeline:
  1. Export data.js to CSV files
  2. Upload CSVs to OneLake and load as Delta tables  
  3. Deploy TMDL semantic model + PBIR report via Git
  4. Trigger Enhanced Refresh so Direct Lake frames the data

Usage:
  python deploy_monthly.py                          # Full deployment
  python deploy_monthly.py --data-only              # Only reload data + refresh
  python deploy_monthly.py --report-only            # Only redeploy report + refresh
  python deploy_monthly.py --workspace scm-dev      # Specify workspace (default: scm-dev)
  python deploy_monthly.py --skip-refresh           # Deploy without refresh
  python deploy_monthly.py --dry-run                # Write report files locally only
"""

import argparse, json, logging, os, subprocess, sys, time
from pathlib import Path

LOG_FILE = Path(__file__).parent / "deploy_monthly.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, mode="w", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

MODEL_NAME = "SLS MBR"
AZ_CMD = r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if not os.path.exists(AZ_CMD):
    AZ_CMD = "az"


def get_token(resource):
    r = subprocess.run(
        [AZ_CMD, "account", "get-access-token", "--resource", resource,
         "--query", "accessToken", "-o", "tsv"],
        capture_output=True, text=True, timeout=30,
        shell=AZ_CMD.endswith(".cmd"))
    if r.returncode:
        raise RuntimeError(f"az token error: {r.stderr}")
    return r.stdout.strip()


def api(method, url, token, data=None):
    import urllib.request, urllib.error
    hdrs = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            txt = resp.read().decode()
            return resp.status, json.loads(txt) if txt.strip() else {}
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode()[:2000]}


def find_semantic_model_id(pbi_token, ws_id, model_name):
    """Find the semantic model (dataset) ID by name."""
    _, data = api("GET",
        f"https://api.powerbi.com/v1.0/myorg/groups/{ws_id}/datasets", pbi_token)
    for ds in data.get("value", []):
        if ds["name"] == model_name:
            return ds["id"]
    return None


def trigger_refresh(pbi_token, ws_id, ds_id):
    """Trigger Enhanced Refresh and poll until complete."""
    log.info(f"Triggering refresh for dataset {ds_id}...")
    url = f"https://api.powerbi.com/v1.0/myorg/groups/{ws_id}/datasets/{ds_id}/refreshes"
    code, data = api("POST", url, pbi_token, {"type": "Full"})

    if code not in (200, 202):
        log.error(f"Refresh trigger failed: {code} — {data}")
        return False

    # Poll for completion
    log.info("Refresh triggered, polling for completion...")
    for i in range(30):
        time.sleep(5)
        _, result = api("GET", f"{url}?$top=1", pbi_token)
        refreshes = result.get("value", [])
        if refreshes:
            status = refreshes[0].get("status", "Unknown")
            if status == "Completed":
                duration = ""
                start = refreshes[0].get("startTime", "")
                end = refreshes[0].get("endTime", "")
                if start and end:
                    duration = f" ({start} → {end})"
                log.info(f"Refresh completed!{duration}")
                return True
            elif status == "Failed":
                log.error(f"Refresh failed: {json.dumps(refreshes[0], indent=2)}")
                return False
            else:
                log.info(f"  Refresh status: {status} (poll {i+1})")
    log.error("Refresh timeout after 150s")
    return False


def run_script(script_name, extra_args=None):
    """Run a Python script as a subprocess."""
    cmd = [sys.executable, str(Path(__file__).parent / script_name)]
    if extra_args:
        cmd.extend(extra_args)
    log.info(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, timeout=600)
    if result.returncode != 0:
        log.error(f"{script_name} failed with exit code {result.returncode}")
        sys.exit(result.returncode)
    log.info(f"{script_name} completed successfully")


def main():
    parser = argparse.ArgumentParser(description="Monthly SLS MBR deployment pipeline")
    parser.add_argument("--workspace", default="scm-dev", help="Fabric workspace name")
    parser.add_argument("--data-only", action="store_true", help="Only reload data + refresh")
    parser.add_argument("--report-only", action="store_true", help="Only redeploy report + refresh")
    parser.add_argument("--skip-refresh", action="store_true", help="Skip the final refresh")
    parser.add_argument("--dry-run", action="store_true", help="Write report files locally only")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("SLS MBR MONTHLY DEPLOYMENT PIPELINE")
    log.info("=" * 60)
    log.info(f"Workspace: {args.workspace}")
    log.info(f"Options: data_only={args.data_only}, report_only={args.report_only}, "
             f"skip_refresh={args.skip_refresh}, dry_run={args.dry_run}")

    # Get workspace ID for refresh at the end
    fabric_token = get_token("https://api.fabric.microsoft.com")
    _, ws_data = api("GET", "https://api.fabric.microsoft.com/v1/workspaces", fabric_token)
    ws_id = None
    for ws in ws_data.get("value", []):
        if ws["displayName"].lower() == args.workspace.lower():
            ws_id = ws["id"]
            break
    if not ws_id:
        log.error(f"Workspace '{args.workspace}' not found")
        sys.exit(1)

    # Step 1: Load data to lakehouse
    if not args.report_only and not args.dry_run:
        log.info("")
        log.info("STEP 1: Export data and load to Lakehouse")
        log.info("-" * 40)
        run_script("load_data_to_lakehouse.py", ["--workspace", args.workspace])
    else:
        log.info("STEP 1: Skipped (--report-only or --dry-run)")

    # Step 2: Deploy report via Git
    if not args.data_only:
        log.info("")
        log.info("STEP 2: Deploy semantic model + report via Git")
        log.info("-" * 40)
        deploy_args = ["--workspace", args.workspace]
        if args.dry_run:
            deploy_args.append("--dry-run")
        if args.skip_refresh:
            deploy_args.append("--skip-refresh")
        run_script("deploy_report_to_fabric.py", deploy_args)
    else:
        log.info("STEP 2: Skipped (--data-only)")

    # Step 3: Trigger additional refresh if data was also updated
    if not args.skip_refresh and not args.dry_run and args.data_only:
        log.info("")
        log.info("STEP 3: Refresh semantic model")
        log.info("-" * 40)
        pbi_token = get_token("https://analysis.windows.net/powerbi/api")
        ds_id = find_semantic_model_id(pbi_token, ws_id, MODEL_NAME)
        if ds_id:
            trigger_refresh(pbi_token, ws_id, ds_id)
        else:
            log.warning(f"Semantic model '{MODEL_NAME}' not found - cannot refresh")

    log.info("")
    log.info("=" * 60)
    log.info("MONTHLY DEPLOYMENT COMPLETE")
    log.info("=" * 60)

    # Print summary
    log.info("")
    log.info("Next steps:")
    log.info("  1. Open Fabric portal and verify the report")
    log.info(f"     https://app.fabric.microsoft.com/groups/{ws_id}")
    log.info("  2. Check the 'SLS MBR Report' in the workspace")
    log.info("  3. Share the report with stakeholders as needed")


if __name__ == "__main__":
    main()
