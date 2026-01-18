// Chart initialization and rendering
document.addEventListener('DOMContentLoaded', function() {
    initDateDisplay();
    initSavingsChart();
    initRisksChart();
    initSpendChart();
    initHeatmap();
    initComplianceChart();
});

// Initialize dynamic date display
function initDateDisplay() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Set current month
    document.getElementById('currentMonth').textContent = months[now.getMonth()];
    
    // Set last refreshed date
    const day = now.getDate();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    document.getElementById('lastRefreshed').textContent = `${month} ${day}, ${year}`;
    
    // Update data object as well
    dashboardData.currentMonth = months[now.getMonth()];
    dashboardData.lastRefreshed = `${month} ${day}, ${year}`;
}

// Latest Potential Savings - Pie Chart
function initSavingsChart() {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    const data = dashboardData.potentialSavings;
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            return `$${context.raw}M (${data.percentages[index]})`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function(value, context) {
                        const percentage = data.percentages[context.dataIndex];
                        if (value > 0) {
                            return `$${value}M\n(${percentage})`;
                        }
                        return '';
                    },
                    textAlign: 'center'
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Risks Tracking - Bar Chart
function initRisksChart() {
    const ctx = document.getElementById('risksChart').getContext('2d');
    const data = dashboardData.risksTracking;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.categories,
            datasets: [{
                label: 'Risks',
                data: data.values,
                backgroundColor: data.colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    color: '#fff',
                    anchor: 'center',
                    align: 'center',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Annual Spend by Publisher - Horizontal Bar Chart (Grouped, Log Scale)
function initSpendChart() {
    const ctx = document.getElementById('spendChart').getContext('2d');
    const data = dashboardData.annualSpend;
    
    // Sort by company spend descending and take top 10
    const sortedData = [...data].sort((a, b) => b.spend - a.spend).slice(0, 10);
    const labels = sortedData.map(d => d.publisher);
    const companySpend = sortedData.map(d => d.spend || 0.1);
    const msdSpend = sortedData.map(d => d.msdSpend || 0.1);
    const tiamSpend = sortedData.map(d => d.tiamSpend || 0.1);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Company Spend',
                    data: companySpend,
                    backgroundColor: '#3498db',
                    borderRadius: 3
                },
                {
                    label: 'MSD Spend',
                    data: msdSpend,
                    backgroundColor: '#1abc9c',
                    borderRadius: 3
                },
                {
                    label: 'TI&M Spend',
                    data: tiamSpend,
                    backgroundColor: '#9b59b6',
                    borderRadius: 3
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (value <= 0.1) return context.dataset.label + ': $0';
                            if (value >= 1000000) {
                                return context.dataset.label + ': $' + (value / 1000000).toFixed(2) + 'M';
                            }
                            return context.dataset.label + ': $' + value.toLocaleString();
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        // Only show label for company spend (first dataset) to avoid clutter
                        return context.datasetIndex === 0;
                    },
                    color: '#2c3e50',
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    font: {
                        weight: 'bold',
                        size: 9
                    },
                    formatter: function(value) {
                        if (value <= 0.1) return '';
                        if (value >= 1000000) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                        return '$' + (value / 1000).toFixed(0) + 'K';
                    }
                }
            },
            scales: {
                x: {
                    type: 'logarithmic',
                    min: 1000,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return '$' + (value / 1000000).toFixed(0) + 'M';
                            } else if (value >= 1000) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                            return '$' + value;
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Risk Score Heatmap
function initHeatmap(filter = 'risks') {
    const container = document.getElementById('heatmapContainer');
    const heatmapData = dashboardData.riskHeatmap;
    const categories = ['SSPA', 'PO', 'Finance', 'Legal', 'Inventory'];
    const categoryKeys = ['sspa', 'po', 'finance', 'legal', 'inventory'];
    
    // Filter data based on toggle
    const filteredData = filter === 'risks' 
        ? heatmapData.filter(p => categoryKeys.some(key => p[key] > 0))
        : heatmapData;
    
    // Create header row (sticky)
    let html = '<div class="heatmap-row heatmap-sticky-header">';
    html += '<div class="heatmap-header"></div>';
    categories.forEach(cat => {
        html += `<div class="heatmap-header">${cat}</div>`;
    });
    html += '</div>';
    
    // Create data rows
    filteredData.forEach(publisher => {
        html += '<div class="heatmap-row">';
        html += `<div class="heatmap-label">${publisher.name}</div>`;
        
        categoryKeys.forEach((key, index) => {
            const risk = publisher[key];
            const detail = publisher.details && publisher.details[key] ? publisher.details[key] : '';
            const hasDetail = detail !== '';
            
            if (risk === 0) {
                html += `<div class="heatmap-cell level-0" ${hasDetail ? `data-tooltip="${detail}"` : ''}>0</div>`;
            } else if (risk === 1) {
                html += `<div class="heatmap-cell level-1 has-risk" data-publisher="${publisher.name}" data-category="${categories[index]}" data-tooltip="${detail || 'Risk identified'}">${risk}</div>`;
            } else if (risk === 2) {
                html += `<div class="heatmap-cell level-2 has-risk" data-publisher="${publisher.name}" data-category="${categories[index]}" data-tooltip="${detail || 'Risk identified'}">${risk}</div>`;
            } else if (risk >= 3) {
                html += `<div class="heatmap-cell level-3 has-risk" data-publisher="${publisher.name}" data-category="${categories[index]}" data-tooltip="${detail || 'Risk identified'}">${risk}</div>`;
            } else {
                html += '<div class="heatmap-cell empty"></div>';
            }
        });
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Add tooltip functionality
    initHeatmapTooltips();
    
    // Setup toggle buttons
    setupHeatmapToggle();
}

function setupHeatmapToggle() {
    const toggleBtns = document.querySelectorAll('.heatmap-toggle .toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent modal from opening
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            initHeatmap(this.dataset.filter);
        });
    });
}

function initHeatmapTooltips() {
    const cells = document.querySelectorAll('.heatmap-cell.has-risk');
    
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'heatmap-tooltip';
            
            const publisher = this.dataset.publisher;
            const category = this.dataset.category;
            const detail = this.dataset.tooltip;
            
            tooltip.innerHTML = `
                <strong>${publisher}</strong><br>
                <span class="tooltip-category">${category} Risk</span><br>
                <span class="tooltip-detail">${detail}</span>
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + window.scrollX + 'px';
            tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
            
            this._tooltip = tooltip;
        });
        
        cell.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// License Renewals/Compliance Health - Doughnut Chart
function initComplianceChart() {
    const ctx = document.getElementById('complianceChart').getContext('2d');
    const data = dashboardData.complianceHealth;
    
    // Calculate which publishers fall into each category
    const publishers = dashboardData.publishers.filter(p => p.renewalDate);
    const today = new Date();
    const eoq = new Date(today.getFullYear(), 2, 31); // March 31
    const eoy = new Date(today.getFullYear(), 11, 31); // Dec 31
    
    const categories = {
        pastDue: [],
        dueByEoq: [],
        dueByEoy: []
    };
    
    publishers.forEach(pub => {
        const renewalDate = new Date(pub.renewalDate);
        if (renewalDate < today) {
            categories.pastDue.push(pub.name);
        } else if (renewalDate <= eoq) {
            categories.dueByEoq.push(pub.name);
        } else if (renewalDate <= eoy) {
            categories.dueByEoy.push(pub.name);
        }
    });
    
    const categoryLists = [categories.pastDue, categories.dueByEoq, categories.dueByEoy];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const titles = categoryLists[index];
                            if (titles.length === 0) {
                                return ['No titles'];
                            }
                            return titles.map((t, i) => (i === 0 ? 'Titles: ' + t : '  ' + t));
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function(value, context) {
                        const percentage = data.percentages[context.dataIndex];
                        if (value > 0) {
                            return `${value}\n(${percentage})`;
                        }
                        return '';
                    },
                    textAlign: 'center'
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Tab Navigation
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});
