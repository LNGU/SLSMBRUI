const defaultRawData = {
    "publishers": [
        {
            "id": 1,
            "name": "Adobe",
            "title": "Creative Cloud",
            "type": "Hybrid",
            "contact": "Kathren",
            "renewalDate": "2026-06-30",
            "status": "Active",
            "savingsAmount": 0,
            "savingsType": "Cost Avoidance"
        },
        {
            "id": 2,
            "name": "Anthropic",
            "title": "Claude Code",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 3,
            "name": "Articulate Global LLC",
            "title": "• Articulate 360 • Reach 360 Pro",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-06-30",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 4,
            "name": "Autodesk Inc.",
            "title": "3ds Max Maya MotionBuilder – Mudbox Flame ShotGrid",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-10-26",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 5,
            "name": "Catchpoint Systems Inc.",
            "title": "Catchpoint",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-06-30",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 6,
            "name": "Docker",
            "title": "Docker",
            "type": "On Prem",
            "contact": "Neva",
            "renewalDate": "2026-01-31",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": "Cost Avoidance"
        },
        {
            "id": 7,
            "name": "Figma",
            "title": "Figma",
            "type": "SaaS",
            "contact": "Neva",
            "renewalDate": "2026-07-31",
            "status": "Active",
            "savingsAmount": 5672880,
            "savingsType": "Cost Avoidance"
        },
        {
            "id": 8,
            "name": "JetBrains America Inc.",
            "title": "JetBrains All Products Pack JetBrains CLion JetBrains DataGrip JetBrains dotTracer JetBrains dotUltimate JetBrains GoLand JetBrains IntelliJ IDEA Ultimate JetBrains PhpStorm JetBrains PyCharm JetBrains ReShaper JetBrains Rider JetBrains RubyMine JetBrains TeamCity JetBrains WebStorm",
            "type": "On Prem",
            "contact": "Neva",
            "renewalDate": "",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 9,
            "name": "JMP Statistical Discovery LLC (SAS Institute)",
            "title": "JMP Standard JMP Pro",
            "type": "On Prem",
            "contact": "Neva",
            "renewalDate": "",
            "status": "Active",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 10,
            "name": "Open AI",
            "title": "ChatGPT Enterprise",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 11,
            "name": "Perforce Software, Inc.",
            "title": "• Helix Core • Helix Digital Asset Management",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-06-29",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 12,
            "name": "Progress",
            "title": "Telerik DevCraft Complete Enterprise",
            "type": "Hybrid",
            "contact": "Neva",
            "renewalDate": "2027-05-07",
            "status": "In Review",
            "savingsAmount": 814860,
            "savingsType": "Cost Avoidance"
        },
        {
            "id": 13,
            "name": "SensorTower Inc.",
            "title": "SensorTower Data.AI",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-06-30",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 14,
            "name": "ServiceNow",
            "title": "UU Platform",
            "type": "SaaS",
            "contact": "Kathren / Anahit",
            "renewalDate": "2026-06-29",
            "status": "In Review",
            "savingsAmount": 3723770.88,
            "savingsType": "Cost Reduction"
        },
        {
            "id": 15,
            "name": "Staffbase Canada Systems, Inc.",
            "title": "Staffbase",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-11-30",
            "status": "Active",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 16,
            "name": "Tactivos Inc.",
            "title": "MURAL",
            "type": "SaaS",
            "contact": "Harinder",
            "renewalDate": "2026-07-31",
            "status": "Active",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 17,
            "name": "TechSmith",
            "title": "Camtasia & Snagit",
            "type": "On Prem",
            "contact": "Neva",
            "renewalDate": "",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 18,
            "name": "Trimble",
            "title": "Sketchup",
            "type": "On Prem",
            "contact": "Neva",
            "renewalDate": "",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 19,
            "name": "UserTesting Technologies, Inc.",
            "title": "UserTesting",
            "type": "SaaS",
            "contact": "Kathren",
            "renewalDate": "2026-08-31",
            "status": "In Review",
            "savingsAmount": 0,
            "savingsType": null
        },
        {
            "id": 20,
            "name": "LINQPad Pty Ltd",
            "title": "LINQPad",
            "type": "On Prem",
            "contact": "Neva",
            "renewalDate": "2027-02-19",
            "status": "Pending",
            "savingsAmount": 102212,
            "savingsType": "Enterprise License Volume Discount"
        }
    ],
    "spendData": [
        {
            "publisher": "Adobe",
            "companySpend": 13644684.7,
            "msdSpend": 111765.18,
            "tiamSpend": 26000,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Anthropic",
            "companySpend": 0,
            "msdSpend": 600000,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Articulate Global LLC",
            "companySpend": 722336,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Autodesk Inc.",
            "companySpend": 4638650,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Catchpoint Systems Inc.",
            "companySpend": 802745,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Docker",
            "companySpend": 2856159,
            "msdSpend": 17137,
            "tiamSpend": 6000,
            "fiscalYear": "FY26",
            "notes": "COO Spend: 114246.36"
        },
        {
            "publisher": "Figma",
            "companySpend": 13500000,
            "msdSpend": 166217,
            "tiamSpend": 1511,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "JetBrains America Inc.",
            "companySpend": 0,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": "Requested from VAR"
        },
        {
            "publisher": "JMP Statistical Discovery LLC (SAS Institute)",
            "companySpend": 430260,
            "msdSpend": 1580,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": "layoffs and deprecation of use has resulted in a lower renewal rate equating to an elevated per user license cost as well as a change in pricing with subscription model that JMP changed this year."
        },
        {
            "publisher": "Open AI",
            "companySpend": 0,
            "msdSpend": 60000,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Perforce Software, Inc.",
            "companySpend": 961395,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Progress",
            "companySpend": 16277,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": "$15,212"
        },
        {
            "publisher": "SensorTower Inc.",
            "companySpend": 1750000,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "ServiceNow",
            "companySpend": 87113707.92,
            "msdSpend": 4954050,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Staffbase Canada Systems, Inc.",
            "companySpend": 733803.84,
            "msdSpend": 733803.84,
            "tiamSpend": 733803.84,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "Tactivos Inc.",
            "companySpend": 866856,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "TechSmith",
            "companySpend": 0,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": "No SLS Spend Admin"
        },
        {
            "publisher": "Trimble",
            "companySpend": 0,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": "No SLS Spend Admin"
        },
        {
            "publisher": "UserTesting Technologies, Inc.",
            "companySpend": 6147239,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        },
        {
            "publisher": "LINQPad Pty Ltd",
            "companySpend": 1163,
            "msdSpend": 0,
            "tiamSpend": 0,
            "fiscalYear": "FY26",
            "notes": ""
        }
    ],
    "riskData": [
        {
            "publisher": "Adobe",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Anthropic",
            "sspa": "",
            "po": "COO PO on Hold",
            "finance": "Division-level PO structure doesn't meet needs of larger orgs like COO, E+D, C+AI. Requires Anthropic to create more org-hierarchy controls.",
            "legal": "",
            "inventory": "No GC defined. Company-wide 30-day freeze blocking deployments until mid-March.",
            "details": ""
        },
        {
            "publisher": "Articulate Global LLC",
            "sspa": "SSPA Supplier DPR due date = 12/20/2025",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Autodesk Inc.",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Catchpoint Systems Inc.",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "Recently learned that there is an API method available that will allow us to capture usage data. Harinder is testing that method with the Supplier's dev team for onboarding to Intellicense",
            "details": ""
        },
        {
            "publisher": "Docker",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Figma",
            "sspa": "SSPA Supplier anniversary date 10/13/2025 - Due date 1/13/2026 (NCF-I have pinged the supplier to get traction)",
            "po": "",
            "finance": "Figma Make is moving from beta to production, which will start credit throttling starting to March 18th. Due to the lack of granular controls, conversations with leadership have determined that we will not allow purchasing for additional credits until proper controls are in place. Existing users' (1200 - 2000 users) access to Figma Make will be throttled to prevent overage scenarios.",
            "legal": "",
            "inventory": "",
            "details": "Figma shows as being in a PO block status for SSPA. You must have a Restricted Use exception in place to create a PO or Figma has to provide the evidence needed to resolve section K of the DPR.  Figma has 12 months to comply. Figma and MSFT stakeholders are aware that this will impact renewal term but should not block it because our renewal is within the 12 month period."
        },
        {
            "publisher": "JetBrains America Inc.",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "JMP Statistical Discovery LLC (SAS Institute)",
            "sspa": "",
            "po": "Supplier's accounts receivable team initially raised issues complying with Microsoft payment terms, which has resulted in an $1,800 billing discrepancy.",
            "finance": "",
            "legal": "CELA requires a contracts on Microsoft paper and Supplier will not comply. CELA has approved a one-year renewal; RFP cancelled.",
            "inventory": "JMP will not provide enterprise-grade management and SSO integration. Will be moving this out of a centralized model.",
            "details": "SSPA not required per Asra Arshad; transactional data only."
        },
        {
            "publisher": "Open AI",
            "sspa": "SSPA Restricted - Supplier must complete their certifications",
            "po": "",
            "finance": "",
            "legal": "CSA is still being finalized.",
            "inventory": "No GC defined. No clear licensing, usage, deployment strategy.",
            "details": ""
        },
        {
            "publisher": "Perforce Software, Inc.",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Progress",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "SensorTower Inc.",
            "sspa": "SSPA Supplier DPR due date = 12/4/2025",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "SensorTower provided an initial data report that shows active users but it isn't in a format that can be imported into Intellicense.",
            "details": ""
        },
        {
            "publisher": "ServiceNow",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "No defined method for internal purchase and tracking of license consumption",
            "details": ""
        },
        {
            "publisher": "Staffbase Canada Systems, Inc.",
            "sspa": "",
            "po": "",
            "finance": "Working to allocate these costs back to the business units with the highest degree of consumption in FY27.",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Tactivos Inc.",
            "sspa": "Supplier status is restricted. Supplier Code of Conduct is non-compliant.\nSSPA Supplier DPR due date = 12/4/2025",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "TechSmith",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "Trimble",
            "sspa": "",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "Trimble contacts are not responding to Harinder's requests for data.",
            "details": ""
        },
        {
            "publisher": "UserTesting Technologies, Inc.",
            "sspa": "SSPA Supplier DPR due date = 12/15/2025",
            "po": "",
            "finance": "",
            "legal": "",
            "inventory": "",
            "details": ""
        },
        {
            "publisher": "LINQPad Pty Ltd",
            "sspa": "N/A",
            "po": "N/A",
            "finance": "N/A",
            "legal": "N/A",
            "inventory": "N/A",
            "details": ""
        }
    ],
    "managedTitles": [
        {
            "title": "Creative Cloud",
            "publisher": "Adobe",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Claude Code",
            "publisher": "Anthropic",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Articulate 360",
            "publisher": "Articulate Global LLC",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Reach 360 Pro",
            "publisher": "Articulate Global LLC",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "3ds Max",
            "publisher": "Autodesk Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Maya",
            "publisher": "Autodesk Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "MotionBuilder",
            "publisher": "Autodesk Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Mudbox",
            "publisher": "Autodesk Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Flame",
            "publisher": "Autodesk Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "ShotGrid",
            "publisher": "Autodesk Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Catchpoint",
            "publisher": "Catchpoint Systems Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Docker",
            "publisher": "Docker",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Figma",
            "publisher": "Figma",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains All Products Pack",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains CLion",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains DataGrip",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains dotTracer",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains dotUltimate",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains GoLand",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains IntelliJ IDEA Ultimate",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains PhpStorm",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains PyCharm",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains ReShaper",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains Rider",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains RubyMine",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains TeamCity",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JetBrains WebStorm",
            "publisher": "JetBrains America Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JMP Standard",
            "publisher": "JMP Statistical Discovery LLC (SAS Institute)",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "JMP Pro",
            "publisher": "JMP Statistical Discovery LLC (SAS Institute)",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "ChatGPT Enterprise",
            "publisher": "Open AI",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Helix Core",
            "publisher": "Perforce Software, Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Helix Digital Asset Management",
            "publisher": "Perforce Software, Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Telerik  DevCraft Complete Enterprise",
            "publisher": "Progress",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "SensorTower",
            "publisher": "SensorTower Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Data.AI",
            "publisher": "SensorTower Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "UU Platform",
            "publisher": "ServiceNow",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Staffbase",
            "publisher": "Staffbase Canada Systems, Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "MURAL",
            "publisher": "Tactivos Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Camtasia",
            "publisher": "TechSmith",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Snagit",
            "publisher": "TechSmith",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "Sketchup",
            "publisher": "Trimble",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "UserTesting",
            "publisher": "UserTesting Technologies, Inc.",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        },
        {
            "title": "LINQPad",
            "publisher": "LINQPad Pty Ltd",
            "category": "Other",
            "licenseCount": 0,
            "notes": "active"
        }
    ],
    "datasetVersion": "FY26_NEFAYPGRAFF_2026-02-24",
    "externalKpis": [
        {
            "name": "SNOW Tickets MTD",
            "value": 450,
            "unit": "tickets",
            "source": "ServiceNow",
            "lastUpdated": "2026-02-24",
            "notes": ""
        },
        {
            "name": "ICM Tickets MTD",
            "value": 450,
            "unit": "tickets",
            "source": "ICM System",
            "lastUpdated": "2026-02-24",
            "notes": ""
        }
    ]
};