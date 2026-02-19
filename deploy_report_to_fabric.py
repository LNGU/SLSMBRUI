"""
Deploy SLS MBR Report to Fabric via Git integration.

This script:
  1. Builds a TMDL semantic model for SLS MBR data (tables, relationships, measures)
  2. Builds a PBIR report (pages, visuals)
  3. Pushes both to the connected Azure DevOps Git repo
  4. Triggers "Update from Git" in Fabric to create/update the items
  5. Triggers Enhanced Refresh so Direct Lake frames the data

Prerequisites:
  - Azure CLI logged in (az login)
  - Workspace connected to Git (Azure DevOps)

Usage:
  python deploy_report_to_fabric.py --workspace scm-dev
  python deploy_report_to_fabric.py --workspace scm-dev --dry-run
  python deploy_report_to_fabric.py --workspace scm-dev --skip-refresh
"""

import argparse, json, logging, os, subprocess, sys, time, uuid
from pathlib import Path

LOG_FILE = Path(__file__).parent / "deploy_report_to_fabric.log"
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
REPORT_NAME = "SLS MBR Report"
AZ_CMD = r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if not os.path.exists(AZ_CMD):
    AZ_CMD = "az"

# Schema URL bases
FABRIC_SCHEMA = "https://developer.microsoft.com/json-schemas/fabric"
PLATFORM_SCHEMA = f"{FABRIC_SCHEMA}/gitIntegration/platformProperties/2.0.0/schema.json"
PBIR_SCHEMA = f"{FABRIC_SCHEMA}/item/report/definitionProperties/2.0.0/schema.json"
PBISM_SCHEMA = f"{FABRIC_SCHEMA}/item/semanticModel/definitionProperties/1.0.0/schema.json"
RPT = f"{FABRIC_SCHEMA}/item/report/definition"

# Lakehouse connection info for Direct Lake - these will be detected from workspace
WORKSPACE_ID = None  # Will be set dynamically
LAKEHOUSE_ID = None  # Will be set dynamically
ONELAKE_URL = "https://msit-onelake.dfs.fabric.microsoft.com"

# =============================================================================
# DATA MODEL DEFINITION - SLS MBR Tables
# =============================================================================

TMDL_TYPE = {
    "DateTime": "dateTime",
    "Int64": "int64",
    "String": "string",
    "Double": "double",
    "Boolean": "boolean",
}

TABLES = {
    "dim_Publisher": {
        "columns": [
            {"name": "publisher_id", "dataType": "Int64"},
            {"name": "name", "dataType": "String"},
            {"name": "title", "dataType": "String"},
            {"name": "type", "dataType": "String"},
            {"name": "contact", "dataType": "String"},
            {"name": "renewalDate", "dataType": "DateTime"},
            {"name": "status", "dataType": "String"},
            {"name": "savingsAmount", "dataType": "Double"},
            {"name": "savingsType", "dataType": "String"},
        ],
    },
    "dim_Date": {
        "columns": [
            {"name": "date", "dataType": "DateTime"},
            {"name": "year", "dataType": "Int64"},
            {"name": "month", "dataType": "Int64"},
            {"name": "month_name", "dataType": "String"},
            {"name": "quarter", "dataType": "Int64"},
            {"name": "fiscal_year", "dataType": "String"},
        ],
    },
    "fact_Spend": {
        "columns": [
            {"name": "publisher", "dataType": "String"},
            {"name": "companySpend", "dataType": "Double"},
            {"name": "msdSpend", "dataType": "Double"},
            {"name": "tiamSpend", "dataType": "Double"},
            {"name": "fiscalYear", "dataType": "String"},
            {"name": "notes", "dataType": "String"},
        ],
    },
    "fact_Risk": {
        "columns": [
            {"name": "publisher", "dataType": "String"},
            {"name": "sspa", "dataType": "String"},
            {"name": "po", "dataType": "String"},
            {"name": "finance", "dataType": "String"},
            {"name": "legal", "dataType": "String"},
            {"name": "inventory", "dataType": "String"},
            {"name": "details", "dataType": "String"},
        ],
    },
    "dim_ManagedTitle": {
        "columns": [
            {"name": "title", "dataType": "String"},
            {"name": "publisher", "dataType": "String"},
            {"name": "category", "dataType": "String"},
            {"name": "licenseCount", "dataType": "Int64"},
            {"name": "notes", "dataType": "String"},
        ],
    },
    "fact_ExternalKPI": {
        "columns": [
            {"name": "name", "dataType": "String"},
            {"name": "value", "dataType": "Double"},
            {"name": "unit", "dataType": "String"},
            {"name": "source", "dataType": "String"},
            {"name": "lastUpdated", "dataType": "DateTime"},
        ],
    },
}

RELATIONSHIPS = [
    {"fromTable": "fact_Spend", "fromColumn": "publisher",
     "toTable": "dim_Publisher", "toColumn": "name"},
    {"fromTable": "fact_Risk", "fromColumn": "publisher",
     "toTable": "dim_Publisher", "toColumn": "name"},
    {"fromTable": "dim_ManagedTitle", "fromColumn": "publisher",
     "toTable": "dim_Publisher", "toColumn": "name"},
]

MEASURES = [
    # Spend measures with formatting
    {"name": "Total Company Spend",
     "expression": "SUM(fact_Spend[companySpend])",
     "formatString": "$#,##0"},
    {"name": "Total MSD Spend",
     "expression": "SUM(fact_Spend[msdSpend])",
     "formatString": "$#,##0"},
    {"name": "Total TI&M Spend",
     "expression": "SUM(fact_Spend[tiamSpend])",
     "formatString": "$#,##0"},
    {"name": "Total Savings",
     "expression": "SUM(dim_Publisher[savingsAmount])",
     "formatString": "$#,##0"},
    
    # Formatted spend measures (with M/K suffixes)
    {"name": "Company Spend Fmt",
     "expression": (
         'VAR Spend = [Total Company Spend] '
         'RETURN IF(Spend >= 1000000, FORMAT(Spend / 1000000, "0.00") & "M", '
         'IF(Spend >= 1000, FORMAT(Spend / 1000, "0.0") & "K", FORMAT(Spend, "#,##0")))'
     )},
    {"name": "MSD Spend Fmt",
     "expression": (
         'VAR Spend = [Total MSD Spend] '
         'RETURN IF(Spend >= 1000000, FORMAT(Spend / 1000000, "0.00") & "M", '
         'IF(Spend >= 1000, FORMAT(Spend / 1000, "0.0") & "K", FORMAT(Spend, "#,##0")))'
     )},
    {"name": "TI&M Spend Fmt",
     "expression": (
         'VAR Spend = [Total TI&M Spend] '
         'RETURN IF(Spend >= 1000000, FORMAT(Spend / 1000000, "0.00") & "M", '
         'IF(Spend >= 1000, FORMAT(Spend / 1000, "0.0") & "K", FORMAT(Spend, "#,##0")))'
     )},
    {"name": "Savings Fmt",
     "expression": (
         'VAR Spend = [Total Savings] '
         'RETURN IF(Spend >= 1000000, "$" & FORMAT(Spend / 1000000, "0.00") & "M", '
         'IF(Spend >= 1000, "$" & FORMAT(Spend / 1000, "0.0") & "K", FORMAT(Spend, "$#,##0")))'
     )},
    
    # Counts
    {"name": "Managed Publishers",
     "expression": "DISTINCTCOUNT(dim_Publisher[name])",
     "formatString": "#,##0"},
    {"name": "Managed Titles",
     "expression": "DISTINCTCOUNT(dim_ManagedTitle[title])",
     "formatString": "#,##0"},
    
    # External KPIs
    {"name": "SNOW Tickets MTD",
     "expression": 'CALCULATE(SUM(fact_ExternalKPI[value]), fact_ExternalKPI[name] = "SNOW Tickets MTD")',
     "formatString": "#,##0"},
    {"name": "ICM Tickets MTD",
     "expression": 'CALCULATE(SUM(fact_ExternalKPI[value]), fact_ExternalKPI[name] = "ICM Tickets MTD")',
     "formatString": "#,##0"},
    
    # Risk counts by category
    {"name": "SSPA Risks",
     "expression": 'CALCULATE(DISTINCTCOUNT(fact_Risk[publisher]), fact_Risk[sspa] <> "")',
     "formatString": "#,##0"},
    {"name": "PO Risks",
     "expression": 'CALCULATE(DISTINCTCOUNT(fact_Risk[publisher]), fact_Risk[po] <> "")',
     "formatString": "#,##0"},
    {"name": "Finance Risks",
     "expression": 'CALCULATE(DISTINCTCOUNT(fact_Risk[publisher]), fact_Risk[finance] <> "")',
     "formatString": "#,##0"},
    {"name": "Legal Risks",
     "expression": 'CALCULATE(DISTINCTCOUNT(fact_Risk[publisher]), fact_Risk[legal] <> "")',
     "formatString": "#,##0"},
    {"name": "Inventory Risks",
     "expression": 'CALCULATE(DISTINCTCOUNT(fact_Risk[publisher]), fact_Risk[inventory] <> "")',
     "formatString": "#,##0"},
    {"name": "Total Risks",
     "expression": '[SSPA Risks] + [PO Risks] + [Finance Risks] + [Legal Risks] + [Inventory Risks]',
     "formatString": "#,##0"},
    
    # Renewal measures - all return 0 instead of blank, use INT for days
    {"name": "Days Until Next Renewal",
     "expression": (
         'VAR NextRenewal = CALCULATE(MIN(dim_Publisher[renewalDate]), '
         'dim_Publisher[renewalDate] >= TODAY()) '
         'RETURN IF(ISBLANK(NextRenewal), 0, INT(NextRenewal - TODAY()))'
     ),
     "formatString": "0"},
    {"name": "Next Renewal Publisher",
     "expression": (
         'VAR NextDate = CALCULATE(MIN(dim_Publisher[renewalDate]), '
         'dim_Publisher[renewalDate] >= TODAY()) '
         'RETURN IF(ISBLANK(NextDate), "None", '
         'CALCULATE(FIRSTNONBLANK(dim_Publisher[name], 1), '
         'dim_Publisher[renewalDate] = NextDate))'
     )},
    {"name": "Next Renewal Date",
     "expression": (
         'CALCULATE(MIN(dim_Publisher[renewalDate]), '
         'dim_Publisher[renewalDate] >= TODAY())'
     ),
     "formatString": "M/d/yyyy"},
    {"name": "Days Until Next Renewal Date",
     "expression": (
         'VAR NextDate = CALCULATE(MIN(dim_Publisher[renewalDate]), '
         'dim_Publisher[renewalDate] >= TODAY()) '
         'RETURN IF(ISBLANK(NextDate), 0, INT(NextDate - TODAY()))'
     ),
     "formatString": "0"},
    {"name": "Renewals This Quarter",
     "expression": (
         'VAR QEnd = EOMONTH(TODAY(), 3 - MOD(MONTH(TODAY()) - 1, 3) - 1) '
         'VAR Cnt = CALCULATE(DISTINCTCOUNT(dim_Publisher[name]), '
         'dim_Publisher[renewalDate] >= TODAY(), '
         'dim_Publisher[renewalDate] <= QEnd) '
         'RETURN IF(ISBLANK(Cnt), 0, Cnt)'
     ),
     "formatString": "0"},
    {"name": "Renewals This Year",
     "expression": (
         'VAR YEnd = DATE(YEAR(TODAY()), 12, 31) '
         'VAR Cnt = CALCULATE(DISTINCTCOUNT(dim_Publisher[name]), '
         'dim_Publisher[renewalDate] >= TODAY(), '
         'dim_Publisher[renewalDate] <= YEnd) '
         'RETURN IF(ISBLANK(Cnt), 0, Cnt)'
     ),
     "formatString": "0"},
    
    # Compliance measures
    {"name": "Past Due Renewals",
     "expression": (
         'VAR Cnt = CALCULATE(DISTINCTCOUNT(dim_Publisher[name]), '
         'dim_Publisher[renewalDate] < TODAY(), '
         'dim_Publisher[renewalDate] <> BLANK()) '
         'RETURN IF(ISBLANK(Cnt), 0, Cnt)'
     ),
     "formatString": "0"},
]


# =============================================================================
# API Helpers
# =============================================================================

def get_token(resource):
    r = subprocess.run(
        [AZ_CMD, "account", "get-access-token", "--resource", resource,
         "--query", "accessToken", "-o", "tsv"],
        capture_output=True, text=True, timeout=30, shell=AZ_CMD.endswith(".cmd"))
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


def poll_operation(location, token, max_polls=60, interval=5):
    for i in range(max_polls):
        time.sleep(interval)
        code, data, _ = api("GET", location, token)
        status = data.get("status", "unknown")
        log.info(f"  Poll {i+1}: {status}")
        if status in ("Succeeded", "Completed"):
            return True, data
        if status in ("Failed", "Cancelled"):
            return False, data
    return False, {"error": "timeout"}


# =============================================================================
# TMDL Semantic Model Builder
# =============================================================================

# Consistent logical IDs (based on MODEL_NAME + REPORT_NAME namespace)
# Using UUID5 with a namespace to ensure consistent IDs across deployments
NAMESPACE_UUID = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # DNS namespace


def deterministic_uuid(name):
    """Generate a consistent UUID based on a name."""
    return str(uuid.uuid5(NAMESPACE_UUID, f"slsmbr:{name}"))


class SemanticModelBuilder:
    """Builds TMDL semantic model files for Git integration."""

    def __init__(self, workspace_id, lakehouse_id):
        self._guids = {}
        self.workspace_id = workspace_id
        self.lakehouse_id = lakehouse_id

    def _guid(self, key=None):
        # Use deterministic UUID for key items, random for internal
        if key and key.startswith(("sm_", "rpt_")):
            g = deterministic_uuid(key)
        else:
            g = str(uuid.uuid4())
        if key:
            self._guids[key] = g
        return g

    def build_all_files(self):
        """Returns dict {relative_path: content_string}."""
        files = {}

        # .platform - use deterministic logical ID for semantic model
        files[".platform"] = json.dumps({
            "$schema": PLATFORM_SCHEMA,
            "metadata": {"type": "SemanticModel", "displayName": MODEL_NAME},
            "config": {"version": "2.0", "logicalId": deterministic_uuid(f"sm_{MODEL_NAME}")},
        }, indent=2)

        # definition.pbism
        files["definition.pbism"] = json.dumps({
            "$schema": PBISM_SCHEMA,
            "version": "4.2",
            "settings": {},
        }, indent=2)

        # definition/database.tmdl (1604 required for Direct Lake)
        files["definition/database.tmdl"] = "database\n\tcompatibilityLevel: 1604\n"

        # definition/model.tmdl
        files["definition/model.tmdl"] = self._build_model_tmdl()

        # definition/expressions.tmdl (Direct Lake connection)
        files["definition/expressions.tmdl"] = self._build_expressions_tmdl()

        # definition/relationships.tmdl
        files["definition/relationships.tmdl"] = self._build_relationships_tmdl()

        # definition/tables/*.tmdl
        for table_name, table_def in TABLES.items():
            measures = MEASURES if table_name == "fact_Spend" else []
            files[f"definition/tables/{table_name}.tmdl"] = self._build_table_tmdl(
                table_name, table_def, measures)

        return files

    def _build_model_tmdl(self):
        lines = [
            "model Model",
            "\tculture: en-US",
            "\tdefaultPowerBIDataSourceVersion: powerBI_V3",
            "\tsourceQueryCulture: en-US",
            "\tdataAccessOptions",
            "\t\tlegacyRedirects",
            "\t\treturnErrorValuesAsNull",
            "",
            'annotation PBI_QueryOrder = ["DirectLake - lakehouse"]',
            "",
            'annotation __PBI_TimeIntelligenceEnabled = 1',
            "",
            'annotation PBI_ProTooling = ["RemoteModeling","DirectLakeOnOneLakeCreatedInDesktop"]',
            "",
        ]
        for table_name in TABLES:
            lines.append(f"ref table {table_name}")
        lines.append("")
        lines.append("ref expression 'DirectLake - lakehouse'")
        lines.append("")
        lines.append("ref cultureInfo en-US")
        lines.append("")
        return "\n".join(lines)

    def _build_expressions_tmdl(self):
        """Build expressions.tmdl with the DirectLake Lakehouse connection."""
        return (
            "expression 'DirectLake - lakehouse' =\n"
            "\t\tlet\n"
            f"\t\t\tSource = AzureStorage.DataLake(\"{ONELAKE_URL}/{self.workspace_id}/{self.lakehouse_id}\", [HierarchicalNavigation=true])\n"
            "\t\tin\n"
            "\t\t\tSource\n"
            f"\tlineageTag: {self._guid('expr_dl')}\n"
            "\n"
            "\tannotation PBI_IncludeFutureArtifacts = False\n"
        )

    def _build_relationships_tmdl(self):
        lines = []
        for rel in RELATIONSHIPS:
            rid = self._guid()
            lines.append(f"relationship {rid}")
            if rel.get("manyToMany"):
                lines.append("\tfromCardinality: many")
                lines.append("\ttoCardinality: many")
            lines.append(f"\tfromColumn: {rel['fromTable']}.{rel['fromColumn']}")
            lines.append(f"\ttoColumn: {rel['toTable']}.{rel['toColumn']}")
            if rel.get("crossFilteringBehavior") == "bothDirections":
                lines.append("\tcrossFilteringBehavior: bothDirections")
            if rel.get("isActive") is False:
                lines.append("\tisActive: false")
            lines.append("")
        return "\n".join(lines)

    def _build_table_tmdl(self, name, table_def, measures=None):
        lines = [f"table {name}"]
        lines.append(f"\tlineageTag: {self._guid(f'table_{name}')}")
        lines.append(f"\tsourceLineageTag: [dbo].[{name}]")
        lines.append("")

        # Measures (added to fact_Spend)
        for m in (measures or []):
            mname = m["name"]
            expr = m["expression"]
            lines.append(f"\tmeasure '{mname}' = {expr}")
            if "formatString" in m:
                lines.append(f"\t\tformatString: {m['formatString']}")
            lines.append(f"\t\tlineageTag: {self._guid(f'measure_{mname}')}")
            lines.append("")

        # Columns
        for col in table_def["columns"]:
            cname = col["name"]
            tmdl_type = TMDL_TYPE[col["dataType"]]
            lines.append(f"\tcolumn {cname}")
            lines.append(f"\t\tdataType: {tmdl_type}")
            if tmdl_type == "dateTime":
                lines.append("\t\tformatString: General Date")
            elif tmdl_type in ("int64", "double"):
                lines.append("\t\tformatString: 0")
            lines.append(f"\t\tlineageTag: {self._guid(f'col_{name}_{cname}')}")
            lines.append(f"\t\tsourceLineageTag: {cname}")
            lines.append("\t\tsummarizeBy: none")
            lines.append(f"\t\tsourceColumn: {cname}")
            lines.append("")
            lines.append("\t\tannotation SummarizationSetBy = Automatic")
            lines.append("")

        # Partition - Direct Lake entity reference
        lines.append(f"\tpartition {name} = entity")
        lines.append("\t\tmode: directLake")
        lines.append("\t\tsource")
        lines.append(f"\t\t\tentityName: {name}")
        lines.append("\t\t\texpressionSource: 'DirectLake - lakehouse'")
        lines.append("")
        return "\n".join(lines)


# =============================================================================
# PBIR Report Builder
# =============================================================================

class ReportBuilder:
    """Builds PBIR report files for Git integration."""

    def __init__(self):
        self._vc = 0
        self.pages = {}

    def _vid(self):
        self._vc += 1
        return f"v{self._vc:04d}"

    # -- Field references --

    @staticmethod
    def _col(table, column):
        return {"Column": {"Expression": {"SourceRef": {"Entity": table}}, "Property": column}}

    @staticmethod
    def _measure(table, measure):
        return {"Measure": {"Expression": {"SourceRef": {"Entity": table}}, "Property": measure}}

    @staticmethod
    def _agg(table, column, func):
        return {"Aggregation": {
            "Expression": {"Column": {"Expression": {"SourceRef": {"Entity": table}}, "Property": column}},
            "Function": func}}

    # -- Visual helpers --

    def _title_obj(self, text, color=None):
        props = {
            "show": {"expr": {"Literal": {"Value": "true"}}},
            "text": {"expr": {"Literal": {"Value": f"'{text}'"}}}
        }
        if color:
            props["fontColor"] = {"solid": {"color": color}}
        return {"title": [{"properties": props}]}

    def _bg_obj(self, color):
        """Background styling for visual containers."""
        return {"background": [{"properties": {
            "show": {"expr": {"Literal": {"Value": "true"}}},
            "color": {"solid": {"color": color}},
            "transparency": {"expr": {"Literal": {"Value": "0D"}}}
        }}]}

    def styled_card(self, x, y, w, h, table, measure, title, bg_color="#2E5A84", text_color="#FFFFFF"):
        """Card with small title, normal value size."""
        name = self._vid()
        container_objs = {
            "title": [{"properties": {
                "show": {"expr": {"Literal": {"Value": "true"}}},
                "text": {"expr": {"Literal": {"Value": f"'{title}'"}}},
                "fontColor": {"solid": {"color": text_color}},
                "fontSize": {"expr": {"Literal": {"Value": "8D"}}}  # Very small title
            }}],
            "background": [{"properties": {
                "show": {"expr": {"Literal": {"Value": "true"}}},
                "color": {"solid": {"color": bg_color}},
                "transparency": {"expr": {"Literal": {"Value": "0D"}}}
            }}],
            "border": [{"properties": {
                "show": {"expr": {"Literal": {"Value": "true"}}},
                "color": {"solid": {"color": bg_color}},
                "radius": {"expr": {"Literal": {"Value": "6D"}}}
            }}]
        }
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "card",
                "query": {"queryState": {"Values": {"projections": [
                    {"field": self._measure(table, measure),
                     "queryRef": f"{table}.{measure}",
                     "nativeQueryRef": measure, "active": True}
                ]}}},
                "objects": {
                    "labels": [{"properties": {
                        "color": {"solid": {"color": text_color}},
                        "fontSize": {"expr": {"Literal": {"Value": "20D"}}}  # Normal value
                    }}],
                    "categoryLabels": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "false"}}}
                    }}]
                },
                "visualContainerObjects": container_objs,
                "drillFilterOtherVisuals": True,
            }
        }

    def card_measure(self, x, y, w, h, table, measure, title):
        """Standard card with small title, normal value."""
        name = self._vid()
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "card",
                "query": {"queryState": {"Values": {"projections": [
                    {"field": self._measure(table, measure),
                     "queryRef": f"{table}.{measure}",
                     "nativeQueryRef": measure, "active": True}
                ]}}},
                "objects": {
                    "labels": [{"properties": {
                        "fontSize": {"expr": {"Literal": {"Value": "18D"}}}  # Normal value
                    }}],
                    "categoryLabels": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "false"}}}
                    }}]
                },
                "visualContainerObjects": {
                    "title": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "true"}}},
                        "text": {"expr": {"Literal": {"Value": f"'{title}'"}}},
                        "fontSize": {"expr": {"Literal": {"Value": "8D"}}}  # Very small title
                    }}]
                },
                "drillFilterOtherVisuals": True,
            }
        }

    def slicer(self, x, y, w, h, table, column, title):
        name = self._vid()
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "slicer",
                "query": {"queryState": {"Values": {"projections": [
                    {"field": self._col(table, column),
                     "queryRef": f"{table}.{column}",
                     "nativeQueryRef": column, "active": True}
                ]}}},
                "objects": {
                    "data": [{"properties": {
                        "mode": {"expr": {"Literal": {"Value": "'Dropdown'"}}}
                    }}],
                    "general": [{"properties": {
                        "selfFilterEnabled": {"expr": {"Literal": {"Value": "true"}}}
                    }}],
                },
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def table_visual(self, x, y, w, h, columns, title):
        name = self._vid()
        projections = []
        for table, col, _ in columns:
            projections.append({
                "field": self._col(table, col),
                "queryRef": f"{table}.{col}",
                "nativeQueryRef": col, "active": True
            })
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "tableEx",
                "query": {"queryState": {"Values": {"projections": projections}}},
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def bar_chart(self, x, y, w, h, cat_table, cat_col, val_table, val_col, title, agg=0):
        name = self._vid()
        fn = {0: "Sum", 1: "Avg", 2: "DistinctCount"}.get(agg, "Sum")
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "clusteredBarChart",
                "query": {"queryState": {
                    "Category": {"projections": [
                        {"field": self._col(cat_table, cat_col),
                         "queryRef": f"{cat_table}.{cat_col}",
                         "nativeQueryRef": cat_col, "active": True}
                    ]},
                    "Y": {"projections": [
                        {"field": self._agg(val_table, val_col, agg),
                         "queryRef": f"{fn}({val_table}.{val_col})",
                         "nativeQueryRef": val_col, "active": True}
                    ]},
                }},
                "objects": {
                    "labels": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "true"}}}
                    }}]
                },
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def pie_chart(self, x, y, w, h, cat_table, cat_col, val_table, val_col, title, agg=0):
        name = self._vid()
        fn = {0: "Sum", 1: "Avg", 2: "DistinctCount"}.get(agg, "Sum")
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "pieChart",
                "query": {"queryState": {
                    "Category": {"projections": [
                        {"field": self._col(cat_table, cat_col),
                         "queryRef": f"{cat_table}.{cat_col}",
                         "nativeQueryRef": cat_col, "active": True}
                    ]},
                    "Y": {"projections": [
                        {"field": self._agg(val_table, val_col, agg),
                         "queryRef": f"{fn}({val_table}.{val_col})",
                         "nativeQueryRef": val_col, "active": True}
                    ]},
                }},
                "objects": {
                    "labels": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "true"}}}
                    }}]
                },
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def donut_chart(self, x, y, w, h, cat_table, cat_col, val_table, val_col, title, agg=0):
        name = self._vid()
        fn = {0: "Sum", 1: "Avg", 2: "DistinctCount"}.get(agg, "Sum")
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "donutChart",
                "query": {"queryState": {
                    "Category": {"projections": [
                        {"field": self._col(cat_table, cat_col),
                         "queryRef": f"{cat_table}.{cat_col}",
                         "nativeQueryRef": cat_col, "active": True}
                    ]},
                    "Y": {"projections": [
                        {"field": self._agg(val_table, val_col, agg),
                         "queryRef": f"{fn}({val_table}.{val_col})",
                         "nativeQueryRef": val_col, "active": True}
                    ]},
                }},
                "objects": {
                    "labels": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "true"}}},
                        "labelStyle": {"expr": {"Literal": {"Value": "'Both'"}}},
                    }}]
                },
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def column_chart(self, x, y, w, h, cat_table, cat_col, val_table, val_col, title, agg=0):
        """Clustered column chart (vertical bars)."""
        name = self._vid()
        fn = {0: "Sum", 1: "Avg", 2: "DistinctCount"}.get(agg, "Sum")
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "clusteredColumnChart",
                "query": {"queryState": {
                    "Category": {"projections": [
                        {"field": self._col(cat_table, cat_col),
                         "queryRef": f"{cat_table}.{cat_col}",
                         "nativeQueryRef": cat_col, "active": True}
                    ]},
                    "Y": {"projections": [
                        {"field": self._agg(val_table, val_col, agg),
                         "queryRef": f"{fn}({val_table}.{val_col})",
                         "nativeQueryRef": val_col, "active": True}
                    ]},
                }},
                "objects": {
                    "labels": [{"properties": {
                        "show": {"expr": {"Literal": {"Value": "true"}}},
                    }}]
                },
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def multi_row_card(self, x, y, w, h, measures, title):
        """Multi-row card showing multiple measures."""
        name = self._vid()
        projections = []
        for table, measure in measures:
            projections.append({
                "field": self._measure(table, measure),
                "queryRef": f"{table}.{measure}",
                "nativeQueryRef": measure, "active": True
            })
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "multiRowCard",
                "query": {"queryState": {"Values": {"projections": projections}}},
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    def matrix_visual(self, x, y, w, h, rows, cols, values, title):
        """Matrix/heatmap visual."""
        name = self._vid()
        row_projs = []
        for table, col in rows:
            row_projs.append({
                "field": self._col(table, col),
                "queryRef": f"{table}.{col}",
                "nativeQueryRef": col, "active": True
            })
        col_projs = []
        for table, col in cols:
            col_projs.append({
                "field": self._col(table, col),
                "queryRef": f"{table}.{col}",
                "nativeQueryRef": col, "active": True
            })
        val_projs = []
        for table, measure in values:
            val_projs.append({
                "field": self._measure(table, measure),
                "queryRef": f"{table}.{measure}",
                "nativeQueryRef": measure, "active": True
            })
        return name, {
            "$schema": f"{RPT}/visualContainer/2.5.0/schema.json",
            "name": name,
            "position": {"x": x, "y": y, "width": w, "height": h, "z": 0, "tabOrder": 0},
            "visual": {
                "visualType": "pivotTable",
                "query": {"queryState": {
                    "Rows": {"projections": row_projs} if row_projs else None,
                    "Columns": {"projections": col_projs} if col_projs else None,
                    "Values": {"projections": val_projs} if val_projs else None,
                }},
                "visualContainerObjects": self._title_obj(title),
                "drillFilterOtherVisuals": True,
            }
        }

    # -- Pages --

    def build_page1(self):
        """Overview page with clean design principles."""
        pid = "overview"
        visuals = {}
        
        # ===== DESIGN SYSTEM =====
        # Limited color palette (5 colors max)
        PRIMARY = "#1E3A5F"      # Navy - key financial metrics
        SUCCESS = "#107C10"      # Green - savings, positive indicators  
        WARNING = "#D83B01"      # Orange - renewals, attention needed
        DANGER = "#D13438"       # Red - risks, alerts
        NEUTRAL = "#605E5C"      # Gray - secondary metrics
        WHITE = "#FFFFFF"
        
        # Page: Standard 16:9 (optimized for most displays)
        page_w = 1280
        page_h = 720
        
        # Grid system: 20px margins, 16px gaps within groups, 24px between sections
        margin = 20
        gap = 12
        section_gap = 24
        
        # ===== ROW 1: HERO KPIs (Most important - top left) =====
        # 3 large spend cards - visual hierarchy through size
        hero_y = margin
        hero_h = 110
        hero_w = 180
        
        vid, v = self.styled_card(margin, hero_y, hero_w, hero_h, 
            "fact_Spend", "Total Company Spend", "Company Spend", PRIMARY, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(margin + hero_w + gap, hero_y, hero_w, hero_h,
            "fact_Spend", "Total MSD Spend", "MSD Spend", PRIMARY, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(margin + 2*(hero_w + gap), hero_y, hero_w, hero_h,
            "fact_Spend", "Total TI&M Spend", "TI&M Spend", PRIMARY, WHITE)
        visuals[vid] = v
        
        # 4 secondary KPIs (smaller, right side of top row)
        sec_w = 130
        sec_h = 110
        sec_x = margin + 3*(hero_w + gap) + section_gap
        
        vid, v = self.card_measure(sec_x, hero_y, sec_w, sec_h, "fact_Spend", "SNOW Tickets MTD", "SNOW Tickets")
        visuals[vid] = v
        vid, v = self.card_measure(sec_x + sec_w + gap, hero_y, sec_w, sec_h, "fact_Spend", "ICM Tickets MTD", "ICM Tickets")
        visuals[vid] = v
        vid, v = self.card_measure(sec_x + 2*(sec_w + gap), hero_y, sec_w, sec_h, "fact_Spend", "Managed Titles", "Titles")
        visuals[vid] = v
        vid, v = self.card_measure(sec_x + 3*(sec_w + gap), hero_y, sec_w, sec_h, "fact_Spend", "Managed Publishers", "Publishers")
        visuals[vid] = v

        # ===== ROW 2: MIDDLE SECTION (Charts + Risk Summary) =====
        row2_y = hero_y + hero_h + section_gap
        row2_h = 240
        
        # Left: Potential Savings donut (part-to-whole with few categories)
        vid, v = self.donut_chart(margin, row2_y, 320, row2_h,
            "dim_Publisher", "name", "dim_Publisher", "savingsAmount",
            "Potential Savings by Publisher")
        visuals[vid] = v

        # Center: Risk summary - horizontal layout for quick scanning
        risk_x = margin + 320 + section_gap
        risk_card_w = 85
        risk_card_h = 70
        
        # Risk category cards with status colors
        for i, (measure, label, color) in enumerate([
            ("SSPA Risks", "SSPA", DANGER),
            ("PO Risks", "PO", WARNING),
            ("Finance Risks", "Finance", "#8764B8"),
            ("Legal Risks", "Legal", WARNING),
            ("Inventory Risks", "Inventory", DANGER),
        ]):
            vid, v = self.styled_card(risk_x + i*(risk_card_w + 8), row2_y, risk_card_w, risk_card_h,
                                      "fact_Spend", measure, label, color, WHITE)
            visuals[vid] = v
        
        # Total risks + savings cards (stacked below)
        vid, v = self.styled_card(risk_x, row2_y + risk_card_h + gap, 230, 85,
                                  "fact_Spend", "Total Risks", "Total Risks Tracked", NEUTRAL, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(risk_x + 240, row2_y + risk_card_h + gap, 230, 85,
                                  "fact_Spend", "Total Savings", "Potential Savings", SUCCESS, WHITE)
        visuals[vid] = v

        # Right: Renewal countdown (attention area)
        renewal_x = 1020
        renewal_w = 240
        
        vid, v = self.styled_card(renewal_x, row2_y, renewal_w, 70,
            "fact_Spend", "Days Until Next Renewal", "Days to Next Renewal", WARNING, WHITE)
        visuals[vid] = v
        vid, v = self.card_measure(renewal_x, row2_y + 75, renewal_w, 65,
            "fact_Spend", "Next Renewal Publisher", "Next Publisher")
        visuals[vid] = v
        vid, v = self.card_measure(renewal_x, row2_y + 145, renewal_w, 65,
            "fact_Spend", "Next Renewal Date", "Renewal Date")
        visuals[vid] = v
        vid, v = self.styled_card(renewal_x, row2_y + 215, 115, 65,
            "fact_Spend", "Renewals This Quarter", "This Quarter", SUCCESS, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(renewal_x + 125, row2_y + 215, 115, 65,
            "fact_Spend", "Past Due Renewals", "Past Due", DANGER, WHITE)
        visuals[vid] = v

        # ===== ROW 3: DETAIL SECTION (Tables + Charts) =====
        row3_y = row2_y + row2_h + section_gap
        row3_h = 270

        # Left: Spend by Publisher bar chart (comparison)
        vid, v = self.bar_chart(margin, row3_y, 380, row3_h,
            "fact_Spend", "publisher", "fact_Spend", "companySpend",
            "Annual Spend by Publisher")
        visuals[vid] = v

        # Center: Risk table (when exact values needed)
        vid, v = self.table_visual(margin + 380 + section_gap, row3_y, 460, row3_h, [
            ("fact_Risk", "publisher", "Publisher"),
            ("fact_Risk", "sspa", "SSPA"),
            ("fact_Risk", "po", "PO"),
            ("fact_Risk", "finance", "Finance"),
            ("fact_Risk", "legal", "Legal"),
            ("fact_Risk", "inventory", "Inventory"),
        ], "Risk Details by Publisher")
        visuals[vid] = v

        # Right: Compliance status donut
        vid, v = self.donut_chart(margin + 380 + section_gap + 460 + section_gap, row3_y, 230, row3_h,
            "dim_Publisher", "status", "dim_Publisher", "name",
            "Compliance Status", agg=2)
        visuals[vid] = v

        self.pages[pid] = {
            "page": {
                "$schema": f"{RPT}/page/2.0.0/schema.json",
                "name": pid,
                "displayName": "SLS MBR Overview",
                "displayOption": "FitToPage",
                "height": page_h,
                "width": page_w,
                "objects": {
                    "background": [{"properties": {
                        "color": {"solid": {"color": "#FAFAFA"}},  # Very light gray
                        "transparency": {"expr": {"Literal": {"Value": "0D"}}}
                    }}]
                }
            },
            "visuals": visuals,
        }

    def build_page2(self):
        """Publishers/Renewals detail page with clean design."""
        pid = "publishers"
        visuals = {}
        
        # Design system
        page_w = 1280
        page_h = 720
        margin = 20
        gap = 12
        section_gap = 24
        
        # Colors
        WARNING = "#D83B01"
        SUCCESS = "#107C10"
        DANGER = "#D13438"
        WHITE = "#FFFFFF"

        # Row 1: Slicers (top, consistent placement)
        slicer_w = 150
        slicer_h = 50
        for i, (col, label) in enumerate([
            ("type", "Type"),
            ("status", "Status"),
            ("contact", "Contact"),
        ]):
            vid, v = self.slicer(margin + i*(slicer_w + gap), margin, slicer_w, slicer_h, 
                                "dim_Publisher", col, label)
            visuals[vid] = v

        # Row 2: Main table + sidebar KPIs
        table_y = margin + slicer_h + section_gap
        table_h = 340
        
        vid, v = self.table_visual(margin, table_y, 860, table_h, [
            ("dim_Publisher", "name", "Publisher"),
            ("dim_Publisher", "title", "Titles"),
            ("dim_Publisher", "type", "Type"),
            ("dim_Publisher", "contact", "Contact"),
            ("dim_Publisher", "renewalDate", "Renewal Date"),
            ("dim_Publisher", "status", "Status"),
            ("dim_Publisher", "savingsAmount", "Savings"),
        ], "Publishers & Renewal Details")
        visuals[vid] = v

        # Sidebar: Renewal countdown cards
        card_x = margin + 860 + section_gap
        card_w = 180
        card_h = 85
        
        vid, v = self.styled_card(card_x, table_y, card_w, card_h, 
            "fact_Spend", "Days Until Next Renewal", "Days to Renewal", WARNING, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(card_x, table_y + card_h + gap, card_w, card_h,
            "fact_Spend", "Renewals This Quarter", "This Quarter", SUCCESS, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(card_x, table_y + 2*(card_h + gap), card_w, card_h,
            "fact_Spend", "Renewals This Year", "This Year", SUCCESS, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(card_x, table_y + 3*(card_h + gap), card_w, card_h,
            "fact_Spend", "Past Due Renewals", "Past Due", DANGER, WHITE)
        visuals[vid] = v

        # Row 3: Two comparison bar charts
        row3_y = table_y + table_h + section_gap
        chart_h = 720 - row3_y - margin
        chart_w = (page_w - 2*margin - section_gap) // 2
        
        vid, v = self.bar_chart(margin, row3_y, chart_w, chart_h,
            "fact_Spend", "publisher", "fact_Spend", "companySpend",
            "Company Spend by Publisher")
        visuals[vid] = v

        vid, v = self.bar_chart(margin + chart_w + section_gap, row3_y, chart_w, chart_h,
            "fact_Spend", "publisher", "fact_Spend", "msdSpend",
            "MSD Spend by Publisher")
        visuals[vid] = v

        self.pages[pid] = {
            "page": {
                "$schema": f"{RPT}/page/2.0.0/schema.json",
                "name": pid,
                "displayName": "Publishers & Renewals",
                "displayOption": "FitToPage",
                "height": page_h,
                "width": page_w,
                "objects": {
                    "background": [{"properties": {
                        "color": {"solid": {"color": "#FAFAFA"}},
                        "transparency": {"expr": {"Literal": {"Value": "0D"}}}
                    }}]
                }
            },
            "visuals": visuals,
        }

    def build_page3(self):
        """Risk Details page with clean design."""
        pid = "risks"
        visuals = {}
        
        # Design system
        page_w = 1280
        page_h = 720
        margin = 20
        gap = 12
        section_gap = 24
        
        # Colors (status-based)
        DANGER = "#D13438"
        WARNING = "#D83B01"
        NEUTRAL = "#605E5C"
        WHITE = "#FFFFFF"

        # Row 1: Risk summary cards (visual hierarchy - most important first)
        card_y = margin
        card_h = 70
        card_w = 120
        
        # Total risks first (most important)
        vid, v = self.styled_card(margin, card_y, 150, card_h, 
            "fact_Spend", "Total Risks", "Total Risks", NEUTRAL, WHITE)
        visuals[vid] = v
        
        # Individual risk categories
        for i, (measure, label, color) in enumerate([
            ("SSPA Risks", "SSPA", DANGER),
            ("PO Risks", "PO", WARNING),
            ("Finance Risks", "Finance", "#8764B8"),
            ("Legal Risks", "Legal", WARNING),
            ("Inventory Risks", "Inventory", DANGER),
        ]):
            vid, v = self.styled_card(margin + 150 + section_gap + i*(card_w + gap), card_y, card_w, card_h,
                                      "fact_Spend", measure, label, color, WHITE)
            visuals[vid] = v

        # Row 2: Full risk details table
        table_y = card_y + card_h + section_gap
        table_h = page_h - table_y - margin
        
        vid, v = self.table_visual(margin, table_y, page_w - 2*margin, table_h, [
            ("fact_Risk", "publisher", "Publisher"),
            ("fact_Risk", "sspa", "SSPA"),
            ("fact_Risk", "po", "PO"),
            ("fact_Risk", "finance", "Finance"),
            ("fact_Risk", "legal", "Legal"),
            ("fact_Risk", "inventory", "Inventory"),
            ("fact_Risk", "details", "Details"),
        ], "Risk Details by Publisher")
        visuals[vid] = v

        self.pages[pid] = {
            "page": {
                "$schema": f"{RPT}/page/2.0.0/schema.json",
                "name": pid,
                "displayName": "Risk Details",
                "displayOption": "FitToPage",
                "height": page_h,
                "width": page_w,
                "objects": {
                    "background": [{"properties": {
                        "color": {"solid": {"color": "#FAFAFA"}},
                        "transparency": {"expr": {"Literal": {"Value": "0D"}}}
                    }}]
                }
            },
            "visuals": visuals,
        }

    def build_page4(self):
        """Managed Titles page with clean design."""
        pid = "titles"
        visuals = {}
        
        # Design system
        page_w = 1280
        page_h = 720
        margin = 20
        gap = 12
        section_gap = 24
        
        PRIMARY = "#1E3A5F"
        WHITE = "#FFFFFF"

        # Row 1: Summary cards + slicer
        card_y = margin
        card_h = 70
        card_w = 160
        
        vid, v = self.styled_card(margin, card_y, card_w, card_h,
            "fact_Spend", "Managed Titles", "Managed Titles", PRIMARY, WHITE)
        visuals[vid] = v
        vid, v = self.styled_card(margin + card_w + gap, card_y, card_w, card_h,
            "fact_Spend", "Managed Publishers", "Publishers", PRIMARY, WHITE)
        visuals[vid] = v
        
        # Slicer
        vid, v = self.slicer(margin + 2*(card_w + gap) + section_gap, card_y, 200, card_h, 
            "dim_ManagedTitle", "publisher", "Filter by Publisher")
        visuals[vid] = v

        # Row 2: Titles table (full width)
        table_y = card_y + card_h + section_gap
        table_h = page_h - table_y - margin
        
        vid, v = self.table_visual(margin, table_y, page_w - 2*margin, table_h, [
            ("dim_ManagedTitle", "title", "Title"),
            ("dim_ManagedTitle", "publisher", "Publisher"),
            ("dim_ManagedTitle", "category", "Category"),
            ("dim_ManagedTitle", "notes", "Notes"),
        ], "Managed Software Titles")
        visuals[vid] = v

        self.pages[pid] = {
            "page": {
                "$schema": f"{RPT}/page/2.0.0/schema.json",
                "name": pid,
                "displayName": "Managed Titles",
                "displayOption": "FitToPage",
                "height": page_h,
                "width": page_w,
                "objects": {
                    "background": [{"properties": {
                        "color": {"solid": {"color": "#FAFAFA"}},
                        "transparency": {"expr": {"Literal": {"Value": "0D"}}}
                    }}]
                }
            },
            "visuals": visuals,
        }

    def build_all_files(self):
        """Returns dict {relative_path: json_string}."""
        self.build_page1()
        self.build_page2()
        self.build_page3()
        self.build_page4()
        files = {}

        # Use deterministic logical ID for report
        files[".platform"] = json.dumps({
            "$schema": PLATFORM_SCHEMA,
            "metadata": {"type": "Report", "displayName": REPORT_NAME},
            "config": {"version": "2.0", "logicalId": deterministic_uuid(f"rpt_{REPORT_NAME}")},
        }, indent=2)

        files["definition.pbir"] = json.dumps({
            "$schema": PBIR_SCHEMA,
            "version": "4.0",
            "datasetReference": {
                "byPath": {"path": f"../{MODEL_NAME}.SemanticModel"}
            },
        }, indent=2)

        files["definition/report.json"] = json.dumps({
            "$schema": f"{RPT}/report/3.1.0/schema.json",
            "themeCollection": {
                "baseTheme": {
                    "name": "CY25SU10",
                    "reportVersionAtImport": {
                        "visual": "2.1.0",
                        "report": "3.0.0",
                        "page": "2.3.0",
                    },
                    "type": "SharedResources",
                }
            },
        }, indent=2)

        files["definition/version.json"] = json.dumps({
            "$schema": f"{RPT}/versionMetadata/1.0.0/schema.json",
            "version": "2.0.0",
        }, indent=2)

        for page_id, page_data in self.pages.items():
            files[f"definition/pages/{page_id}/page.json"] = json.dumps(page_data["page"], indent=2)
            for vid, visual in page_data["visuals"].items():
                files[f"definition/pages/{page_id}/visuals/{vid}/visual.json"] = json.dumps(visual, indent=2)

        return files


# =============================================================================
# Azure DevOps Git Push
# =============================================================================

def get_branch_tip(ado_token, org, project, repo, branch):
    import urllib.request, urllib.parse
    url = (f"https://dev.azure.com/{org}/{urllib.parse.quote(project)}"
           f"/_apis/git/repositories/{urllib.parse.quote(repo)}"
           f"/refs?filter=heads/{urllib.parse.quote(branch)}&api-version=7.0")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {ado_token}"})
    data = json.loads(urllib.request.urlopen(req).read().decode())
    for ref in data.get("value", []):
        if ref["name"] == f"refs/heads/{branch}":
            return ref["objectId"]
    raise RuntimeError(f"Branch '{branch}' not found")


def list_files_in_path(ado_token, org, project, repo, branch, path):
    import urllib.request, urllib.parse, urllib.error
    url = (f"https://dev.azure.com/{org}/{urllib.parse.quote(project)}"
           f"/_apis/git/repositories/{urllib.parse.quote(repo)}"
           f"/items?scopePath={urllib.parse.quote(path)}"
           f"&recursionLevel=Full"
           f"&versionDescriptor.version={urllib.parse.quote(branch)}"
           f"&versionDescriptor.versionType=branch&api-version=7.0")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {ado_token}"})
    try:
        data = json.loads(urllib.request.urlopen(req).read().decode())
        return [item["path"] for item in data.get("value", []) if not item.get("isFolder")]
    except urllib.error.HTTPError:
        return []


def push_files_to_ado(ado_token, org, project, repo, branch, folders_files, old_commit, commit_message):
    """Push files for multiple folders in one commit.
    folders_files: dict {folder_path: {relative_path: content}}
    """
    import urllib.request, urllib.parse, urllib.error

    # Gather existing files for all folders
    all_existing = {}
    for folder_path in folders_files:
        existing = list_files_in_path(ado_token, org, project, repo, branch, folder_path)
        for f in existing:
            all_existing[f] = True
        log.info(f"  {folder_path}: {len(existing)} existing files")

    # Build changes
    changes = []
    new_paths = set()

    for folder_path, file_map in folders_files.items():
        for rel, content in file_map.items():
            full_path = f"{folder_path}/{rel}"
            new_paths.add(full_path)
            change_type = "edit" if full_path in all_existing else "add"
            changes.append({
                "changeType": change_type,
                "item": {"path": full_path},
                "newContent": {"content": content, "contentType": "rawtext"},
            })

    # Delete stale files
    for old_path in all_existing:
        if old_path not in new_paths:
            changes.append({"changeType": "delete", "item": {"path": old_path}})

    log.info(f"  Total changes: {len(changes)}")

    push_body = {
        "refUpdates": [{"name": f"refs/heads/{branch}", "oldObjectId": old_commit}],
        "commits": [{"comment": commit_message, "changes": changes}],
    }

    url = (f"https://dev.azure.com/{org}/{urllib.parse.quote(project)}"
           f"/_apis/git/repositories/{urllib.parse.quote(repo)}"
           f"/pushes?api-version=7.0")
    body = json.dumps(push_body).encode()
    req = urllib.request.Request(url, data=body, method="POST",
                                headers={"Authorization": f"Bearer {ado_token}",
                                         "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return True, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return False, {"error": e.read().decode()[:2000]}


def trigger_refresh(pbi_token, ws_id, ds_id):
    """Trigger Enhanced Refresh and poll until complete."""
    log.info(f"Triggering refresh for dataset {ds_id}...")
    url = f"https://api.powerbi.com/v1.0/myorg/groups/{ws_id}/datasets/{ds_id}/refreshes"
    code, data, _ = api("POST", url, pbi_token, {"type": "Full"})

    if code not in (200, 202):
        log.error(f"Refresh trigger failed: {code} — {data}")
        return False

    # Poll for completion
    log.info("Refresh triggered, polling for completion...")
    for i in range(30):
        time.sleep(5)
        _, result, _ = api("GET", f"{url}?$top=1", pbi_token)
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


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Deploy SLS MBR semantic model + report via Git")
    parser.add_argument("--workspace", default="scm-dev")
    parser.add_argument("--dry-run", action="store_true", help="Write files locally only")
    parser.add_argument("--skip-refresh", action="store_true", help="Skip the semantic model refresh")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("SLS MBR FABRIC DEPLOYMENT")
    log.info("=" * 60)

    fabric_token = get_token("https://api.fabric.microsoft.com")
    ado_token = get_token("499b84ac-1321-427f-aa17-267ca6975798")

    # -- Find workspace --
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

    # -- Find lakehouse in workspace --
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

    # -- Build semantic model files --
    sm_builder = SemanticModelBuilder(ws_id, lakehouse_id)
    sm_files = sm_builder.build_all_files()
    log.info(f"Semantic model: {len(TABLES)} tables, {len(RELATIONSHIPS)} relationships, "
             f"{len(MEASURES)} measures, {len(sm_files)} files")

    # -- Build report files --
    rpt_builder = ReportBuilder()
    rpt_files = rpt_builder.build_all_files()
    total_visuals = sum(len(p["visuals"]) for p in rpt_builder.pages.values())
    log.info(f"Report: {len(rpt_builder.pages)} pages, {total_visuals} visuals, {len(rpt_files)} files")

    if args.dry_run:
        debug_dir = Path("debug_report_fabric")
        for prefix, files in [
            (f"{MODEL_NAME}.SemanticModel", sm_files),
            (f"{REPORT_NAME}.Report", rpt_files),
        ]:
            for path, content in files.items():
                out = debug_dir / prefix / path
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_text(content, encoding="utf-8")
                log.info(f"  {prefix}/{path}")
        log.info(f"Dry run complete — files at {debug_dir}/")
        return

    # -- Get Git connection --
    _, git_conn, _ = api("GET",
        f"https://api.fabric.microsoft.com/v1/workspaces/{ws_id}/git/connection",
        fabric_token)
    git_details = git_conn.get("gitProviderDetails", {})
    if git_conn.get("gitConnectionState") != "ConnectedAndInitialized":
        log.error(f"Git not connected: {git_conn.get('gitConnectionState')}")
        sys.exit(1)

    org = git_details["organizationName"]
    project = git_details["projectName"]
    repo = git_details["repositoryName"]
    branch = git_details["branchName"]
    git_dir = git_details.get("directoryName", "").rstrip("/")
    log.info(f"Git: {org}/{project}/{repo} branch={branch} dir={git_dir}")

    # -- Push to Git --
    old_tip = get_branch_tip(ado_token, org, project, repo, branch)
    log.info(f"Branch tip: {old_tip[:12]}...")

    sm_folder = f"{git_dir}/{MODEL_NAME}.SemanticModel"
    rpt_folder = f"{git_dir}/{REPORT_NAME}.Report"

    import datetime
    commit_msg = f"Deploy {MODEL_NAME} semantic model + report - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}"

    log.info("Pushing semantic model + report to Git ...")
    ok, result = push_files_to_ado(ado_token, org, project, repo, branch,
        {sm_folder: sm_files, rpt_folder: rpt_files}, old_tip, commit_msg)

    if not ok:
        log.error(f"Git push failed: {json.dumps(result, indent=2)}")
        sys.exit(1)

    new_commit = result.get("commits", [{}])[0].get("commitId", "unknown")
    log.info(f"Pushed! New commit: {new_commit[:12]}...")

    # -- Update workspace from Git --
    log.info("Triggering 'Update from Git' ...")
    time.sleep(3)

    code, status_data, status_headers = api("GET",
        f"https://api.fabric.microsoft.com/v1/workspaces/{ws_id}/git/status",
        fabric_token)
    if code == 202:
        loc = status_headers.get("Location", "")
        if loc:
            ok, status_data = poll_operation(loc, fabric_token)
            if not ok:
                log.error(f"Git status poll failed: {status_data}")
                sys.exit(1)

    workspace_head = status_data.get("workspaceHead", "")
    remote_commit = status_data.get("remoteCommitHash", "")
    changes = status_data.get("changes", [])
    log.info(f"workspace_head={workspace_head[:12] if workspace_head else 'N/A'}..., remote={remote_commit[:12] if remote_commit else 'N/A'}...")
    log.info(f"Changes: {len(changes)}")
    for c in changes:
        meta = c.get("itemMetadata", {})
        log.info(f"  {c.get('remoteChange', '?')}: {meta.get('itemType', '?')} - {meta.get('displayName', '?')}")

    if not changes:
        log.warning("No changes detected - items may already be up to date")
    else:
        update_body = {
            "remoteCommitHash": remote_commit,
            "workspaceHead": workspace_head,
            "conflictResolution": {
                "conflictResolutionType": "Workspace",
                "conflictResolutionPolicy": "PreferRemote",
            },
            "options": {"allowOverrideItems": True},
        }

        code, data, headers = api("POST",
            f"https://api.fabric.microsoft.com/v1/workspaces/{ws_id}/git/updateFromGit",
            fabric_token, update_body)
        log.info(f"Update from Git response: {code}")

        if code == 200:
            log.info("Update completed synchronously!")
        elif code == 202:
            loc = headers.get("Location", "")
            if loc:
                ok, result = poll_operation(loc, fabric_token, max_polls=60, interval=5)
                if ok:
                    log.info("Update from Git completed successfully!")
                else:
                    log.error(f"Update failed: {json.dumps(result, indent=2)}")
                    sys.exit(1)
        else:
            log.error(f"Update from Git error: {json.dumps(data, indent=2)}")
            sys.exit(1)

    # -- Verify and Refresh --
    time.sleep(3)
    pbi_token = get_token("https://analysis.windows.net/powerbi/api")

    # Find semantic model
    ds_id = None
    _, ds_data, _ = api("GET",
        f"https://api.powerbi.com/v1.0/myorg/groups/{ws_id}/datasets", pbi_token)
    for ds in ds_data.get("value", []):
        if ds["name"] == MODEL_NAME:
            ds_id = ds["id"]
            log.info(f"Semantic model: {ds_id}")
            break
    else:
        log.warning("Semantic model not found - check Fabric portal")

    # Find report
    _, rpt_data, _ = api("GET",
        f"https://api.powerbi.com/v1.0/myorg/groups/{ws_id}/reports", pbi_token)
    for r in rpt_data.get("value", []):
        if r["name"] == REPORT_NAME:
            log.info(f"Report URL: {r.get('webUrl', 'N/A')}")
            break
    else:
        log.warning("Report not found - check Fabric portal")

    # Trigger refresh
    if not args.skip_refresh and ds_id:
        log.info("")
        log.info("STEP: Refresh semantic model (Direct Lake framing)")
        log.info("-" * 40)
        trigger_refresh(pbi_token, ws_id, ds_id)

    log.info("")
    log.info("=" * 60)
    log.info("DEPLOYMENT COMPLETE")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
