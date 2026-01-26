// Calculations Module - Derive chart data from raw data
const Calculations = (function() {
    
    // Compute potential savings from publishers data - grouped by savings type
    function computePotentialSavings(rawData) {
        const publishers = rawData.publishers || [];
        
        // Define savings type colors
        const savingsTypeColors = {
            'Cost Avoidance': '#1abc9c',
            'Cost Reduction': '#e67e22',
            'License Optimization': '#3498db',
            'Renegotiation': '#9b59b6',
            'Consolidation': '#2c3e50',
            'Other': '#e74c3c'
        };
        
        // Group savings by type
        const savingsByType = {};
        publishers.forEach(p => {
            const amount = p.savingsAmount || p.savings || 0;
            const type = p.savingsType || 'Other';
            
            if (amount > 0) {
                if (!savingsByType[type]) {
                    savingsByType[type] = 0;
                }
                savingsByType[type] += amount;
            }
        });
        
        // Calculate total for percentages
        const total = Object.values(savingsByType).reduce((sum, val) => sum + val, 0);
        
        // Build chart data sorted by amount descending
        const sortedTypes = Object.entries(savingsByType)
            .sort((a, b) => b[1] - a[1]);
        
        const labels = [];
        const values = [];
        const percentages = [];
        const colors = [];
        
        sortedTypes.forEach(([type, amount]) => {
            const valueInMillions = amount / 1000000;
            const pct = total > 0 ? (amount / total * 100) : 0;
            
            labels.push(type);
            values.push(parseFloat(valueInMillions.toFixed(2)));
            percentages.push(pct.toFixed(2) + '%');
            colors.push(savingsTypeColors[type] || '#95a5a6');
        });
        
        // If no savings, add placeholder
        if (labels.length === 0) {
            labels.push('No Savings Data');
            values.push(0);
            percentages.push('0%');
            colors.push('#95a5a6');
        }
        
        return {
            labels,
            values,
            percentages,
            colors
        };
    }
    
    // Compute risks tracking from risk heatmap
    function computeRisksTracking(rawData) {
        const heatmap = rawData.riskHeatmap || [];
        const categories = ['SSPA', 'PO', 'Finance', 'Legal', 'Inventory'];
        const categoryKeys = ['sspa', 'po', 'finance', 'legal', 'inventory'];
        const colors = ['#2c3e50', '#3498db', '#1abc9c', '#9b59b6', '#e67e22'];
        
        // Count publishers with non-empty risk value for each category
        // Supports both numeric (legacy) and text (new) values
        const values = categoryKeys.map(key => {
            return heatmap.filter(p => {
                const val = p[key];
                // Count as 1 if: number > 0, or non-empty string
                if (typeof val === 'number') return val > 0;
                if (typeof val === 'string') return val.trim() !== '';
                return false;
            }).length;
        });
        
        return {
            categories,
            values,
            colors
        };
    }
    
    // Compute upcoming renewals from publishers
    function computeUpcomingRenewals(rawData) {
        const publishers = rawData.publishers || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter publishers with valid renewal dates in the future
        const upcoming = publishers
            .filter(p => p.renewalDate)
            .map(p => ({
                ...p,
                renewalDateObj: new Date(p.renewalDate)
            }))
            .filter(p => p.renewalDateObj >= today)
            .sort((a, b) => a.renewalDateObj - b.renewalDateObj);
        
        if (upcoming.length === 0) {
            return {
                daysUntilNext: 0,
                publisher: 'None',
                renewalDate: 'N/A',
                csaExpThisQ: 0,
                coExpThisQ: 0
            };
        }
        
        const next = upcoming[0];
        const daysUntil = Math.ceil((next.renewalDateObj - today) / (1000 * 60 * 60 * 24));
        
        // Calculate Q end date
        const currentQ = Math.floor(today.getMonth() / 3);
        const qEndMonth = (currentQ + 1) * 3;
        const qEndDate = new Date(today.getFullYear(), qEndMonth, 0);
        
        // Count expirations this quarter (simplified - would need CSA/CO data)
        const expiringThisQ = upcoming.filter(p => p.renewalDateObj <= qEndDate).length;
        
        return {
            daysUntilNext: daysUntil,
            publisher: next.name,
            renewalDate: formatDateShort(next.renewalDateObj),
            csaExpThisQ: 0, // Would need separate CSA data
            coExpThisQ: expiringThisQ
        };
    }
    
    // Compute compliance health from publishers
    function computeComplianceHealth(rawData) {
        const publishers = rawData.publishers || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate quarter and year end
        const currentQ = Math.floor(today.getMonth() / 3);
        const qEndMonth = (currentQ + 1) * 3;
        const eoq = new Date(today.getFullYear(), qEndMonth, 0);
        const eoy = new Date(today.getFullYear(), 11, 31);
        
        const categories = {
            pastDue: [],
            dueByEoq: [],
            dueByEoy: []
        };
        
        publishers.forEach(pub => {
            if (!pub.renewalDate) return;
            
            const renewalDate = new Date(pub.renewalDate);
            
            if (renewalDate < today) {
                categories.pastDue.push(pub.name);
            } else if (renewalDate <= eoq) {
                categories.dueByEoq.push(pub.name);
            } else if (renewalDate <= eoy) {
                categories.dueByEoy.push(pub.name);
            }
        });
        
        const values = [
            categories.pastDue.length,
            categories.dueByEoq.length,
            categories.dueByEoy.length
        ];
        
        const total = values.reduce((a, b) => a + b, 0);
        const percentages = values.map(v => 
            total > 0 ? Math.round(v / total * 100) + '%' : '0%'
        );
        
        return {
            labels: ['Past Due', 'Renewals Due by EOQ', 'Renewals Due by EOY'],
            values,
            percentages,
            colors: ['#e74c3c', '#e67e22', '#3498db'],
            categoryLists: [categories.pastDue, categories.dueByEoq, categories.dueByEoy]
        };
    }
    
    // Compute KPI totals from raw data
    function computeKpis(rawData) {
        const annualSpend = rawData.annualSpend || [];
        const managedTitles = rawData.managedTitles || [];
        const publishers = rawData.publishers || [];
        const kpis = rawData.kpis || {};
        
        // Sum up spend values
        const companySpend = annualSpend.reduce((sum, p) => sum + (p.spend || 0), 0);
        const msdSpend = annualSpend.reduce((sum, p) => sum + (p.msdSpend || 0), 0);
        const tiamSpend = annualSpend.reduce((sum, p) => sum + (p.tiamSpend || 0), 0);
        
        // Count unique publishers
        const uniquePublishers = new Set(publishers.map(p => p.name)).size;
        
        return {
            companySpend: companySpend / 1000000, // In millions
            msdSpend: msdSpend / 1000000,
            tiamSpend: tiamSpend / 1000, // In thousands (smaller amount)
            snowTickets: kpis.snowTickets || 0, // Keep from raw (external system)
            icmTickets: kpis.icmTickets || 0,   // Keep from raw (external system)
            managedTitles: managedTitles.length,
            managedPublishers: uniquePublishers
        };
    }
    
    // Format KPI value for display
    function formatKpiValue(value, type) {
        switch(type) {
            case 'companySpend':
            case 'msdSpend':
                return value.toFixed(2) + 'M';
            case 'tiamSpend':
                return value.toFixed(2) + 'K';
            default:
                return Math.round(value).toString();
        }
    }
    
    // Compute all derived data from raw
    function computeAll(rawData) {
        return {
            potentialSavings: computePotentialSavings(rawData),
            risksTracking: computeRisksTracking(rawData),
            upcomingRenewals: computeUpcomingRenewals(rawData),
            complianceHealth: computeComplianceHealth(rawData),
            kpis: computeKpis(rawData)
        };
    }
    
    // Utility: format date as M/D/YYYY
    function formatDateShort(date) {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
    
    // Public API
    return {
        computePotentialSavings,
        computeRisksTracking,
        computeUpcomingRenewals,
        computeComplianceHealth,
        computeKpis,
        computeAll,
        formatKpiValue
    };
})();

// Export for global access
window.Calculations = Calculations;
