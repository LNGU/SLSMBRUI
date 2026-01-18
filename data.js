// Dashboard Data - Loaded from base_data.xlsx
const dashboardData = {
    // Last Refreshed
    lastRefreshed: 'Jan 17, 2026',
    currentMonth: 'January',
    
    // KPI Values (calculated from data)
    kpis: {
        companySpend: 134.18,
        msdSpend: 6.64,
        tiamSpend: 765.51,
        snowTickets: 706,
        icmTickets: 130,
        managedTitles: 42,
        managedPublishers: 19
    },
    
    // Latest Potential Savings by Publisher
    potentialSavings: {
        labels: ['Figma', 'ServiceNow', 'Progress', 'JMP Statistical Discovery'],
        values: [5.67, 3.72, 0.81, 0],
        percentages: ['55.55%', '36.47%', '7.98%', '0%'],
        colors: ['#1abc9c', '#e67e22', '#3498db', '#2c3e50']
    },
    
    // Risks Tracking
    risksTracking: {
        categories: ['SSPA', 'PO', 'Finance', 'Legal', 'Inventory'],
        values: [8, 3, 3, 1, 1],
        colors: ['#2c3e50', '#3498db', '#1abc9c', '#9b59b6', '#e67e22']
    },
    
    // Upcoming Renewals
    upcomingRenewals: {
        daysUntilNext: 14,
        publisher: 'Docker',
        renewalDate: '1/31/2026',
        csaExpThisQ: 0,
        coExpThisQ: 0
    },
    
    // Annual Spend by Publisher (from Excel data)
    annualSpend: [
        { publisher: 'ServiceNow', spend: 87113708, msdSpend: 4954050, tiamSpend: 0 },
        { publisher: 'Adobe', spend: 13644685, msdSpend: 111765, tiamSpend: 26000 },
        { publisher: 'Figma', spend: 13500000, msdSpend: 166217, tiamSpend: 1511 },
        { publisher: 'UserTesting', spend: 6147239, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'Autodesk Inc.', spend: 4638650, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'Docker', spend: 2856159, msdSpend: 17137, tiamSpend: 6000 },
        { publisher: 'SensorTower Inc.', spend: 1750000, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'Perforce Software', spend: 961395, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'Tactivos Inc.', spend: 866856, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'Catchpoint', spend: 802745, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'Staffbase', spend: 732000, msdSpend: 732000, tiamSpend: 732000 },
        { publisher: 'Articulate Global', spend: 722336, msdSpend: 0, tiamSpend: 0 },
        { publisher: 'JMP Statistical', spend: 430260, msdSpend: 1580, tiamSpend: 0 },
        { publisher: 'Progress (Telerik)', spend: 16277, msdSpend: 0, tiamSpend: 0 }
    ],
    
    // Risk Score Heatmap Data (from Excel Risks columns)
    riskHeatmap: [
        { name: 'Adobe', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: {} },
        { name: 'Anthropic', sspa: 0, po: 1, finance: 0, legal: 0, inventory: 0, details: { po: 'COO PO on Hold - Company-wide 30-day freeze blocking deployments' } },
        { name: 'Articulate', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'SSPA Supplier DPR due date = 12/20/2025' } },
        { name: 'Autodesk', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'SSPA Supplier DPR due date = 12/23/2025' } },
        { name: 'Catchpoint', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: {} },
        { name: 'Docker', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: {} },
        { name: 'Figma', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'SSPA Supplier anniversary date 10/13/2025 - Due date 1/13/2026' } },
        { name: 'JMP Statistical', sspa: 0, po: 0, finance: 0, legal: 1, inventory: 0, details: { legal: 'CELA requires contracts on Microsoft paper and Supplier will not comply. CELA has approved a one-year renewal; RFP cancelled.' } },
        { name: 'Open AI', sspa: 1, po: 0, finance: 1, legal: 0, inventory: 0, details: { sspa: 'SSPA Restricted - Supplier must complete their certifications', finance: 'No GC defined. No clear licensing, usage, deployment strategy.' } },
        { name: 'Perforce', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'SSPA Supplier DPR due date = 11/1/2025' } },
        { name: 'Progress', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: {} },
        { name: 'SensorTower', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'SSPA Supplier DPR due date = 12/4/2025' } },
        { name: 'ServiceNow', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 1, details: { inventory: 'No defined method for internal purchase and tracking of license consumption' } },
        { name: 'Staffbase', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'Supplier status is restricted. Supplier Code of Conduct is non-compliant. SSPA Supplier DPR due date = 12/4/2025' } },
        { name: 'Tactivos', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'Supplier status is restricted. Supplier Code of Conduct is non-compliant. SSPA Supplier DPR due date = 12/4/2025' } },
        { name: 'TechSmith', sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0, details: {} },
        { name: 'UserTesting', sspa: 1, po: 0, finance: 0, legal: 0, inventory: 0, details: { sspa: 'SSPA Supplier DPR due date = 12/15/2025' } }
    ],
    
    // License Renewals/Compliance Health
    complianceHealth: {
        labels: ['Past Due', 'Renewals Due by EOQ', 'Renewals Due by EOY'],
        values: [1, 7, 8],
        percentages: ['6%', '44%', '50%'],
        colors: ['#e74c3c', '#e67e22', '#3498db']
    },
    
    // Publisher Details (from Excel - for detail views)
    publishers: [
        { name: 'ServiceNow', title: 'UU Platform', type: 'SaaS', contact: 'Kathren / Anahit', renewalDate: '2031-06-29', savings: 3723770.88, savingsType: 'Cost Reduction' },
        { name: 'Adobe', title: 'Creative Cloud', type: 'Hybrid', contact: 'Kathren', renewalDate: '2026-06-30', savings: 0, savingsType: 'Cost Avoidance' },
        { name: 'Figma', title: 'Figma', type: 'SaaS', contact: 'Neva', renewalDate: '2026-07-31', savings: 5672880, savingsType: 'Cost Avoidance' },
        { name: 'Staffbase', title: 'Staffbase', type: 'SaaS', contact: 'Kathren', renewalDate: '2025-11-29', savings: 0, savingsType: null },
        { name: 'Docker', title: 'Docker', type: 'On Prem', contact: 'Neva', renewalDate: '2026-01-31', savings: 0, savingsType: 'Cost Avoidance' },
        { name: 'Tactivos Inc.', title: 'MURAL', type: 'SaaS', contact: 'Harinder', renewalDate: '2026-07-31', savings: 0, savingsType: null },
        { name: 'JMP Statistical Discovery', title: 'JMP Standard/JMP Pro', type: 'On Prem', contact: 'Neva', renewalDate: '2026-10-24', savings: 0, savingsType: null },
        { name: 'Autodesk Inc.', title: '3ds Max/Maya/MotionBuilder/Mudbox/Flame/ShotGrid', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-10-26', savings: 0, savingsType: null },
        { name: 'UserTesting', title: 'UserTesting', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-08-31', savings: 0, savingsType: null },
        { name: 'Perforce Software', title: 'Helix Core/Helix DAM', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-29', savings: 0, savingsType: null },
        { name: 'SensorTower Inc.', title: 'SensorTower/Data.AI', type: 'SaaS', contact: 'Kathren', renewalDate: '2026-06-30', savings: 0, savingsType: null },
        { name: 'Progress', title: 'Telerik DevCraft', type: 'Hybrid', contact: 'Kathren', renewalDate: '2027-05-07', savings: 814860, savingsType: 'Cost Avoidance' },
        { name: 'Anthropic', title: 'Claude Code', type: 'SaaS', contact: 'Kathren', renewalDate: null, savings: 0, savingsType: null },
        { name: 'Open AI', title: 'ChatGPT Enterprise', type: 'SaaS', contact: 'Kathren', renewalDate: null, savings: 0, savingsType: null }
    ],
    
    // Managed Titles (42 titles from Sheet2)
    managedTitles: [
        'UU Platform', 'Creative Cloud', 'Figma', 'StaffBase', 'Docker', 'Mural',
        'JMP Pro', 'JMP Standard', 'JetBrains All Products Pack', 'JetBrains CLion',
        'JetBrains DataGrip', 'JetBrains dotTracer', 'JetBrains dotUltimate',
        'JetBrains GoLand', 'JetBrains IntelliJ IDEA Ultimate', 'JetBrains PhpStorm',
        'JetBrains PyCharm', 'JetBrains ReShaper', 'JetBrains Rider', 'JetBrains RubyMine',
        'JetBrains TeamCity', 'JetBrains WebStorm', 'Sketchup', 'Catchpoint',
        '3ds Max', 'Maya', 'MotionBuilder', 'Mudbox', 'Flame', 'ShotGrid',
        'Camtasia', 'SnagIt', 'UserTesting', 'Articulate 360', 'Reach 360 Pro',
        'Helix Core', 'Helix Digital Asset Management', 'SensorTower', 'Data.AI',
        'Telerik Progress DevCraft Complete Enterprise', 'Claude Code', 'ChatGPT Enterprise'
    ]
};

// Export for use in charts.js
window.dashboardData = dashboardData;
