# SLS MBR Dashboard

A comprehensive **Software License Services Monthly Business Review Dashboard** for tracking software spend, license management, risk assessment, and compliance monitoring.

![Dashboard](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-FY26-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Business Process Flow](#business-process-flow)
- [Getting Started](#getting-started)
- [File Structure](#file-structure)
- [Microsoft Fabric Deployment](#-microsoft-fabric-deployment)

---

## 🎯 Overview

The SLS MBR Dashboard provides a centralized view of software license management activities, enabling stakeholders to:

- Monitor **FY26 spending** across Company, MSD, and TI&M categories
- Track **42 managed titles** across **19 publishers**
- Visualize **risk assessments** and compliance status
- Manage **license renewals** and identify cost savings opportunities

---

## ✨ Features

### 📊 Real-Time KPI Monitoring

| KPI Card | Description | Visual Style |
|----------|-------------|--------------|
| **Company Spend** | Total FY26 organizational software spend ($134.18M) | Blue |
| **MSD Spend** | Microsoft Developer spend allocation ($6.64M) | Blue |
| **TI&M Spend** | Technology Infrastructure & Management spend ($765.51K) | Blue |
| **SNOW Tickets** | ServiceNow tickets month-to-date | Teal |
| **ICM Tickets** | Incident management tickets month-to-date | Teal |
| **Managed Titles** | Total software titles under management | Dark Blue |
| **Managed Publishers** | Total publishers in portfolio | Dark Blue |

### 💰 Potential Savings Visualization

- **Interactive Pie Chart** showing savings by publisher
- Top savers: Figma ($5.67M), ServiceNow ($3.72M), Progress ($0.81M)
- Drill-down capability with detailed breakdown

### ⚠️ Risk Score Heatmap

- **5 Risk Categories**: SSPA, PO, Finance, Legal, Inventory
- **17+ Publishers** tracked with risk indicators
- Toggle between "With Risks" and "All" views
- Color-coded severity indicators

### 📅 Upcoming Renewals Tracker

- Days until next renewal countdown
- CSA/CO expirations by quarter
- Publisher-specific renewal dates
- Proactive renewal management

### 📈 Annual Spend Analysis

- Horizontal bar chart by publisher
- Top publishers: ServiceNow, Adobe, Figma
- Sortable and filterable data views

### ✅ Compliance Health Monitoring

- **Donut chart** visualization
- Categories: Past Due, EOQ Renewals, EOY Renewals
- Percentage breakdown with legends

### 🔍 Interactive Modal System

- Click-through details for all components
- Sortable data tables
- Export-ready formatted views

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SLS MBR Dashboard                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ index.html  │  │ styles.css  │  │  Chart.js   │                  │   │
│  │  │   (DOM)     │  │   (UI/UX)   │  │  (Visuals)  │                  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │   │
│  └─────────┼────────────────┼────────────────┼─────────────────────────┘   │
│            │                │                │                              │
│  ┌─────────┴────────────────┴────────────────┴─────────────────────────┐   │
│  │                        LOGIC LAYER                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │   │
│  │  │    charts.js    │  │    modals.js    │  │ Event Handlers  │      │   │
│  │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │      │   │
│  │  │ • initSavings   │  │ • showKpiDetail │  │ • Click events  │      │   │
│  │  │ • initRisks     │  │ • showCardDetail│  │ • Keyboard nav  │      │   │
│  │  │ • initSpend     │  │ • formatCurrency│  │ • Filter toggle │      │   │
│  │  │ • initHeatmap   │  │ • generateTable │  │ • Modal control │      │   │
│  │  │ • initCompliance│  │ • showModal     │  │                 │      │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │   │
│  └───────────┼─────────────────────┼─────────────────────┼──────────────┘   │
│              │                     │                     │                  │
│  ┌───────────┴─────────────────────┴─────────────────────┴──────────────┐   │
│  │                          DATA LAYER                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │                        data.js                               │     │   │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │     │   │
│  │  │  │     KPIs    │ │   Savings   │ │    Risks    │            │     │   │
│  │  │  │ • Spend     │ │ • Labels    │ │ • Heatmap   │            │     │   │
│  │  │  │ • Tickets   │ │ • Values    │ │ • Categories│            │     │   │
│  │  │  │ • Titles    │ │ • Colors    │ │ • Details   │            │     │   │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘            │     │   │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │     │   │
│  │  │  │  Renewals   │ │Annual Spend │ │ Publishers  │            │     │   │
│  │  │  │ • Dates     │ │ • By vendor │ │ • Contacts  │            │     │   │
│  │  │  │ • Publisher │ │ • MSD/TI&M  │ │ • Types     │            │     │   │
│  │  │  │ • Quarters  │ │ • Totals    │ │ • Savings   │            │     │   │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘            │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Diagram

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   User Input   │────▶│  Event Handler │────▶│  Data Layer    │
│   (Click/Key)  │     │  (modals.js)   │     │  (data.js)     │
└────────────────┘     └───────┬────────┘     └───────┬────────┘
                               │                       │
                               ▼                       ▼
                       ┌───────────────┐       ┌───────────────┐
                       │  Modal/View   │◀──────│  Chart.js     │
                       │  Rendering    │       │  Rendering    │
                       └───────┬───────┘       └───────────────┘
                               │
                               ▼
                       ┌───────────────┐
                       │    DOM        │
                       │   Update      │
                       └───────────────┘
```

### External Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| **Chart.js** | CDN (Latest) | Data visualization |
| **ChartJS DataLabels** | v2.x | In-chart data labels |

---

## 📈 Business Process Flow

### Monthly Business Review Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SLS MONTHLY BUSINESS REVIEW PROCESS                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │   DATA SOURCES   │
    │   ────────────   │
    │ • Excel Reports  │
    │ • ServiceNow     │
    │ • ICM System     │
    │ • Contract DB    │
    └────────┬─────────┘
             │
             ▼
┌────────────────────────┐      ┌────────────────────────┐
│   1. DATA COLLECTION   │      │   2. SPEND ANALYSIS    │
│   ──────────────────   │─────▶│   ────────────────     │
│ • Aggregate spend data │      │ • Company-wide review  │
│ • Pull ticket counts   │      │ • MSD allocation       │
│ • Update risk status   │      │ • TI&M breakdown       │
│ • Refresh renewals     │      │ • Publisher comparison │
└────────────────────────┘      └───────────┬────────────┘
                                            │
                                            ▼
┌────────────────────────┐      ┌────────────────────────┐
│   4. DECISION MAKING   │      │   3. RISK ASSESSMENT   │
│   ──────────────────   │◀─────│   ────────────────     │
│ • Renewal strategies   │      │ • SSPA compliance      │
│ • Cost optimization    │      │ • PO/Finance risks     │
│ • Contract negotiations│      │ • Legal review status  │
│ • Budget planning      │      │ • Inventory tracking   │
└───────────┬────────────┘      └────────────────────────┘
            │
            ▼
┌────────────────────────┐      ┌────────────────────────┐
│   5. ACTION TRACKING   │      │   6. REPORTING         │
│   ──────────────────   │─────▶│   ────────────────     │
│ • Assign remediation   │      │ • Executive summary    │
│ • Set deadlines        │      │ • Savings realized     │
│ • Monitor progress     │      │ • KPI trends           │
│ • Update risk status   │      │ • Compliance status    │
└────────────────────────┘      └────────────────────────┘
```

### Risk Management Lifecycle

```
                           ┌─────────────┐
                           │    START    │
                           └──────┬──────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   RISK IDENTIFICATION   │
                    │   ────────────────────  │
                    │   • SSPA Compliance     │
                    │   • PO Status           │
                    │   • Finance Issues      │
                    │   • Legal Concerns      │
                    │   • Inventory Gaps      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   RISK ASSESSMENT       │
                    │   ───────────────       │
                    │   Score: 0 (None)       │──────┐
                    │   Score: 1 (Active)     │      │
                    └────────────┬────────────┘      │
                                 │                   │
                    ┌────────────┴────────────┐      │
                    ▼                         ▼      │
         ┌──────────────────┐     ┌──────────────────┐
         │  ACTIVE RISK     │     │   NO RISK        │
         │  ────────────    │     │   ───────        │
         │  • Document      │     │   • Continue     │◀┘
         │  • Assign owner  │     │     monitoring   │
         │  • Set deadline  │     └──────────────────┘
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │   MITIGATION     │
         │   ──────────     │
         │  • Take action   │
         │  • Track progress│
         │  • Update status │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐     ┌──────────────────┐
         │   RESOLVED?      │─NO─▶│  ESCALATE        │
         └────────┬─────────┘     │  • Notify mgmt   │
                  │               │  • Adjust plan   │
                 YES              └─────────┬────────┘
                  │                         │
                  ▼                         │
         ┌──────────────────┐               │
         │  CLOSE RISK      │◀──────────────┘
         │  • Document      │
         │  • Update heatmap│
         └──────────────────┘
```

### Renewal Management Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    RENEWAL TIMELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  180 Days    90 Days     60 Days     30 Days     Renewal        │
│  Before      Before      Before      Before      Date           │
│     │           │           │           │          │            │
│     ▼           ▼           ▼           ▼          ▼            │
│  ┌─────┐    ┌─────┐     ┌─────┐     ┌─────┐    ┌─────┐         │
│  │PLAN │───▶│NEGO │────▶│FINAL│────▶│EXEC │───▶│DONE │         │
│  └─────┘    └─────┘     └─────┘     └─────┘    └─────┘         │
│     │           │           │           │          │            │
│  • Review   • Contact   • Legal     • Sign     • Update        │
│    usage      vendor      review      docs       data          │
│  • Assess   • Negotiate • Finance   • Process  • Close         │
│    needs      terms       approval    PO         renewal       │
│  • Budget   • Evaluate  • Contract               task          │
│    request    options     finalize                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                    Current Status Indicators
                    ─────────────────────────
                    🔴 Past Due (1 renewal)
                    🟠 Due This Quarter (7 renewals)
                    🔵 Due This Year (8 renewals)
```

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- No server-side dependencies required

### Installation

1. Clone or download the repository
2. Open `index.html` in a web browser
3. Dashboard loads with sample FY26 data

### Usage

1. **View KPIs**: Top row displays key metrics with click-to-detail
2. **Explore Charts**: Click any chart card for detailed breakdowns
3. **Monitor Risks**: Use heatmap toggle to filter risk views
4. **Track Renewals**: Review upcoming renewal countdown

---

## 📁 File Structure

```
SlsMbrUI/
│
├── 📄 index.html          # Main dashboard layout and structure
│   └── Contains: Header, KPI cards, chart containers, modal
│
├── 🎨 styles.css          # Complete styling and responsive design
│   └── Contains: Color schemes, grid layouts, animations
│
├── 📊 charts.js           # Chart.js initialization and rendering
│   └── Contains: Pie, bar, heatmap, and donut chart configs
│
├── 🔧 modals.js           # Modal system and data formatting
│   └── Contains: Click handlers, table generators, formatters
│
├── 💾 data.js             # Dashboard data store
│   └── Contains: KPIs, savings, risks, spend, publishers
│
└── 📖 README.md           # Documentation (this file)
```

---

## 🎨 Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary Background | Navy Blue | `#1e3a5f` |
| Accent | Orange | `#f5a623` |
| Success | Teal | `#1abc9c` |
| Warning | Orange | `#e67e22` |
| Danger | Red | `#e74c3c` |
| Info | Blue | `#3498db` |

---

## 📊 Data Sources

The dashboard aggregates data from:

- **base_data.xlsx** - Core spend and publisher data
- **ServiceNow** - SNOW ticket counts
- **ICM** - Incident management tickets
- **Contract Management System** - Renewal dates and terms

---

## 👥 Key Contacts

| Publisher | SLS Contact |
|-----------|-------------|
| ServiceNow | Kathren / Anahit |
| Adobe | Kathren |
| Figma | Neva |
| Docker | Neva |
| Autodesk | Kathren |

---

## � Microsoft Fabric Deployment

The dashboard can be deployed to Microsoft Fabric for enterprise-level reporting with Direct Lake mode.

### Prerequisites

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# Install required packages
pip install azure-storage-file-datalake azure-identity deltalake pandas
```

### Fabric Components

| Script | Purpose |
|--------|---------|
| `deploy_report_to_fabric.py` | Deploy TMDL semantic model + PBIR report via Git integration |
| `load_data_to_lakehouse.py` | Export data.js to CSV, upload to OneLake, load Delta tables |
| `deploy_monthly.py` | Orchestrate monthly deployment pipeline |

### Quick Start

```bash
# Full deployment (data + report)
python deploy_monthly.py --workspace scm-dev

# Or run individual steps:
# 1. Load data to Lakehouse (6 Delta tables)
python load_data_to_lakehouse.py --workspace scm-dev

# 2. Deploy semantic model + report to Git
python deploy_report_to_fabric.py --workspace scm-dev
```

### Workspace Configuration

| Setting | Value |
|---------|-------|
| Workspace | `scm-dev` (d3c735d2-8f5c-4d1a-b825-0cc5353a8de2) |
| Lakehouse | `lakehouse` (aa363084-8758-4301-8697-06bff14834cd) |
| Git Repo | `MicrosoftIT/OneITVSO/TIM-SCM-SCMGMT-AutomationDocs` |
| Branch | `PowerBI` |

### Delta Tables

| Table | Source | Description |
|-------|--------|-------------|
| `dim_Publisher` | publishers | Publisher dimension with renewal dates |
| `dim_Date` | Generated | Date dimension for time filtering |
| `fact_Spend` | Calculated | Spend facts tied to publishers |
| `fact_Risk` | risks | Risk scores by category |
| `dim_ManagedTitle` | managedTitles | Software titles under management |
| `fact_ExternalKPI` | External API | KPIs from Fabric Semantic Models |

### Report Pages

1. **SLS MBR Overview** - KPI cards, savings chart, risk tracking, renewals
2. **Publishers & Renewals** - Detailed publisher table with renewal countdown
3. **Risk Details** - Full risk matrix by publisher
4. **Managed Titles** - Searchable software titles list

### Authentication

Uses `DefaultAzureCredential` which supports:
- Azure CLI (`az login`)
- Visual Studio Code Azure account
- Environment variables (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`)
- Managed Identity (Azure VMs, Functions)

---

## �📝 License

Internal Microsoft Tool - Software License Services Team

---

*Last Updated: January 2026*
