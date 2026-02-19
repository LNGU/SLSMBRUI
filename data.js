// Raw Dashboard Data - Source of truth for all visualizations
// Structured like an Excel workbook with multiple sheets
// Chart data is computed from this raw data via calculations.js

// Default raw data structure (used if no stored data exists)
// Each key represents a "sheet" in the Excel workbook
const defaultRawData = {
    publishers: [
        { id: 1, name: 'Adobe', title: 'Creative Cloud', type: 'Hybrid', contact: 'Kathren', renewalDate: '2026-06-30', status: 'Active', savingsAmount: 0, savingsType: 'Cost Avoidance' },
        { id: 2, name: 'Anthropic', title: 'Claude Code', type: 'SaaS', contact: 'Kathren', renewalDate: '', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 3, name: 'Articulate Global LLC', title: '• Articulate 360 • Reach 360 Pro', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-30', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 4, name: 'Autodesk Inc.', title: '3ds Max Maya MotionBuilder – Mudbox Flame ShotGrid', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-10-26', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 5, name: 'Catchpoint Systems Inc.', title: 'Catchpoint', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-30', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 6, name: 'Docker', title: 'Docker', type: 'On Prem', contact: 'Neva', renewalDate: '2026-01-31', status: 'In Review', savingsAmount: 0, savingsType: 'Cost Avoidance' },
        { id: 7, name: 'Figma', title: 'Figma', type: 'SaaS', contact: 'Neva', renewalDate: '2026-07-31', status: 'Active', savingsAmount: 5672880, savingsType: 'Cost Avoidance' },
        { id: 8, name: 'JetBrains America Inc.', title: 'JetBrains All Products Pack JetBrains CLion JetBrains DataGrip JetBrains dotTracer JetBrains dotUltimate JetBrains GoLand JetBrains IntelliJ IDEA Ultimate JetBrains PhpStorm JetBrains PyCharm JetBrains ReShaper JetBrains Rider JetBrains RubyMine JetBrains TeamCity JetBrains WebStorm', type: 'On Prem', contact: 'Neva', renewalDate: '', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 9, name: 'JMP Statistical Discovery LLC (SAS Institute)', title: 'JMP Standard JMP Pro', type: 'On Prem', contact: 'Neva', renewalDate: '', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 10, name: 'Open AI', title: 'ChatGPT Enterprise', type: 'SaaS', contact: 'Kathren', renewalDate: '', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 11, name: 'Perforce Software, Inc.', title: '• Helix Core • Helix Digital Asset Management', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-29', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 12, name: 'Progress', title: 'Telerik DevCraft Complete Enterprise', type: 'Hybrid', contact: 'Neva', renewalDate: '2027-05-07', status: 'In Review', savingsAmount: 814860, savingsType: 'Cost Avoidance' },
        { id: 13, name: 'SensorTower Inc.', title: 'SensorTower Data.AI', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-30', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 14, name: 'ServiceNow', title: 'UU Platform', type: 'SaaS', contact: 'Kathren / Anahit', renewalDate: '3031-06-29', status: 'Active', savingsAmount: 3723771, savingsType: 'Cost Reduction' },
        { id: 15, name: 'Staffbase Canada Systems, Inc.', title: 'Staffbase', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-11-30', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 16, name: 'Tactivos Inc.', title: 'MURAL', type: 'SaaS', contact: 'Harinder', renewalDate: '2026-07-31', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 17, name: 'TechSmith', title: 'Camtasia & Snagit', type: 'On Prem', contact: 'Neva', renewalDate: '', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 18, name: 'Trimble', title: 'Sketchup', type: 'On Prem', contact: 'Neva', renewalDate: '', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 19, name: 'UserTesting Technologies, Inc.', title: 'UserTesting', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-08-31', status: 'Active', savingsAmount: 0, savingsType: null },
        { id: 20, name: 'LINQPad Pty Ltd', title: 'LINQPad', type: 'On Prem', contact: 'Neva', renewalDate: '2027-02-19', status: 'Pending', savingsAmount: 102212, savingsType: 'Enterprise License Volume Discount' }
    ],
    spendData: [
        { publisher: 'Adobe', companySpend: 13644685, msdSpend: 111765, tiamSpend: 26000, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Anthropic', companySpend: 0, msdSpend: 600000, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Articulate Global LLC', companySpend: 722336, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Autodesk Inc.', companySpend: 4638650, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Catchpoint Systems Inc.', companySpend: 802745, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Docker', companySpend: 2856159, msdSpend: 17137, tiamSpend: 6000, fiscalYear: 'FY26', notes: 'COO Spend: 114246.36' },
        { publisher: 'Figma', companySpend: 13500000, msdSpend: 166217, tiamSpend: 1511, fiscalYear: 'FY26', notes: '' },
        { publisher: 'JetBrains America Inc.', companySpend: 0, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: 'Requested from VAR' },
        { publisher: 'JMP Statistical Discovery LLC (SAS Institute)', companySpend: 430260, msdSpend: 1580, tiamSpend: 0, fiscalYear: 'FY26', notes: 'layoffs and deprecation of use has resulted in a lower renewal rate equating to an elevated per user license cost as well as a change in pricing with subscription model that JMP changed this year.' },
        { publisher: 'Open AI', companySpend: 0, msdSpend: 60000, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Perforce Software, Inc.', companySpend: 961395, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Progress', companySpend: 16277, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '$15,212' },
        { publisher: 'SensorTower Inc.', companySpend: 1750000, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'ServiceNow', companySpend: 87113708, msdSpend: 4954050, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Staffbase Canada Systems, Inc.', companySpend: 733804, msdSpend: 733804, tiamSpend: 733804, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Tactivos Inc.', companySpend: 866856, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'TechSmith', companySpend: 0, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: 'No SLS Spend Admin' },
        { publisher: 'Trimble', companySpend: 0, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: 'No SLS Spend Admin' },
        { publisher: 'UserTesting Technologies, Inc.', companySpend: 6147239, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'LINQPad Pty Ltd', companySpend: 1163, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' }
    ],
    riskData: [
        { publisher: 'Adobe', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'Anthropic', sspa: '', po: 'COO PO on Hold', finance: "Division-level PO structure doesn't meet needs of larger orgs like COO, E+D, C+AI. Requires Anthropic to create more org-hierarchy controls.", legal: '', inventory: 'No GC defined. Company-wide 30-day freeze blocking deployments until mid-March.', details: '' },
        { publisher: 'Articulate Global LLC', sspa: 'SSPA Supplier DPR due date = 12/20/2025', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'Autodesk Inc.', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'Catchpoint Systems Inc.', sspa: '', po: '', finance: '', legal: '', inventory: "Recently learned that there is an API method available that will allow us to capture usage data. Harinder is testing that method with the Supplier's dev team for onboarding to Intellicense", details: '' },
        { publisher: 'Docker', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'Figma', sspa: 'SSPA Supplier anniversary date 10/13/2025 - Due date 1/13/2026 (NCF-I have pinged the supplier to get traction)', po: '', finance: "Figma Make is moving from beta to production, which will start credit throttling starting to March 18th. Due to the lack of granular controls, conversations with leadership have determined that we will not allow purchasing for additional credits until proper controls are in place. Existing users' (1200 - 2000 users) access to Figma Make will be throttled to prevent overage scenarios.", legal: '', inventory: '', details: 'Figma shows as being in a PO block status for SSPA. You must have a Restricted Use exception in place to create a PO or Figma has to provide the evidence needed to resolve section K of the DPR. Figma has 12 months to comply. Figma and MSFT stakeholders are aware that this will impact renewal term but should not block it because our renewal is within the 12 month period.' },
        { publisher: 'JetBrains America Inc.', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'JMP Statistical Discovery LLC (SAS Institute)', sspa: '', po: "Supplier's accounts receivable team initially raised issues complying with Microsoft payment terms, which has resulted in an $1,800 billing discrepancy.", finance: '', legal: 'CELA requires a contracts on Microsoft paper and Supplier will not comply. CELA has approved a one-year renewal; RFP cancelled.', inventory: 'JMP will not provide enterprise-grade management and SSO integration. Will be moving this out of a centralized model.', details: 'SSPA not required per Asra Arshad; transactional data only.' },
        { publisher: 'Open AI', sspa: 'SSPA Restricted - Supplier must complete their certifications', po: '', finance: '', legal: 'CSA is still being finalized.', inventory: 'No GC defined. No clear licensing, usage, deployment strategy.', details: '' },
        { publisher: 'Perforce Software, Inc.', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'Progress', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'SensorTower Inc.', sspa: 'SSPA Supplier DPR due date = 12/4/2025', po: '', finance: '', legal: '', inventory: "SensorTower provided an initial data report that shows active users but it isn't in a format that can be imported into Intellicense.", details: '' },
        { publisher: 'ServiceNow', sspa: '', po: '', finance: '', legal: '', inventory: 'No defined method for internal purchase and tracking of license consumption', details: '' },
        { publisher: 'Staffbase Canada Systems, Inc.', sspa: '', po: '', finance: 'Working to allocate these costs back to the business units with the highest degree of consumption in FY27.', legal: '', inventory: '', details: '' },
        { publisher: 'Tactivos Inc.', sspa: 'Supplier status is restricted. Supplier Code of Conduct is non-compliant. SSPA Supplier DPR due date = 12/4/2025', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'TechSmith', sspa: '', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'Trimble', sspa: '', po: '', finance: '', legal: '', inventory: "Trimble contacts are not responding to Harinder's requests for data.", details: '' },
        { publisher: 'UserTesting Technologies, Inc.', sspa: 'SSPA Supplier DPR due date = 12/15/2025', po: '', finance: '', legal: '', inventory: '', details: '' },
        { publisher: 'LINQPad Pty Ltd', sspa: 'N/A', po: 'N/A', finance: 'N/A', legal: 'N/A', inventory: 'N/A', details: '' }
    ],
    managedTitles: [
        { title: 'UU Platform', publisher: 'ServiceNow', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Creative Cloud', publisher: 'Adobe', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Figma', publisher: 'Figma', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'StaffBase', publisher: 'Bananatag Systems Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Docker', publisher: 'Docker', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Mural', publisher: 'Tactivos Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JMP Pro', publisher: 'JMP Statistical Discovery LLC (SAS Institute)', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JMP Standard', publisher: 'JMP Statistical Discovery LLC (SAS Institute)', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains All Products Pack', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains CLion', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains DataGrip', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains dotTracer', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains dotUltimate', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains GoLand', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains IntelliJ IDEA Ultimate', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains PhpStorm', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains PyCharm', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains ReShaper', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains Rider', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains RubyMine', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains TeamCity', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'JetBrains WebStorm', publisher: 'JetBrains', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Sketchup', publisher: 'Trimble', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Catchpoint', publisher: 'Catchpoint Systems Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: '3ds Max', publisher: 'Autodesk Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Maya', publisher: 'Autodesk Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'MotionBuilder –', publisher: 'Autodesk Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Mudbox', publisher: 'Autodesk Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Flame', publisher: 'Autodesk Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'ShotGrid', publisher: 'Autodesk Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Camtasia', publisher: 'TechSmith', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'SnagIt', publisher: 'TechSmith', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'UserTesting', publisher: 'UserTesting Technologies, Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Articulate 360', publisher: 'Articulate Global LLC', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Reach 360 Pro', publisher: 'Articulate Global LLC', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Helix Core', publisher: 'Perforce Software, Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Helix Digital Asset Management', publisher: 'Perforce Software, Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'SensorTower', publisher: 'SensorTower Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Data.AI', publisher: 'SensorTower Inc.', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Telerik Progress DevCraft Complete Enterprise', publisher: 'Telerik', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'Claude Code', publisher: 'Anthropic', category: 'Other', licenseCount: 0, notes: 'active' },
        { title: 'ChatGPT Enterprise', publisher: 'OpenAI', category: 'Other', licenseCount: 0, notes: '' }
    ],
    datasetVersion: 'FY26_NEFAYPGRAFF_2026-02-18',
    externalKpis: [
        { name: 'SNOW Tickets MTD', value: 315, unit: 'tickets', source: 'ServiceNow', lastUpdated: '2026-02-18', notes: '' },
        { name: 'ICM Tickets MTD', value: 135, unit: 'tickets', source: 'ICM System', lastUpdated: '2026-02-18', notes: '' }
    ]
};

// Legacy data mapping for backward compatibility with charts
// Maps new structure to old structure for existing chart code
function mapToLegacyFormat(data) {
    return {
        // Map spendData to annualSpend format
        annualSpend: (data.spendData || []).map(s => ({
            publisher: s.publisher,
            spend: s.companySpend || 0,
            msdSpend: s.msdSpend || 0,
            tiamSpend: s.tiamSpend || 0
        })),
        
        // Map riskData to riskHeatmap format - now supports text explanations
        riskHeatmap: (data.riskData || []).map(r => ({
            name: r.publisher,
            sspa: r.sspa || '',
            po: r.po || '',
            finance: r.finance || '',
            legal: r.legal || '',
            inventory: r.inventory || '',
            details: r.details ? { note: r.details } : {}
        })),
        
        // Map publishers
        publishers: (data.publishers || []).map(p => ({
            name: p.name,
            title: p.title,
            type: p.type,
            contact: p.contact,
            renewalDate: p.renewalDate,
            savingsAmount: p.savingsAmount || 0,
            savings: p.savingsAmount || p.savings || 0,
            savingsType: p.savingsType || null
        })),
        
        // Map managedTitles to string array for legacy
        managedTitles: (data.managedTitles || []).map(t => t.title),
        
        // Map external KPIs
        kpis: {
            snowTickets: (data.externalKpis || []).find(k => k.name.includes('SNOW'))?.value || 0,
            icmTickets: (data.externalKpis || []).find(k => k.name.includes('ICM'))?.value || 0
        }
    };
}

// Load data from storage or use defaults (with fallback if Storage not ready)
let rawData;
try {
    if (typeof Storage !== 'undefined' && Storage.hasStoredData()) {
        const storedData = Storage.loadData(defaultRawData);
        const isCurrentDataset = storedData && storedData.datasetVersion === defaultRawData.datasetVersion;

        if (isCurrentDataset) {
            rawData = storedData;
        } else {
            rawData = defaultRawData;
            Storage.saveData(defaultRawData);
        }
    } else {
        rawData = defaultRawData;
    }
} catch (e) {
    console.warn('Storage not available, using defaults');
    rawData = defaultRawData;
}

// Map to legacy format for existing charts
const legacyData = mapToLegacyFormat(rawData);

// Compute derived data for charts (with fallback if Calculations not ready)
let computedData;
try {
    computedData = (typeof Calculations !== 'undefined') 
        ? Calculations.computeAll(legacyData)
        : computeFallback(legacyData);
} catch (e) {
    console.warn('Calculations not available, using fallback');
    computedData = computeFallback(legacyData);
}

// Fallback computation if Calculations module not loaded
function computeFallback(data) {
    return {
        potentialSavings: { labels: [], values: [], percentages: [], colors: [] },
        risksTracking: { categories: ['SSPA', 'PO', 'Finance', 'Legal', 'Inventory'], values: [0,0,0,0,0], colors: ['#2c3e50', '#3498db', '#1abc9c', '#9b59b6', '#e67e22'] },
        upcomingRenewals: { daysUntilNext: 0, publisher: 'N/A', renewalDate: 'N/A', csaExpThisQ: 0, coExpThisQ: 0 },
        complianceHealth: { labels: ['Past Due', 'Renewals Due by EOQ', 'Renewals Due by EOY'], values: [0,0,0], percentages: ['0%','0%','0%'], colors: ['#e74c3c', '#e67e22', '#3498db'] },
        kpis: { companySpend: 0, msdSpend: 0, tiamSpend: 0, snowTickets: 0, icmTickets: 0, managedTitles: 0, managedPublishers: 0 }
    };
}

// Build dashboardData object for backward compatibility with charts.js and modals.js
const dashboardData = {
    // Metadata (dynamic)
    lastRefreshed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    currentMonth: new Date().toLocaleDateString('en-US', { month: 'long' }),
    
    // Computed KPIs
    kpis: computedData.kpis,
    
    // Computed chart data
    potentialSavings: computedData.potentialSavings,
    risksTracking: computedData.risksTracking,
    upcomingRenewals: computedData.upcomingRenewals,
    complianceHealth: computedData.complianceHealth,
    
    // Legacy format data (for tables and detail views)
    annualSpend: legacyData.annualSpend,
    riskHeatmap: legacyData.riskHeatmap,
    publishers: legacyData.publishers,
    managedTitles: legacyData.managedTitles
};

// Export for global access
window.dashboardData = dashboardData;
window.rawData = rawData;
window.defaultRawData = defaultRawData;

// Function to refresh dashboardData after edits
function refreshDashboardData() {
    const currentRawData = Storage.loadData(defaultRawData);
    const currentLegacyData = mapToLegacyFormat(currentRawData);
    const newComputedData = Calculations.computeAll(currentLegacyData);
    
    // Update dashboardData in place
    dashboardData.kpis = newComputedData.kpis;
    dashboardData.potentialSavings = newComputedData.potentialSavings;
    dashboardData.risksTracking = newComputedData.risksTracking;
    dashboardData.upcomingRenewals = newComputedData.upcomingRenewals;
    dashboardData.complianceHealth = newComputedData.complianceHealth;
    dashboardData.annualSpend = currentLegacyData.annualSpend;
    dashboardData.riskHeatmap = currentLegacyData.riskHeatmap;
    dashboardData.publishers = currentLegacyData.publishers;
    dashboardData.managedTitles = currentLegacyData.managedTitles;
    
    // Update raw data reference
    Object.assign(rawData, currentRawData);
    
    return dashboardData;
}

window.refreshDashboardData = refreshDashboardData;
