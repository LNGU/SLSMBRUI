// Modal functionality for showing data details
document.addEventListener('DOMContentLoaded', function() {
    initModals();
});

function initModals() {
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // Close modal on X click
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });
    
    // KPI Card clicks
    document.querySelectorAll('.kpi-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const kpiType = card.dataset.kpi;
            showKpiDetail(kpiType);
        });
    });
    
    // Chart Card clicks
    document.querySelectorAll('.card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const cardType = card.dataset.card;
            showCardDetail(cardType);
        });
    });
}

function showModal(title, content) {
    const modal = document.getElementById('detailModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    modal.classList.add('active');
}

function formatCurrency(value) {
    if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(2) + 'K';
    }
    return '$' + value.toFixed(2);
}

function showKpiDetail(kpiType) {
    let title, content;
    
    switch(kpiType) {
        case 'companySpend':
            title = 'FY26 Company Spend - Detail Breakdown';
            content = generateSpendDetail('spend', 'FY26 Company Annual Spend');
            break;
        case 'msdSpend':
            title = 'FY26 MSD Spend - Detail Breakdown';
            content = generateSpendDetail('msdSpend', 'FY26 MSD Annual Spend');
            break;
        case 'tiamSpend':
            title = 'FY26 TI&M Spend - Detail Breakdown';
            content = generateSpendDetail('tiamSpend', 'FY26 TI&M Annual Spend');
            break;
        case 'snowTickets':
            title = 'SNOW Tickets MTD';
            content = `
                <div class="summary-box">
                    <p>This value (706) is tracked externally in ServiceNow ticket system.</p>
                </div>
            `;
            break;
        case 'icmTickets':
            title = 'ICM Tickets MTD';
            content = `
                <div class="summary-box">
                    <p>This value (130) is tracked externally in ICM ticket system.</p>
                </div>
            `;
            break;
        case 'managedTitles':
            title = 'SLS Managed Titles (42)';
            content = generateManagedTitlesDetail();
            break;
        case 'managedPublishers':
            title = 'SLS Managed Publishers (19)';
            content = generatePublishersDetail();
            break;
    }
    
    showModal(title, content);
}

function generateSpendDetail(field, columnName) {
    const data = dashboardData.annualSpend;
    let total = 0;
    
    // Calculate total
    data.forEach(item => {
        total += item[field] || 0;
    });
    
    let tableRows = '';
    const sortedData = [...data].sort((a, b) => (b[field] || 0) - (a[field] || 0));
    
    sortedData.forEach((item, index) => {
        const value = item[field] || 0;
        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
        tableRows += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.publisher}</td>
                <td class="number">${formatCurrency(value)}</td>
                <td class="number">${percentage}%</td>
            </tr>
        `;
    });
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Total ${columnName}</span>
                    <span class="value blue">${formatCurrency(total)}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Number of Publishers</span>
                    <span class="value">${data.length}</span>
                </div>
            </div>
        </div>
        <h4>Breakdown by Publisher</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Publisher</th>
                    <th class="number">${columnName}</th>
                    <th class="number">% of Total</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
                <tr class="total-row">
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td class="number"><strong>${formatCurrency(total)}</strong></td>
                    <td class="number"><strong>100%</strong></td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateManagedTitlesDetail() {
    const titles = dashboardData.managedTitles;
    
    let listItems = titles.map(title => `<li>${title}</li>`).join('');
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Total Managed Titles</span>
                    <span class="value blue">${titles.length}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Status</span>
                    <span class="value green">Active</span>
                </div>
            </div>
        </div>
        <h4>Complete List of Managed Titles</h4>
        <ul class="title-list">
            ${listItems}
        </ul>
    `;
}

function generatePublishersDetail() {
    const publishers = dashboardData.publishers;
    
    // Get unique publishers
    const uniquePublishers = [...new Set(publishers.map(p => p.name))];
    
    let listItems = publishers.map(pub => `
        <li>
            <span class="publisher-name">${pub.name}</span>
            <span class="publisher-details">${pub.title} | ${pub.type} | ${pub.contact}</span>
        </li>
    `).join('');
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Total Publishers</span>
                    <span class="value blue">${publishers.length}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">SaaS Publishers</span>
                    <span class="value">${publishers.filter(p => p.type === 'SaaS').length}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">On Prem Publishers</span>
                    <span class="value">${publishers.filter(p => p.type === 'On Prem').length}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Hybrid Publishers</span>
                    <span class="value">${publishers.filter(p => p.type === 'Hybrid').length}</span>
                </div>
            </div>
        </div>
        <h4>Publisher Details</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Publisher</th>
                    <th>Title/Product</th>
                    <th>Type</th>
                    <th>SLS Contact</th>
                </tr>
            </thead>
            <tbody>
                ${publishers.map(pub => `
                    <tr>
                        <td>${pub.name}</td>
                        <td>${pub.title}</td>
                        <td>${pub.type}</td>
                        <td>${pub.contact}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showCardDetail(cardType) {
    let title, content;
    
    switch(cardType) {
        case 'savings':
            title = 'Latest Potential Savings - Detail';
            content = generateSavingsDetail();
            break;
        case 'risks':
            title = 'Risks Tracking - Detail';
            content = generateRisksDetail();
            break;
        case 'renewals':
            title = 'Upcoming Renewals - Detail';
            content = generateRenewalsDetail();
            break;
        case 'spend':
            title = 'Annual Spend by Publisher - Full Data';
            content = generateFullSpendDetail();
            break;
        case 'heatmap':
            title = 'Risk Score Heatmap - Detail';
            content = generateHeatmapDetail();
            break;
        case 'compliance':
            title = 'License Renewals/Compliance Health - Detail';
            content = generateComplianceDetail();
            break;
    }
    
    showModal(title, content);
}

function generateSavingsDetail() {
    const publishers = dashboardData.publishers.filter(p => p.savings > 0);
    const totalSavings = publishers.reduce((sum, p) => sum + p.savings, 0);
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Total Potential Savings</span>
                    <span class="value green">${formatCurrency(totalSavings)}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Publishers with Savings</span>
                    <span class="value">${publishers.length}</span>
                </div>
            </div>
        </div>
        <h4>Savings Breakdown by Publisher</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Publisher</th>
                    <th>Savings Type</th>
                    <th class="number">Savings Amount</th>
                    <th class="number">% of Total</th>
                </tr>
            </thead>
            <tbody>
                ${publishers.sort((a, b) => b.savings - a.savings).map(pub => `
                    <tr>
                        <td>${pub.name}</td>
                        <td>${pub.savingsType || 'N/A'}</td>
                        <td class="number">${formatCurrency(pub.savings)}</td>
                        <td class="number">${((pub.savings / totalSavings) * 100).toFixed(2)}%</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td class="number"><strong>${formatCurrency(totalSavings)}</strong></td>
                    <td class="number"><strong>100%</strong></td>
                </tr>
            </tbody>
        </table>
        <div class="summary-box" style="margin-top: 20px;">
            <h3>Savings Types Explained</h3>
            <p><strong>Cost Reduction:</strong> Actual reduction in contract value through negotiation</p>
            <p><strong>Cost Avoidance:</strong> Prevented price increases or avoided unnecessary spend</p>
        </div>
    `;
}

function generateRisksDetail() {
    const heatmap = dashboardData.riskHeatmap;
    
    // Count risks by category and collect details
    const riskCounts = { sspa: 0, po: 0, finance: 0, legal: 0, inventory: 0 };
    const riskDetails = [];
    
    heatmap.forEach(pub => {
        if (pub.sspa > 0) { 
            riskCounts.sspa += pub.sspa; 
            if (pub.details.sspa) {
                riskDetails.push({ publisher: pub.name, category: 'SSPA', description: pub.details.sspa });
            }
        }
        if (pub.po > 0) { 
            riskCounts.po += pub.po; 
            if (pub.details.po) {
                riskDetails.push({ publisher: pub.name, category: 'PO', description: pub.details.po });
            }
        }
        if (pub.finance > 0) { 
            riskCounts.finance += pub.finance; 
            if (pub.details.finance) {
                riskDetails.push({ publisher: pub.name, category: 'Finance', description: pub.details.finance });
            }
        }
        if (pub.legal > 0) { 
            riskCounts.legal += pub.legal; 
            if (pub.details.legal) {
                riskDetails.push({ publisher: pub.name, category: 'Legal', description: pub.details.legal });
            }
        }
        if (pub.inventory > 0) { 
            riskCounts.inventory += pub.inventory; 
            if (pub.details.inventory) {
                riskDetails.push({ publisher: pub.name, category: 'Inventory', description: pub.details.inventory });
            }
        }
    });
    
    const totalRisks = Object.values(riskCounts).reduce((a, b) => a + b, 0);
    
    // Generate detailed risk rows
    const riskRows = riskDetails.map(risk => `
        <tr>
            <td>${risk.publisher}</td>
            <td><span class="risk-badge ${risk.category.toLowerCase()}">${risk.category}</span></td>
            <td>${risk.description}</td>
        </tr>
    `).join('');
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Total Risks</span>
                    <span class="value orange">${totalRisks}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">SSPA Risks</span>
                    <span class="value">${riskCounts.sspa}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">PO Risks</span>
                    <span class="value">${riskCounts.po}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Finance Risks</span>
                    <span class="value">${riskCounts.finance}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Legal Risks</span>
                    <span class="value">${riskCounts.legal}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Inventory Risks</span>
                    <span class="value">${riskCounts.inventory}</span>
                </div>
            </div>
        </div>
        <h4>Risk Details</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Publisher</th>
                    <th>Category</th>
                    <th>Risk Description</th>
                </tr>
            </thead>
            <tbody>
                ${riskRows}
            </tbody>
        </table>
    `;
}

function generateRenewalsDetail() {
    const publishers = dashboardData.publishers.filter(p => p.renewalDate);
    const today = new Date('2026-01-17');
    
    // Sort by renewal date
    const sorted = publishers.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
    
    return `
        <div class="summary-box">
            <h3>Next Renewal</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Next Renewal</span>
                    <span class="value orange">Docker</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Days Until</span>
                    <span class="value orange">14</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Renewal Date</span>
                    <span class="value">1/31/2026</span>
                </div>
            </div>
        </div>
        <h4>All Upcoming Renewals (Sorted by Date)</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Publisher</th>
                    <th>Product</th>
                    <th>Renewal Date</th>
                    <th class="number">Days Until</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(pub => {
                    const renewalDate = new Date(pub.renewalDate);
                    const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
                    const isPast = daysUntil < 0;
                    const isUrgent = daysUntil >= 0 && daysUntil <= 30;
                    return `
                        <tr style="${isPast ? 'background: #ffe6e6;' : isUrgent ? 'background: #fff3e6;' : ''}">
                            <td>${pub.name}</td>
                            <td>${pub.title}</td>
                            <td>${pub.renewalDate}</td>
                            <td class="number" style="${isPast ? 'color: #e74c3c;' : isUrgent ? 'color: #e67e22;' : ''}">${isPast ? 'PAST DUE' : daysUntil + ' days'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function generateFullSpendDetail() {
    const data = dashboardData.annualSpend;
    const totalCompany = data.reduce((sum, d) => sum + d.spend, 0);
    const totalMsd = data.reduce((sum, d) => sum + d.msdSpend, 0);
    const totalTiam = data.reduce((sum, d) => sum + d.tiamSpend, 0);
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Total Company Spend</span>
                    <span class="value blue">${formatCurrency(totalCompany)}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Total MSD Spend</span>
                    <span class="value blue">${formatCurrency(totalMsd)}</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Total TI&M Spend</span>
                    <span class="value blue">${formatCurrency(totalTiam)}</span>
                </div>
            </div>
        </div>
        <h4>Complete Spend Breakdown</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Publisher</th>
                    <th class="number">Company Spend</th>
                    <th class="number">MSD Spend</th>
                    <th class="number">TI&M Spend</th>
                </tr>
            </thead>
            <tbody>
                ${data.sort((a, b) => b.spend - a.spend).map(d => `
                    <tr>
                        <td>${d.publisher}</td>
                        <td class="number">${formatCurrency(d.spend)}</td>
                        <td class="number">${formatCurrency(d.msdSpend)}</td>
                        <td class="number">${formatCurrency(d.tiamSpend)}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td class="number"><strong>${formatCurrency(totalCompany)}</strong></td>
                    <td class="number"><strong>${formatCurrency(totalMsd)}</strong></td>
                    <td class="number"><strong>${formatCurrency(totalTiam)}</strong></td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateHeatmapDetail() {
    const heatmap = dashboardData.riskHeatmap;
    
    return `
        <div class="summary-box">
            <p>Each cell shows the risk score. Higher numbers indicate more/higher severity risks.</p>
        </div>
        <h4>Full Risk Matrix</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Publisher</th>
                    <th class="number">SSPA</th>
                    <th class="number">PO</th>
                    <th class="number">Finance</th>
                    <th class="number">Legal</th>
                    <th class="number">Inventory</th>
                    <th class="number">Total</th>
                </tr>
            </thead>
            <tbody>
                ${heatmap.map(pub => {
                    const total = pub.sspa + pub.po + pub.finance + pub.legal + pub.inventory;
                    return `
                        <tr>
                            <td>${pub.name}</td>
                            <td class="number" style="${pub.sspa > 0 ? 'background: #ffcccc;' : ''}">${pub.sspa}</td>
                            <td class="number" style="${pub.po > 0 ? 'background: #ffcccc;' : ''}">${pub.po}</td>
                            <td class="number" style="${pub.finance > 0 ? 'background: #ffcccc;' : ''}">${pub.finance}</td>
                            <td class="number" style="${pub.legal > 0 ? 'background: #ffcccc;' : ''}">${pub.legal}</td>
                            <td class="number" style="${pub.inventory > 0 ? 'background: #ffcccc;' : ''}">${pub.inventory}</td>
                            <td class="number"><strong>${total}</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function generateComplianceDetail() {
    const publishers = dashboardData.publishers.filter(p => p.renewalDate);
    const today = new Date('2026-01-17');
    
    // Categorize renewals
    const pastDue = [];
    const dueByEoq = []; // End of Q (March 31)
    const dueByEoy = []; // End of Year
    
    const eoq = new Date('2026-03-31');
    const eoy = new Date('2026-12-31');
    
    publishers.forEach(pub => {
        const renewalDate = new Date(pub.renewalDate);
        const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) {
            pastDue.push({ ...pub, daysUntil });
        } else if (renewalDate <= eoq) {
            dueByEoq.push({ ...pub, daysUntil });
        } else if (renewalDate <= eoy) {
            dueByEoy.push({ ...pub, daysUntil });
        }
    });
    
    return `
        <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="label">Past Due</span>
                    <span class="value" style="color: #e74c3c;">${pastDue.length} (${((pastDue.length / publishers.length) * 100).toFixed(0)}%)</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Due by EOQ (Mar 31)</span>
                    <span class="value orange">${dueByEoq.length} (${((dueByEoq.length / publishers.length) * 100).toFixed(0)}%)</span>
                </div>
                <div class="summary-stat">
                    <span class="label">Due by EOY (Dec 31)</span>
                    <span class="value blue">${dueByEoy.length} (${((dueByEoy.length / publishers.length) * 100).toFixed(0)}%)</span>
                </div>
            </div>
        </div>
        
        <h4 style="color: #e74c3c;">Past Due (${pastDue.length})</h4>
        ${pastDue.length > 0 ? `
            <table class="detail-table">
                <thead><tr><th>Publisher</th><th>Product</th><th>Renewal Date</th></tr></thead>
                <tbody>
                    ${pastDue.map(p => `<tr style="background:#ffe6e6;"><td>${p.name}</td><td>${p.title}</td><td>${p.renewalDate}</td></tr>`).join('')}
                </tbody>
            </table>
        ` : '<p>No past due renewals.</p>'}
        
        <h4 style="color: #e67e22; margin-top: 20px;">Due by End of Quarter (${dueByEoq.length})</h4>
        ${dueByEoq.length > 0 ? `
            <table class="detail-table">
                <thead><tr><th>Publisher</th><th>Product</th><th>Renewal Date</th><th>Days Until</th></tr></thead>
                <tbody>
                    ${dueByEoq.map(p => `<tr style="background:#fff3e6;"><td>${p.name}</td><td>${p.title}</td><td>${p.renewalDate}</td><td>${p.daysUntil} days</td></tr>`).join('')}
                </tbody>
            </table>
        ` : '<p>No renewals due by end of quarter.</p>'}
        
        <h4 style="color: #3498db; margin-top: 20px;">Due by End of Year (${dueByEoy.length})</h4>
        ${dueByEoy.length > 0 ? `
            <table class="detail-table">
                <thead><tr><th>Publisher</th><th>Product</th><th>Renewal Date</th><th>Days Until</th></tr></thead>
                <tbody>
                    ${dueByEoy.map(p => `<tr><td>${p.name}</td><td>${p.title}</td><td>${p.renewalDate}</td><td>${p.daysUntil} days</td></tr>`).join('')}
                </tbody>
            </table>
        ` : '<p>No renewals due by end of year.</p>'}
    `;
}
