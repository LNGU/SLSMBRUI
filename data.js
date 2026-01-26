// Raw Dashboard Data - Source of truth for all visualizations
// Structured like an Excel workbook with multiple sheets
// Chart data is computed from this raw data via calculations.js

// Default raw data structure (used if no stored data exists)
// Each key represents a "sheet" in the Excel workbook
const defaultRawData = {
    // Sheet 1: Publishers (master list)
    publishers: [
        { id: 1, name: 'ServiceNow', title: 'UU Platform', type: 'SaaS', contact: 'Kathren / Anahit', renewalDate: '2031-06-29', status: 'Active' },
        { id: 2, name: 'Adobe', title: 'Creative Cloud', type: 'Hybrid', contact: 'Kathren', renewalDate: '2026-06-30', status: 'Active' },
        { id: 3, name: 'Figma', title: 'Figma', type: 'SaaS', contact: 'Neva', renewalDate: '2026-07-31', status: 'Active' },
        { id: 4, name: 'Staffbase', title: 'Staffbase', type: 'SaaS', contact: 'Kathren', renewalDate: '2025-11-29', status: 'Expired' },
        { id: 5, name: 'Docker', title: 'Docker', type: 'On Prem', contact: 'Neva', renewalDate: '2026-01-31', status: 'Active' },
        { id: 6, name: 'Tactivos Inc.', title: 'MURAL', type: 'SaaS', contact: 'Harinder', renewalDate: '2026-07-31', status: 'Active' },
        { id: 7, name: 'JMP Statistical Discovery', title: 'JMP Standard/JMP Pro', type: 'On Prem', contact: 'Neva', renewalDate: '2026-10-24', status: 'Active' },
        { id: 8, name: 'Autodesk Inc.', title: '3ds Max/Maya/MotionBuilder/Mudbox/Flame/ShotGrid', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-10-26', status: 'Active' },
        { id: 9, name: 'UserTesting', title: 'UserTesting', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-08-31', status: 'Active' },
        { id: 10, name: 'Perforce Software', title: 'Helix Core/Helix DAM', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-29', status: 'Active' },
        { id: 11, name: 'SensorTower Inc.', title: 'SensorTower/Data.AI', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-30', status: 'Active' },
        { id: 12, name: 'Progress', title: 'Telerik DevCraft', type: 'Hybrid', contact: 'Kathren', renewalDate: '2027-05-07', status: 'Active' },
        { id: 13, name: 'Anthropic', title: 'Claude Code', type: 'SaaS', contact: 'Kathren', renewalDate: '', status: 'In Review' },
        { id: 14, name: 'Open AI', title: 'ChatGPT Enterprise', type: 'SaaS', contact: 'Kathren', renewalDate: '', status: 'In Review' },
        { id: 15, name: 'Catchpoint', title: 'Catchpoint', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-05-15', status: 'Active' },
        { id: 16, name: 'Articulate Global', title: 'Articulate 360', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-04-30', status: 'Active' },
        { id: 17, name: 'TechSmith', title: 'Camtasia/SnagIt', type: 'On Prem', contact: 'Kathren', renewalDate: '2026-03-31', status: 'Active' }
    ],
    
    // Sheet 2: Spend Data
    spendData: [
        { publisher: 'ServiceNow', companySpend: 87113708, msdSpend: 4954050, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Adobe', companySpend: 13644685, msdSpend: 111765, tiamSpend: 26000, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Figma', companySpend: 13500000, msdSpend: 166217, tiamSpend: 1511, fiscalYear: 'FY26', notes: 'Cost avoidance: $5.67M' },
        { publisher: 'UserTesting', companySpend: 6147239, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Autodesk Inc.', companySpend: 4638650, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Docker', companySpend: 2856159, msdSpend: 17137, tiamSpend: 6000, fiscalYear: 'FY26', notes: '' },
        { publisher: 'SensorTower Inc.', companySpend: 1750000, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Perforce Software', companySpend: 961395, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Tactivos Inc.', companySpend: 866856, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Catchpoint', companySpend: 802745, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Staffbase', companySpend: 732000, msdSpend: 732000, tiamSpend: 732000, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Articulate Global', companySpend: 722336, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'JMP Statistical', companySpend: 430260, msdSpend: 1580, tiamSpend: 0, fiscalYear: 'FY26', notes: '' },
        { publisher: 'Progress (Telerik)', companySpend: 16277, msdSpend: 0, tiamSpend: 0, fiscalYear: 'FY26', notes: 'Cost avoidance: $814K' }
    ],
    
    // Sheet 3: Risk Data
    riskData: [
        { publisher: 'Adobe', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: '' },
        { publisher: 'Anthropic', sspa: 0, po: 1, finance: 0, legal: 0, inventory: 0, details: 'COO PO on Hold - Company-wide 30-day freeze blocking deployments' },
        { publisher: 'Articulate', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'SSPA Supplier DPR due date = 12/20/2025' },
        { publisher: 'Autodesk', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'SSPA Supplier DPR due date = 12/23/2025' },
        { publisher: 'Catchpoint', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: '' },
        { publisher: 'Docker', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: '' },
        { publisher: 'Figma', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'SSPA Supplier anniversary date 10/13/2025 - Due date 1/13/2026' },
        { publisher: 'JMP Statistical', sspa: 0, po: 0, finance: 0, legal: 1, inventory: 0, details: 'CELA requires contracts on Microsoft paper. Supplier will not comply. One-year renewal approved.' },
        { publisher: 'Open AI', sspa: 1, po: 0, finance: 1, legal: 0, inventory: 0, details: 'SSPA Restricted - Supplier must complete certifications. No GC defined.' },
        { publisher: 'Perforce', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'SSPA Supplier DPR due date = 11/1/2025' },
        { publisher: 'Progress', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: '' },
        { publisher: 'SensorTower', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'SSPA Supplier DPR due date = 12/4/2025' },
        { publisher: 'ServiceNow', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 1, details: 'No defined method for internal purchase and tracking of license consumption' },
        { publisher: 'Staffbase', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'Supplier status restricted. Code of Conduct non-compliant. DPR due 12/4/2025' },
        { publisher: 'Tactivos', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'Supplier status restricted. Code of Conduct non-compliant. DPR due 12/4/2025' },
        { publisher: 'TechSmith', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: '' },
        { publisher: 'UserTesting', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: 'SSPA Supplier DPR due date = 12/15/2025' }
    ],
    
    // Sheet 4: Managed Titles
    managedTitles: [
        { title: 'UU Platform', publisher: 'ServiceNow', category: 'Productivity', licenseCount: 0, notes: '' },
        { title: 'Creative Cloud', publisher: 'Adobe', category: 'Design', licenseCount: 0, notes: '' },
        { title: 'Figma', publisher: 'Figma', category: 'Design', licenseCount: 0, notes: '' },
        { title: 'StaffBase', publisher: 'Staffbase', category: 'Communication', licenseCount: 0, notes: '' },
        { title: 'Docker', publisher: 'Docker', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'Mural', publisher: 'Tactivos Inc.', category: 'Productivity', licenseCount: 0, notes: '' },
        { title: 'JMP Pro', publisher: 'JMP Statistical Discovery', category: 'Analytics', licenseCount: 0, notes: '' },
        { title: 'JMP Standard', publisher: 'JMP Statistical Discovery', category: 'Analytics', licenseCount: 0, notes: '' },
        { title: 'JetBrains All Products Pack', publisher: 'JetBrains', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'JetBrains IntelliJ IDEA Ultimate', publisher: 'JetBrains', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'JetBrains PyCharm', publisher: 'JetBrains', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'JetBrains WebStorm', publisher: 'JetBrains', category: 'Development', licenseCount: 0, notes: '' },
        { title: '3ds Max', publisher: 'Autodesk Inc.', category: 'Design', licenseCount: 0, notes: '' },
        { title: 'Maya', publisher: 'Autodesk Inc.', category: 'Design', licenseCount: 0, notes: '' },
        { title: 'Camtasia', publisher: 'TechSmith', category: 'Productivity', licenseCount: 0, notes: '' },
        { title: 'SnagIt', publisher: 'TechSmith', category: 'Productivity', licenseCount: 0, notes: '' },
        { title: 'UserTesting', publisher: 'UserTesting', category: 'Analytics', licenseCount: 0, notes: '' },
        { title: 'Articulate 360', publisher: 'Articulate Global', category: 'Productivity', licenseCount: 0, notes: '' },
        { title: 'Helix Core', publisher: 'Perforce Software', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'SensorTower', publisher: 'SensorTower Inc.', category: 'Analytics', licenseCount: 0, notes: '' },
        { title: 'Telerik DevCraft', publisher: 'Progress', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'Claude Code', publisher: 'Anthropic', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'ChatGPT Enterprise', publisher: 'Open AI', category: 'Development', licenseCount: 0, notes: '' },
        { title: 'Catchpoint', publisher: 'Catchpoint', category: 'Analytics', licenseCount: 0, notes: '' }
    ],
    
    // Sheet 5: External KPIs (from external systems)
    externalKpis: [
        { name: 'SNOW Tickets MTD', value: 706, unit: 'tickets', source: 'ServiceNow', lastUpdated: '2026-01-26', notes: '' },
        { name: 'ICM Tickets MTD', value: 130, unit: 'tickets', source: 'ICM System', lastUpdated: '2026-01-26', notes: '' }
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
    rawData = (typeof Storage !== 'undefined' && Storage.hasStoredData()) 
        ? Storage.loadData(defaultRawData) 
        : defaultRawData;
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
