// Data View Modal - Full data management with field customization

class DataViewModal {
    constructor() {
        this.modal = null;
        this.currentData = [];
        this.visibleFields = [];
        this.allFields = {};
        this.editingCell = null;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.pendingChanges = {};
        this.selectedRows = new Set();
        this.editingRowId = null;
        this.createModal();
        this.bindEvents();
    }

    // Field definitions with display names and types
    // Only truly essential fields are "core" - everything else can be removed
    getFieldDefinitions() {
        // Core fields - cannot be removed
        return {
            id: { label: 'ID', type: 'number', editable: false, width: '60px', core: true },
            name: { label: 'Publisher Name', type: 'text', editable: true, width: '150px', core: true },
            createdAt: { label: 'Created', type: 'datetime', editable: false, width: '150px', core: true },
            updatedAt: { label: 'Updated', type: 'datetime', editable: false, width: '150px', core: true }
        };
    }

    // Optional built-in fields - can be removed like custom fields
    getOptionalBuiltInFields() {
        return {
            title: { label: 'Product Title', type: 'text', editable: true, width: '180px', optional: true },
            type: { label: 'License Type', type: 'select', editable: true, width: '100px', optional: true,
                options: ['SaaS', 'On Prem', 'Hybrid'] },
            contact: { label: 'Contact', type: 'text', editable: true, width: '120px', optional: true },
            renewalDate: { label: 'Renewal Date', type: 'date', editable: true, width: '120px', optional: true },
            status: { label: 'Status', type: 'select', editable: true, width: '100px', optional: true,
                options: ['Active', 'Pending', 'Expired', 'In Review', 'Sunsetted'] },
            companySpend: { label: 'Company Spend', type: 'currency', editable: true, width: '130px', optional: true },
            msdSpend: { label: 'MSD Spend', type: 'currency', editable: true, width: '120px', optional: true },
            tiamSpend: { label: 'TI&M Spend', type: 'currency', editable: true, width: '120px', optional: true },
            savingsAmount: { label: 'Savings Amount', type: 'currency', editable: true, width: '130px', optional: true },
            savingsType: { label: 'Savings Type', type: 'select', editable: true, width: '120px', optional: true,
                options: ['Cost Avoidance', 'Cost Reduction', 'License Optimization', 'Renegotiation', 'Consolidation', 'Other'] },
            fiscalYear: { label: 'Fiscal Year', type: 'select', editable: true, width: '100px', optional: true,
                options: ['FY24', 'FY25', 'FY26', 'FY27', 'FY28'] },
            riskSSPA: { label: 'Risk: SSPA', type: 'text', editable: true, width: '150px', optional: true },
            riskPO: { label: 'Risk: PO', type: 'text', editable: true, width: '150px', optional: true },
            riskFinance: { label: 'Risk: Finance', type: 'text', editable: true, width: '150px', optional: true },
            riskLegal: { label: 'Risk: Legal', type: 'text', editable: true, width: '150px', optional: true },
            riskInventory: { label: 'Risk: Inventory', type: 'text', editable: true, width: '150px', optional: true },
            category: { label: 'Category', type: 'select', editable: true, width: '120px', optional: true,
                options: ['Design', 'Development', 'Productivity', 'Analytics', 'Communication', 'Security', 'Other'] },
            licenseCount: { label: 'License Count', type: 'number', editable: true, width: '100px', optional: true },
            notes: { label: 'Notes', type: 'textarea', editable: true, width: '200px', optional: true }
        };
    }

    // Default visible fields
    getDefaultVisibleFields() {
        return ['name', 'title', 'type', 'status', 'renewalDate', 'companySpend', 'msdSpend', 'contact'];
    }

    createModal() {
        const modalHTML = `
        <div id="data-view-modal" class="modal-overlay data-view-overlay">
            <div class="modal-container data-view-container">
                <div class="modal-header data-view-header">
                    <div class="data-view-title-section">
                        <h2 class="modal-title">📊 Data Management</h2>
                        <span class="data-view-count">0 records</span>
                    </div>
                    <div class="data-view-header-actions">
                        <button class="btn btn-ghost" id="dv-manage-fields">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"/>
                                <rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/>
                            </svg>
                            Manage Fields
                        </button>
                        <button class="btn btn-ghost" id="dv-add-field">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Field
                        </button>
                        <button class="btn btn-ghost" id="dv-add-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Record
                        </button>
                        <button class="btn btn-ghost" id="dv-export">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Export
                        </button>
                        <button class="btn btn-ghost" id="dv-history">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            History
                        </button>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                </div>
                
                <div class="data-view-toolbar">
                    <div class="dv-search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input type="text" id="dv-search" placeholder="Search all fields...">
                    </div>
                    <div class="dv-filters">
                        <select id="dv-filter-status" class="dv-filter-select">
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Expired">Expired</option>
                            <option value="In Review">In Review</option>
                            <option value="Sunsetted">Sunsetted</option>
                        </select>
                        <select id="dv-filter-type" class="dv-filter-select">
                            <option value="">All Types</option>
                            <option value="SaaS">SaaS</option>
                            <option value="On Prem">On Prem</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                </div>

                <div class="data-view-body">
                    <div class="data-table-wrapper">
                        <table class="data-table" id="data-table">
                            <thead id="data-table-head"></thead>
                            <tbody id="data-table-body"></tbody>
                        </table>
                    </div>
                </div>

                <div class="modal-footer data-view-footer">
                    <div class="dv-footer-info">
                        <span id="dv-selection-count">0 selected</span>
                        <button class="btn btn-ghost btn-sm" id="dv-delete-selected" disabled>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete Selected
                        </button>
                    </div>
                    <div class="dv-footer-actions">
                        <button class="btn btn-secondary" id="dv-cancel">Close</button>
                        <button class="btn btn-primary" id="dv-save-all">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Field Manager Panel -->
        <div id="field-manager-panel" class="field-manager-panel">
            <div class="field-manager-header">
                <h3>Manage Fields</h3>
                <button class="field-manager-close">&times;</button>
            </div>
            <div class="field-manager-body">
                <div class="field-list" id="field-list"></div>
            </div>
            <div class="field-manager-footer">
                <button class="btn btn-sm btn-ghost" id="fm-select-all">Select All</button>
                <button class="btn btn-sm btn-ghost" id="fm-deselect-all">Deselect All</button>
                <button class="btn btn-sm btn-ghost" id="fm-restore-fields" style="margin-left: auto;">Restore Fields</button>
            </div>
        </div>

        <!-- Add Field Modal -->
        <div id="add-field-modal" class="modal-overlay">
            <div class="modal-container add-field-container">
                <div class="modal-header">
                    <h2 class="modal-title">Add Custom Field</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="new-field-name">Field Name (key)</label>
                        <input type="text" id="new-field-name" placeholder="e.g., customField1">
                        <small>Use camelCase, no spaces</small>
                    </div>
                    <div class="form-group">
                        <label for="new-field-label">Display Label</label>
                        <input type="text" id="new-field-label" placeholder="e.g., Custom Field 1">
                    </div>
                    <div class="form-group">
                        <label for="new-field-type">Field Type</label>
                        <select id="new-field-type">
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="currency">Currency</option>
                            <option value="date">Date</option>
                            <option value="boolean">Yes/No</option>
                            <option value="textarea">Long Text</option>
                            <option value="url">URL</option>
                            <option value="select">Dropdown</option>
                        </select>
                    </div>
                    <div class="form-group" id="select-options-group" style="display: none;">
                        <label for="new-field-options">Dropdown Options</label>
                        <textarea id="new-field-options" placeholder="Enter options, one per line"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="add-field-cancel">Cancel</button>
                    <button class="btn btn-primary" id="add-field-confirm">Add Field</button>
                </div>
            </div>
        </div>

        <!-- Edit Field Modal -->
        <div id="edit-field-modal" class="modal-overlay">
            <div class="modal-container add-field-container">
                <div class="modal-header">
                    <h2 class="modal-title">Edit Field</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="edit-field-key">
                    <div class="form-group">
                        <label for="edit-field-label">Display Label</label>
                        <input type="text" id="edit-field-label" placeholder="e.g., Custom Field 1">
                    </div>
                    <div class="form-group">
                        <label for="edit-field-type">Field Type</label>
                        <select id="edit-field-type">
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="currency">Currency</option>
                            <option value="date">Date</option>
                            <option value="boolean">Yes/No</option>
                            <option value="textarea">Long Text</option>
                            <option value="url">URL</option>
                            <option value="select">Dropdown</option>
                        </select>
                    </div>
                    <div class="form-group" id="edit-select-options-group" style="display: none;">
                        <label for="edit-field-options">Dropdown Options</label>
                        <textarea id="edit-field-options" placeholder="Enter options, one per line"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-field-width">Column Width</label>
                        <input type="text" id="edit-field-width" placeholder="e.g., 120px, 150px">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="edit-field-cancel">Cancel</button>
                    <button class="btn btn-primary" id="edit-field-confirm">Save Field</button>
                </div>
            </div>
        </div>

        <!-- History Panel -->
        <div id="history-panel" class="history-panel">
            <div class="history-panel-header">
                <h3>📜 Change History</h3>
                <button class="history-panel-close">&times;</button>
            </div>
            <div class="history-panel-actions">
                <select id="history-filter" class="history-filter">
                    <option value="all">All Changes</option>
                    <option value="create">Created</option>
                    <option value="update">Updated</option>
                    <option value="delete">Deleted</option>
                </select>
                <button class="btn btn-sm btn-ghost" id="history-clear">Clear History</button>
            </div>
            <div class="history-list" id="history-list"></div>
        </div>

        <!-- Edit Row Modal -->
        <div id="edit-row-modal" class="modal-overlay">
            <div class="modal-container edit-row-container">
                <div class="modal-header">
                    <h2 class="modal-title" id="edit-row-title">Edit Record</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body" id="edit-row-form"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="edit-row-cancel">Cancel</button>
                    <button class="btn btn-primary" id="edit-row-save">Save</button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('data-view-modal');
        this.fieldManagerPanel = document.getElementById('field-manager-panel');
        this.addFieldModal = document.getElementById('add-field-modal');
        this.editFieldModal = document.getElementById('edit-field-modal');
        this.historyPanel = document.getElementById('history-panel');
        this.editRowModal = document.getElementById('edit-row-modal');
    }

    bindEvents() {
        // Close modal
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.confirmClose());
        this.modal.querySelector('#dv-cancel').addEventListener('click', () => this.confirmClose());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.confirmClose();
        });

        // Header actions
        document.getElementById('dv-manage-fields').addEventListener('click', () => this.toggleFieldManager());
        document.getElementById('dv-add-field').addEventListener('click', () => this.openAddFieldModal());
        document.getElementById('dv-add-row').addEventListener('click', () => this.openAddRowModal());
        document.getElementById('dv-export').addEventListener('click', () => this.exportData());
        document.getElementById('dv-history').addEventListener('click', () => this.toggleHistoryPanel());
        document.getElementById('dv-save-all').addEventListener('click', () => this.saveAllChanges());

        // Search and filters
        document.getElementById('dv-search').addEventListener('input', () => this.filterData());
        document.getElementById('dv-filter-status').addEventListener('change', () => this.filterData());
        document.getElementById('dv-filter-type').addEventListener('change', () => this.filterData());

        // Delete selected
        document.getElementById('dv-delete-selected').addEventListener('click', () => this.deleteSelected());

        // Field manager
        this.fieldManagerPanel.querySelector('.field-manager-close').addEventListener('click', () => this.closeFieldManager());
        document.getElementById('fm-select-all').addEventListener('click', () => this.selectAllFields());
        document.getElementById('fm-deselect-all').addEventListener('click', () => this.deselectAllFields());
        document.getElementById('fm-restore-fields').addEventListener('click', () => this.openRestoreFieldsDialog());

        // Add field modal
        this.addFieldModal.querySelector('.modal-close').addEventListener('click', () => this.closeAddFieldModal());
        document.getElementById('add-field-cancel').addEventListener('click', () => this.closeAddFieldModal());
        document.getElementById('add-field-confirm').addEventListener('click', () => this.addCustomField());
        document.getElementById('new-field-type').addEventListener('change', (e) => {
            document.getElementById('select-options-group').style.display = 
                e.target.value === 'select' ? 'block' : 'none';
        });

        // Edit field modal
        this.editFieldModal.querySelector('.modal-close').addEventListener('click', () => this.closeEditFieldModal());
        document.getElementById('edit-field-cancel').addEventListener('click', () => this.closeEditFieldModal());
        document.getElementById('edit-field-confirm').addEventListener('click', () => this.saveFieldEdit());
        document.getElementById('edit-field-type').addEventListener('change', (e) => {
            document.getElementById('edit-select-options-group').style.display = 
                e.target.value === 'select' ? 'block' : 'none';
        });

        // Edit row modal
        this.editRowModal.querySelector('.modal-close').addEventListener('click', () => this.closeEditRowModal());
        document.getElementById('edit-row-cancel').addEventListener('click', () => this.closeEditRowModal());
        document.getElementById('edit-row-save').addEventListener('click', () => this.saveRowEdit());

        // History panel
        this.historyPanel.querySelector('.history-panel-close').addEventListener('click', () => this.closeHistoryPanel());
        document.getElementById('history-filter').addEventListener('change', () => this.renderHistoryList());
        document.getElementById('history-clear').addEventListener('click', () => this.clearHistory());
    }

    open() {
        this.loadFieldConfig();
        this.loadData();
        this.renderTable();
        this.modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    confirmClose() {
        const hasUnsavedChanges = Object.keys(this.pendingChanges).length > 0;
        
        if (hasUnsavedChanges) {
            const result = confirm('You have unsaved changes. Do you want to save before closing?');
            if (result) {
                this.saveAllChanges();
            }
        }
        this.close();
    }

    close() {
        this.modal.classList.remove('open');
        this.closeFieldManager();
        this.closeHistoryPanel();
        document.body.style.overflow = '';
    }

    loadFieldConfig() {
        const savedFields = localStorage.getItem('slsmbrui_visible_fields');
        const customFields = localStorage.getItem('slsmbrui_custom_fields');
        const modifiedFields = localStorage.getItem('slsmbrui_modified_fields');
        const removedFields = localStorage.getItem('slsmbrui_removed_fields');
        
        // Start with core fields (cannot be removed)
        this.allFields = { ...this.getFieldDefinitions() };
        
        // Add optional built-in fields (can be removed)
        const optionalFields = this.getOptionalBuiltInFields();
        const removed = removedFields ? JSON.parse(removedFields) : [];
        
        Object.entries(optionalFields).forEach(([key, field]) => {
            if (!removed.includes(key)) {
                this.allFields[key] = field;
            }
        });
        
        // Apply modifications to fields
        if (modifiedFields) {
            const modified = JSON.parse(modifiedFields);
            Object.entries(modified).forEach(([key, mods]) => {
                if (this.allFields[key]) {
                    Object.assign(this.allFields[key], mods);
                }
            });
        }
        
        // Add custom fields
        if (customFields) {
            const custom = JSON.parse(customFields);
            Object.assign(this.allFields, custom);
        }
        
        this.visibleFields = savedFields ? JSON.parse(savedFields) : this.getDefaultVisibleFields();
        // Filter out any removed fields from visible fields
        this.visibleFields = this.visibleFields.filter(f => this.allFields[f]);
    }

    saveFieldConfig() {
        localStorage.setItem('slsmbrui_visible_fields', JSON.stringify(this.visibleFields));
    }

    loadData() {
        // Get data from storage - flatten the structure for table display
        const rawData = Storage.loadData(window.defaultRawData);
        
        // Load custom field data
        const customFieldData = JSON.parse(localStorage.getItem('slsmbrui_custom_field_data') || '{}');
        
        // Merge publishers with their spend and risk data
        this.currentData = (rawData.publishers || []).map(pub => {
            const spend = (rawData.spendData || []).find(s => s.publisher === pub.name) || {};
            const risk = (rawData.riskData || []).find(r => r.publisher === pub.name) || {};
            const customValues = customFieldData[pub.id] || {};
            
            return {
                id: pub.id,
                name: pub.name,
                title: pub.title,
                type: pub.type,
                contact: pub.contact,
                renewalDate: pub.renewalDate,
                status: pub.status,
                category: pub.category,
                licenseCount: pub.licenseCount,
                savingsAmount: pub.savingsAmount || 0,
                savingsType: pub.savingsType || null,
                companySpend: spend.companySpend || 0,
                msdSpend: spend.msdSpend || 0,
                tiamSpend: spend.tiamSpend || 0,
                fiscalYear: spend.fiscalYear || 'FY26',
                riskSSPA: risk.sspa || '',
                riskPO: risk.po || '',
                riskFinance: risk.finance || '',
                riskLegal: risk.legal || '',
                riskInventory: risk.inventory || '',
                notes: spend.notes || '',
                createdAt: pub.createdAt || new Date().toISOString(),
                updatedAt: pub.updatedAt || new Date().toISOString(),
                ...customValues
            };
        });
        
        this.pendingChanges = {};
        this.selectedRows = new Set();
        document.querySelector('.data-view-count').textContent = `${this.currentData.length} records`;
    }

    renderTable() {
        this.renderTableHead();
        this.renderTableBody();
        this.updateSelectionCount();
    }

    renderTableHead() {
        const thead = document.getElementById('data-table-head');
        let html = '<tr><th class="th-checkbox"><input type="checkbox" id="dv-select-all"></th>';
        html += '<th class="th-actions"></th>'; // Actions column at the start
        
        this.visibleFields.forEach(fieldKey => {
            const field = this.allFields[fieldKey];
            if (!field) return;
            
            const sortIcon = this.sortField === fieldKey 
                ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') 
                : '';
            
            html += `
                <th class="sortable" data-field="${fieldKey}" style="min-width: ${field.width}">
                    ${field.label}${sortIcon}
                </th>
            `;
        });
        
        html += '</tr>';
        thead.innerHTML = html;

        // Bind sort events
        thead.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => this.sortBy(th.dataset.field));
        });

        // Select all checkbox
        document.getElementById('dv-select-all').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });
    }

    renderTableBody() {
        const tbody = document.getElementById('data-table-body');
        const searchTerm = document.getElementById('dv-search').value.toLowerCase();
        const statusFilter = document.getElementById('dv-filter-status').value;
        const typeFilter = document.getElementById('dv-filter-type').value;

        let filteredData = this.currentData.filter(item => {
            // Search filter
            if (searchTerm) {
                const searchable = JSON.stringify(item).toLowerCase();
                if (!searchable.includes(searchTerm)) return false;
            }
            // Status filter
            if (statusFilter && item.status !== statusFilter) return false;
            // Type filter
            if (typeFilter && item.type !== typeFilter) return false;
            return true;
        });

        // Sort
        if (this.sortField) {
            filteredData.sort((a, b) => {
                const aVal = a[this.sortField] || '';
                const bVal = b[this.sortField] || '';
                const compare = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
                return this.sortDirection === 'asc' ? compare : -compare;
            });
        }

        let html = '';
        filteredData.forEach(item => {
            const isSelected = this.selectedRows.has(item.id);
            html += `<tr data-id="${item.id}" class="${isSelected ? 'selected' : ''}">`;
            html += `<td class="td-checkbox"><input type="checkbox" class="row-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}></td>`;
            
            // Actions column at the start
            html += `
                <td class="td-actions">
                    <button class="btn-icon" title="Edit" onclick="dataViewModal.openEditRowModal('${item.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </td>
            `;
            
            this.visibleFields.forEach(fieldKey => {
                const field = this.allFields[fieldKey];
                if (!field) return;
                
                const value = item[fieldKey];
                const displayValue = this.formatValue(value, field.type);
                const pendingValue = this.pendingChanges[item.id]?.[fieldKey];
                const hasChange = pendingValue !== undefined;
                
                html += `
                    <td class="editable-cell ${hasChange ? 'has-change' : ''}" 
                        data-id="${item.id}" 
                        data-field="${fieldKey}"
                        data-type="${field.type}"
                        data-editable="${field.editable}">
                        <span class="cell-value">${hasChange ? this.formatValue(pendingValue, field.type) : displayValue}</span>
                    </td>
                `;
            });
            
            html += '</tr>';
        });

        tbody.innerHTML = html || '<tr><td colspan="100" class="no-data">No records found</td></tr>';

        // Bind checkbox events
        tbody.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                this.toggleRowSelection(e.target.dataset.id, e.target.checked);
            });
        });

        // Bind inline edit events
        tbody.querySelectorAll('.editable-cell[data-editable="true"]').forEach(cell => {
            cell.addEventListener('dblclick', () => this.startInlineEdit(cell));
        });
    }

    formatValue(value, type) {
        if (value === null || value === undefined || value === '') return '-';
        
        switch (type) {
            case 'currency':
                const num = Number(value) || 0;
                return '$' + num.toLocaleString('en-US', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0
                });
            case 'date':
                return value ? new Date(value).toLocaleDateString() : '-';
            case 'datetime':
                return value ? new Date(value).toLocaleString() : '-';
            case 'boolean':
                return value ? 'Yes' : 'No';
            case 'number':
                return Number(value).toLocaleString();
            case 'url':
                if (typeof value === 'object' && value !== null) {
                    const displayText = value.text || value.url || '-';
                    const linkUrl = value.url || '#';
                    return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="url-link" onclick="event.stopPropagation()">${displayText}</a>`;
                } else if (typeof value === 'string' && value) {
                    // Legacy: plain URL string
                    const displayUrl = value.replace(/^https?:\/\//, '').substring(0, 30) + (value.length > 40 ? '...' : '');
                    return `<a href="${value}" target="_blank" rel="noopener noreferrer" class="url-link" onclick="event.stopPropagation()">${displayUrl}</a>`;
                }
                return '-';
            default:
                return String(value);
        }
    }

    parseValue(value, type) {
        switch (type) {
            case 'currency':
            case 'number':
                if (value === '' || value === null || value === undefined) return null;
                return parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
            case 'boolean':
                if (value === '' || value === null || value === undefined) return null;
                return value === 'true' || value === 'Yes' || value === true;
            case 'date':
                return value || null;
            case 'url':
                // URL values are objects with text and url properties
                if (typeof value === 'object' && value !== null) {
                    return { text: value.text || '', url: value.url || '' };
                }
                return { text: '', url: String(value || '') };
            default:
                return value || null;
        }
    }

    startInlineEdit(cell) {
        if (this.editingCell) {
            this.finishInlineEdit(this.editingCell, false);
        }

        const field = this.allFields[cell.dataset.field];
        const itemId = parseInt(cell.dataset.id);
        const currentValue = this.pendingChanges[itemId]?.[cell.dataset.field] 
            ?? this.currentData.find(d => d.id === itemId)?.[cell.dataset.field];

        this.editingCell = cell;
        cell.classList.add('editing');

        let inputHTML = '';
        switch (field.type) {
            case 'select':
                inputHTML = `<select class="inline-input">
                    <option value=""${!currentValue ? ' selected' : ''}>(none)</option>
                    ${field.options.map(opt => 
                        `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>`;
                break;
            case 'boolean':
                inputHTML = `<select class="inline-input">
                    <option value=""${currentValue === null || currentValue === undefined || currentValue === '' ? ' selected' : ''}>(none)</option>
                    <option value="true" ${currentValue === true ? 'selected' : ''}>Yes</option>
                    <option value="false" ${currentValue === false ? 'selected' : ''}>No</option>
                </select>`;
                break;
            case 'textarea':
                inputHTML = `<textarea class="inline-input">${currentValue || ''}</textarea>`;
                break;
            case 'url':
                const urlText = (typeof currentValue === 'object' && currentValue) ? (currentValue.text || '') : '';
                const urlHref = (typeof currentValue === 'object' && currentValue) ? (currentValue.url || '') : (currentValue || '');
                inputHTML = `<div class="url-inline-edit">
                    <input type="text" class="inline-input url-text" value="${urlText}" placeholder="Display text">
                    <input type="url" class="inline-input url-href" value="${urlHref}" placeholder="https://...">
                </div>`;
                break;
            case 'date':
                inputHTML = `<input type="date" class="inline-input" value="${currentValue || ''}">`;
                break;
            case 'number':
            case 'currency':
                const numValue = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue) || 0;
                inputHTML = `<input type="number" step="0.01" class="inline-input" value="${numValue}">`;
                break;
            default:
                inputHTML = `<input type="text" class="inline-input" value="${currentValue || ''}">`;
        }

        cell.innerHTML = inputHTML;
        
        // Handle URL field with two inputs
        if (field.type === 'url') {
            const textInput = cell.querySelector('.url-text');
            const hrefInput = cell.querySelector('.url-href');
            textInput.focus();
            
            const handleUrlBlur = (e) => {
                // Only finish if clicking outside both inputs
                setTimeout(() => {
                    if (!cell.contains(document.activeElement)) {
                        this.finishInlineEdit(cell, true);
                    }
                }, 100);
            };
            
            textInput.addEventListener('blur', handleUrlBlur);
            hrefInput.addEventListener('blur', handleUrlBlur);
            
            const handleUrlKeydown = (e) => {
                if (e.key === 'Enter') {
                    this.finishInlineEdit(cell, true);
                } else if (e.key === 'Escape') {
                    this.finishInlineEdit(cell, false);
                }
            };
            textInput.addEventListener('keydown', handleUrlKeydown);
            hrefInput.addEventListener('keydown', handleUrlKeydown);
        } else {
            const input = cell.querySelector('.inline-input');
            input.focus();
            if (input.select) input.select();

            input.addEventListener('blur', () => this.finishInlineEdit(cell, true));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && field.type !== 'textarea') {
                    this.finishInlineEdit(cell, true);
                } else if (e.key === 'Escape') {
                    this.finishInlineEdit(cell, false);
                }
            });
        }
    }

    finishInlineEdit(cell, save) {
        const field = this.allFields[cell.dataset.field];
        const itemId = parseInt(cell.dataset.id);
        const fieldKey = cell.dataset.field;
        
        let newValue;
        
        // Handle URL field with two inputs
        if (field.type === 'url') {
            const textInput = cell.querySelector('.url-text');
            const hrefInput = cell.querySelector('.url-href');
            if (!textInput || !hrefInput) return;
            newValue = { text: textInput.value, url: hrefInput.value };
        } else {
            const input = cell.querySelector('.inline-input');
            if (!input) return;
            newValue = this.parseValue(input.value, field.type);
        }

        if (save) {
            const originalValue = this.currentData.find(d => d.id === itemId)?.[fieldKey];
            const hasChanged = field.type === 'url' 
                ? (newValue.text !== (originalValue?.text || '') || newValue.url !== (originalValue?.url || ''))
                : newValue !== originalValue;

            if (hasChanged) {
                if (!this.pendingChanges[itemId]) {
                    this.pendingChanges[itemId] = {};
                }
                this.pendingChanges[itemId][fieldKey] = newValue;
                cell.classList.add('has-change');
            }

            cell.innerHTML = `<span class="cell-value">${this.formatValue(newValue, field.type)}</span>`;
        } else {
            const currentValue = this.pendingChanges[itemId]?.[fieldKey] 
                ?? this.currentData.find(d => d.id === itemId)?.[fieldKey];
            cell.innerHTML = `<span class="cell-value">${this.formatValue(currentValue, field.type)}</span>`;
        }

        cell.classList.remove('editing');
        this.editingCell = null;
    }

    sortBy(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.renderTable();
    }

    filterData() {
        this.renderTableBody();
    }

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            this.toggleRowSelection(cb.dataset.id, checked, false);
        });
        this.updateSelectionCount();
    }

    toggleRowSelection(id, selected, updateCount = true) {
        const numId = parseInt(id);
        if (selected) {
            this.selectedRows.add(numId);
        } else {
            this.selectedRows.delete(numId);
        }
        
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }
        
        if (updateCount) {
            this.updateSelectionCount();
        }
    }

    updateSelectionCount() {
        const count = this.selectedRows.size;
        document.getElementById('dv-selection-count').textContent = `${count} selected`;
        document.getElementById('dv-delete-selected').disabled = count === 0;
    }

    // Field Manager
    toggleFieldManager() {
        this.fieldManagerPanel.classList.toggle('active');
        if (this.fieldManagerPanel.classList.contains('active')) {
            this.renderFieldList();
        }
    }

    closeFieldManager() {
        this.fieldManagerPanel.classList.remove('active');
    }

    renderFieldList() {
        const list = document.getElementById('field-list');
        let html = '';
        
        // Get ordered fields - visible first (in order), then hidden
        const orderedKeys = [...this.visibleFields];
        Object.keys(this.allFields).forEach(key => {
            if (!orderedKeys.includes(key)) {
                orderedKeys.push(key);
            }
        });
        
        orderedKeys.forEach((key) => {
            const field = this.allFields[key];
            if (!field) return;
            
            const isVisible = this.visibleFields.includes(key);
            const isCore = field.core === true;
            const canRemove = field.custom === true || field.optional === true;
            
            html += `
                <div class="field-item" data-field="${key}" draggable="false">
                    <div class="field-drag-handle" title="Drag to reorder">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="5" r="1"/>
                            <circle cx="9" cy="12" r="1"/>
                            <circle cx="9" cy="19" r="1"/>
                            <circle cx="15" cy="5" r="1"/>
                            <circle cx="15" cy="12" r="1"/>
                            <circle cx="15" cy="19" r="1"/>
                        </svg>
                    </div>
                    <label class="field-checkbox-label">
                        <input type="checkbox" class="field-checkbox" data-field="${key}" ${isVisible ? 'checked' : ''}>
                        <span class="field-name">${field.label}</span>
                        <span class="field-type-badge ${isCore ? 'core' : ''}">${field.type}${isCore ? ' (core)' : ''}</span>
                    </label>
                    <div class="field-actions">
                        <button class="btn-icon btn-edit-field" data-field="${key}" title="Edit field">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        ${canRemove ? `<button class="btn-icon danger btn-remove-field" data-field="${key}" title="Remove field">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;

        // Bind events
        list.querySelectorAll('.field-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.updateVisibleFields());
        });
        
        list.querySelectorAll('.btn-edit-field').forEach(btn => {
            btn.addEventListener('click', () => this.openEditFieldModal(btn.dataset.field));
        });
        
        list.querySelectorAll('.btn-remove-field').forEach(btn => {
            btn.addEventListener('click', () => this.removeField(btn.dataset.field));
        });

        // Drag and drop for reordering
        this.initFieldDragDrop(list);
    }

    initFieldDragDrop(list) {
        let draggedItem = null;

        list.querySelectorAll('.field-item').forEach(item => {
            const handle = item.querySelector('.field-drag-handle');
            
            // Only allow dragging from the handle
            handle.addEventListener('mousedown', () => {
                item.setAttribute('draggable', 'true');
            });
            
            item.addEventListener('mouseup', () => {
                item.setAttribute('draggable', 'false');
            });
            
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.field);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                item.setAttribute('draggable', 'false');
                draggedItem = null;
                list.querySelectorAll('.field-item').forEach(i => i.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (item !== draggedItem && draggedItem) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                if (draggedItem && item !== draggedItem) {
                    // Get all field items and find indices
                    const items = [...list.querySelectorAll('.field-item')];
                    const fromIndex = items.indexOf(draggedItem);
                    const toIndex = items.indexOf(item);
                    
                    // Reorder in DOM
                    if (fromIndex < toIndex) {
                        item.parentNode.insertBefore(draggedItem, item.nextSibling);
                    } else {
                        item.parentNode.insertBefore(draggedItem, item);
                    }
                    
                    // Update visible fields order
                    this.updateFieldOrder();
                }
            });
        });
    }

    updateFieldOrder() {
        const newOrder = [];
        document.querySelectorAll('.field-item').forEach(item => {
            const fieldKey = item.dataset.field;
            const checkbox = item.querySelector('.field-checkbox');
            if (checkbox && checkbox.checked) {
                newOrder.push(fieldKey);
            }
        });
        
        this.visibleFields = newOrder;
        this.saveFieldConfig();
        this.renderTable();
        this.showToast('Field order updated', 'success');
    }

    updateVisibleFields() {
        // Preserve order - get fields in the current DOM order
        const newVisible = [];
        document.querySelectorAll('.field-item').forEach(item => {
            const fieldKey = item.dataset.field;
            const checkbox = item.querySelector('.field-checkbox');
            if (checkbox && checkbox.checked) {
                newVisible.push(fieldKey);
            }
        });
        
        this.visibleFields = newVisible;
        this.saveFieldConfig();
        this.renderTable();
    }

    selectAllFields() {
        document.querySelectorAll('.field-checkbox').forEach(cb => cb.checked = true);
        this.updateVisibleFields();
    }

    deselectAllFields() {
        document.querySelectorAll('.field-checkbox').forEach(cb => cb.checked = false);
        this.updateVisibleFields();
    }

    openRestoreFieldsDialog() {
        const removedFields = JSON.parse(localStorage.getItem('slsmbrui_removed_fields') || '[]');
        const optionalFields = this.getOptionalBuiltInFields();
        
        // Get list of removable fields that are currently removed
        const restorable = removedFields.filter(key => optionalFields[key]);
        
        if (restorable.length === 0) {
            alert('No removed fields to restore. All optional fields are currently available.');
            return;
        }
        
        // Create a simple multi-select dialog
        let fieldList = restorable.map(key => `• ${optionalFields[key].label} (${key})`).join('\n');
        let message = `The following fields have been removed:\n\n${fieldList}\n\nWould you like to restore all of them?`;
        
        if (confirm(message)) {
            // Clear the removed fields list
            localStorage.setItem('slsmbrui_removed_fields', '[]');
            
            // Reload field config to bring back optional fields
            this.loadFieldConfig();
            this.renderTable();
            this.renderFieldList();
            
            alert(`Restored ${restorable.length} field(s). They are now hidden but available in the field manager.`);
        }
    }

    // Add Field
    openAddFieldModal() {
        this.addFieldModal.classList.add('open');
        document.getElementById('new-field-name').value = '';
        document.getElementById('new-field-label').value = '';
        document.getElementById('new-field-type').value = 'text';
        document.getElementById('new-field-options').value = '';
        document.getElementById('select-options-group').style.display = 'none';
    }

    closeAddFieldModal() {
        this.addFieldModal.classList.remove('open');
    }

    // Edit Field
    openEditFieldModal(fieldKey) {
        const field = this.allFields[fieldKey];
        if (!field) return;

        document.getElementById('edit-field-key').value = fieldKey;
        document.getElementById('edit-field-label').value = field.label || '';
        document.getElementById('edit-field-type').value = field.type || 'text';
        document.getElementById('edit-field-width').value = field.width || '';
        
        // Handle select options
        if (field.type === 'select' && field.options) {
            document.getElementById('edit-field-options').value = field.options.join('\n');
            document.getElementById('edit-select-options-group').style.display = 'block';
        } else {
            document.getElementById('edit-field-options').value = '';
            document.getElementById('edit-select-options-group').style.display = 'none';
        }

        this.editFieldModal.classList.add('open');
    }

    closeEditFieldModal() {
        this.editFieldModal.classList.remove('open');
    }

    saveFieldEdit() {
        const fieldKey = document.getElementById('edit-field-key').value;
        const newLabel = document.getElementById('edit-field-label').value.trim();
        const newType = document.getElementById('edit-field-type').value;
        const newWidth = document.getElementById('edit-field-width').value.trim();
        const optionsText = document.getElementById('edit-field-options').value;

        if (!newLabel) {
            alert('Please enter a display label');
            return;
        }

        const field = this.allFields[fieldKey];
        const oldType = field.type;
        
        // Update field properties
        field.label = newLabel;
        field.type = newType;
        if (newWidth) {
            field.width = newWidth;
        }
        
        // Handle select options
        if (newType === 'select') {
            field.options = optionsText.split('\n').filter(o => o.trim());
        } else {
            delete field.options;
        }

        // Save modified field to localStorage
        const modifiedFields = JSON.parse(localStorage.getItem('slsmbrui_modified_fields') || '{}');
        modifiedFields[fieldKey] = {
            label: field.label,
            type: field.type,
            width: field.width,
            options: field.options
        };
        localStorage.setItem('slsmbrui_modified_fields', JSON.stringify(modifiedFields));

        // If custom field, also update custom fields storage
        if (field.custom) {
            const customFields = JSON.parse(localStorage.getItem('slsmbrui_custom_fields') || '{}');
            customFields[fieldKey] = field;
            localStorage.setItem('slsmbrui_custom_fields', JSON.stringify(customFields));
        }

        this.renderTable();
        this.closeEditFieldModal();
        
        // Update field manager if open
        if (this.fieldManagerPanel.classList.contains('active')) {
            this.renderFieldList();
        }

        this.showToast(`Field "${newLabel}" updated successfully`, 'success');
    }

    addCustomField() {
        const name = document.getElementById('new-field-name').value.trim();
        const label = document.getElementById('new-field-label').value.trim();
        const type = document.getElementById('new-field-type').value;
        const optionsText = document.getElementById('new-field-options').value;

        if (!name || !label) {
            alert('Please fill in field name and label');
            return;
        }

        if (this.allFields[name]) {
            alert('A field with this name already exists');
            return;
        }

        const newField = {
            label: label,
            type: type,
            editable: true,
            width: '120px',
            custom: true
        };

        if (type === 'select') {
            newField.options = optionsText.split('\n').filter(o => o.trim());
        }

        // Add to allFields
        this.allFields[name] = newField;
        this.visibleFields.push(name);

        // Save custom fields
        const customFields = JSON.parse(localStorage.getItem('slsmbrui_custom_fields') || '{}');
        customFields[name] = newField;
        localStorage.setItem('slsmbrui_custom_fields', JSON.stringify(customFields));
        
        this.saveFieldConfig();
        this.renderTable();
        this.closeAddFieldModal();

        // Update field manager if open
        if (this.fieldManagerPanel.classList.contains('active')) {
            this.renderFieldList();
        }
        
        this.showToast(`Field "${label}" added successfully`, 'success');
    }

    removeField(fieldKey) {
        const field = this.allFields[fieldKey];
        if (!field) return;
        
        const isCustom = field.custom === true;
        const isOptional = field.optional === true;
        
        if (!isCustom && !isOptional) {
            alert('Core fields cannot be removed.');
            return;
        }
        
        if (!confirm(`Remove field "${field.label}"? This will hide it from the view but won't delete existing data.`)) {
            return;
        }

        // Remove from allFields and visibleFields
        delete this.allFields[fieldKey];
        this.visibleFields = this.visibleFields.filter(f => f !== fieldKey);

        if (isCustom) {
            // Remove from custom fields storage
            const customFields = JSON.parse(localStorage.getItem('slsmbrui_custom_fields') || '{}');
            delete customFields[fieldKey];
            localStorage.setItem('slsmbrui_custom_fields', JSON.stringify(customFields));
        } else if (isOptional) {
            // Add to removed fields list (so it won't come back on reload)
            const removedFields = JSON.parse(localStorage.getItem('slsmbrui_removed_fields') || '[]');
            if (!removedFields.includes(fieldKey)) {
                removedFields.push(fieldKey);
                localStorage.setItem('slsmbrui_removed_fields', JSON.stringify(removedFields));
            }
        }

        this.saveFieldConfig();
        this.renderTable();
        this.renderFieldList();
    }
    
    // Alias for backwards compatibility
    removeCustomField(fieldKey) {
        this.removeField(fieldKey);
    }

    // Add/Edit Row
    openAddRowModal() {
        this.editingRowId = null;
        document.getElementById('edit-row-title').textContent = 'Add New Record';
        this.renderRowForm({});
        this.editRowModal.classList.add('open');
    }

    openEditRowModal(id) {
        this.editingRowId = parseInt(id);
        const item = this.currentData.find(d => d.id === this.editingRowId);
        document.getElementById('edit-row-title').textContent = `Edit: ${item.name}`;
        this.renderRowForm(item);
        this.editRowModal.classList.add('open');
    }

    closeEditRowModal() {
        this.editRowModal.classList.remove('open');
        this.editingRowId = null;
    }

    renderRowForm(item) {
        const form = document.getElementById('edit-row-form');
        let html = '<div class="edit-row-grid">';
        
        // Metadata fields to exclude from edit form
        const metadataFields = ['createdAt', 'updatedAt', 'id'];

        // Use visible fields order, then add any hidden fields that are editable
        const orderedKeys = [...this.visibleFields];
        Object.keys(this.allFields).forEach(key => {
            if (!orderedKeys.includes(key)) {
                orderedKeys.push(key);
            }
        });

        orderedKeys.forEach((key) => {
            const field = this.allFields[key];
            if (!field) return;
            
            // Skip metadata fields entirely
            if (metadataFields.includes(key)) return;
            
            const value = item[key] || '';
            let inputHTML = '';
            
            switch (field.type) {
                case 'select':
                    inputHTML = `<select id="edit-${key}" class="edit-input" ${!field.editable ? 'disabled' : ''}>
                        <option value=""${!value ? ' selected' : ''}>(none)</option>
                        ${field.options.map(opt => 
                            `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                    </select>`;
                    break;
                case 'boolean':
                    inputHTML = `<select id="edit-${key}" class="edit-input" ${!field.editable ? 'disabled' : ''}>
                        <option value=""${value === null || value === undefined || value === '' ? ' selected' : ''}>(none)</option>
                        <option value="false" ${value === false ? 'selected' : ''}>No</option>
                        <option value="true" ${value === true ? 'selected' : ''}>Yes</option>
                    </select>`;
                    break;
                case 'textarea':
                    inputHTML = `<textarea id="edit-${key}" class="edit-input" rows="3" ${!field.editable ? 'disabled' : ''}>${value}</textarea>`;
                    break;
                case 'url':
                    const urlTextVal = (typeof value === 'object' && value) ? (value.text || '') : '';
                    const urlHrefVal = (typeof value === 'object' && value) ? (value.url || '') : (value || '');
                    inputHTML = `<div class="url-edit-group">
                        <input type="text" id="edit-${key}-text" class="edit-input url-text-input" value="${urlTextVal}" placeholder="Display text" ${!field.editable ? 'disabled' : ''}>
                        <input type="url" id="edit-${key}-url" class="edit-input url-href-input" value="${urlHrefVal}" placeholder="https://..." ${!field.editable ? 'disabled' : ''}>
                    </div>`;
                    break;
                case 'date':
                    inputHTML = `<input type="date" id="edit-${key}" class="edit-input" value="${value}" ${!field.editable ? 'disabled' : ''}>`;
                    break;
                case 'datetime':
                    inputHTML = `<input type="datetime-local" id="edit-${key}" class="edit-input" value="${value ? value.slice(0,16) : ''}" ${!field.editable ? 'disabled' : ''}>`;
                    break;
                case 'number':
                case 'currency':
                    inputHTML = `<input type="number" step="0.01" id="edit-${key}" class="edit-input" value="${value}" ${!field.editable ? 'disabled' : ''}>`;
                    break;
                default:
                    inputHTML = `<input type="text" id="edit-${key}" class="edit-input" value="${value}" ${!field.editable ? 'disabled' : ''}>`;
            }

            html += `
                <div class="form-group">
                    <label for="edit-${key}">${field.label}</label>
                    ${inputHTML}
                </div>
            `;
        });

        html += '</div>';
        form.innerHTML = html;
    }

    saveRowEdit() {
        const formData = {};

        Object.entries(this.allFields).forEach(([key, field]) => {
            // Handle URL fields with two inputs
            if (field.type === 'url') {
                const textInput = document.getElementById(`edit-${key}-text`);
                const urlInput = document.getElementById(`edit-${key}-url`);
                if (textInput && urlInput && field.editable) {
                    formData[key] = { text: textInput.value, url: urlInput.value };
                }
            } else {
                const input = document.getElementById(`edit-${key}`);
                if (input && field.editable) {
                    formData[key] = this.parseValue(input.value, field.type);
                }
            }
        });

        if (!formData.name) {
            alert('Publisher Name is required');
            return;
        }

        if (this.editingRowId) {
            // Update existing record
            const index = this.currentData.findIndex(d => d.id === this.editingRowId);
            if (index !== -1) {
                const oldData = { ...this.currentData[index] };
                this.currentData[index] = { ...this.currentData[index], ...formData, updatedAt: new Date().toISOString() };
                
                // Record changes for history
                const changes = [];
                Object.entries(formData).forEach(([key, newValue]) => {
                    const oldValue = oldData[key];
                    if (oldValue !== newValue) {
                        const field = this.allFields[key];
                        changes.push({
                            field: field ? field.label : key,
                            oldValue: this.formatValue(oldValue, field?.type || 'text'),
                            newValue: this.formatValue(newValue, field?.type || 'text')
                        });
                    }
                });
                if (changes.length > 0) {
                    this.recordChange('update', formData.name, { changes });
                }
            }
        } else {
            // Create new record
            const newId = Math.max(...this.currentData.map(d => d.id), 0) + 1;
            this.currentData.push({
                id: newId,
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            this.recordChange('create', formData.name);
        }

        this.saveToStorage();
        this.renderTable();
        this.closeEditRowModal();
        document.querySelector('.data-view-count').textContent = `${this.currentData.length} records`;
        this.showToast(this.editingRowId ? 'Record updated' : 'Record added', 'success');
    }

    // Delete
    deleteRow(id) {
        const item = this.currentData.find(d => d.id === parseInt(id));
        if (!confirm(`Delete "${item.name}"?`)) return;
        
        this.recordChange('delete', item.name);
        this.currentData = this.currentData.filter(d => d.id !== parseInt(id));
        this.saveToStorage();
        this.renderTable();
        document.querySelector('.data-view-count').textContent = `${this.currentData.length} records`;
        this.showToast('Record deleted', 'success');
    }

    deleteSelected() {
        const count = this.selectedRows.size;
        if (!confirm(`Delete ${count} selected records?`)) return;

        this.selectedRows.forEach(id => {
            const item = this.currentData.find(d => d.id === id);
            if (item) {
                this.recordChange('delete', item.name);
            }
            this.currentData = this.currentData.filter(d => d.id !== id);
        });

        this.selectedRows.clear();
        this.saveToStorage();
        this.renderTable();
        document.querySelector('.data-view-count').textContent = `${this.currentData.length} records`;
        this.showToast(`${count} records deleted`, 'success');
    }

    // Save all pending changes
    saveAllChanges() {
        const changeCount = Object.keys(this.pendingChanges).length;
        if (changeCount === 0) {
            alert('No changes to save');
            return;
        }

        Object.entries(this.pendingChanges).forEach(([id, fieldChanges]) => {
            const index = this.currentData.findIndex(d => d.id === parseInt(id));
            if (index !== -1) {
                const oldData = { ...this.currentData[index] };
                Object.assign(this.currentData[index], fieldChanges);
                this.currentData[index].updatedAt = new Date().toISOString();
                
                // Record changes for history
                const changes = [];
                Object.entries(fieldChanges).forEach(([key, newValue]) => {
                    const oldValue = oldData[key];
                    const field = this.allFields[key];
                    changes.push({
                        field: field ? field.label : key,
                        oldValue: this.formatValue(oldValue, field?.type || 'text'),
                        newValue: this.formatValue(newValue, field?.type || 'text')
                    });
                });
                if (changes.length > 0) {
                    this.recordChange('update', this.currentData[index].name, { changes });
                }
            }
        });

        this.pendingChanges = {};
        this.saveToStorage();
        this.renderTable();
        this.showToast(`Saved changes to ${changeCount} records`, 'success');
    }

    // Save to storage - convert flat structure back to raw data format
    saveToStorage() {
        const rawData = Storage.loadData(window.defaultRawData);
        
        // Update publishers - include all base fields plus timestamps
        rawData.publishers = this.currentData.map(d => ({
            id: d.id,
            name: d.name,
            title: d.title,
            type: d.type,
            contact: d.contact,
            renewalDate: d.renewalDate,
            status: d.status,
            category: d.category,
            licenseCount: d.licenseCount,
            savingsAmount: d.savingsAmount || 0,
            savingsType: d.savingsType || null,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        }));
        
        // Update spend data
        rawData.spendData = this.currentData.map(d => ({
            publisher: d.name,
            companySpend: d.companySpend || 0,
            msdSpend: d.msdSpend || 0,
            tiamSpend: d.tiamSpend || 0,
            fiscalYear: d.fiscalYear || 'FY26',
            notes: d.notes || ''
        }));
        
        // Update risk data - now stores text explanations instead of numbers
        rawData.riskData = this.currentData.map(d => ({
            publisher: d.name,
            sspa: d.riskSSPA || '',
            po: d.riskPO || '',
            finance: d.riskFinance || '',
            legal: d.riskLegal || '',
            inventory: d.riskInventory || ''
        }));
        
        // Store custom field values separately
        const customFieldData = {};
        const customFields = JSON.parse(localStorage.getItem('slsmbrui_custom_fields') || '{}');
        this.currentData.forEach(d => {
            const customValues = {};
            Object.keys(customFields).forEach(fieldKey => {
                if (d[fieldKey] !== undefined) {
                    customValues[fieldKey] = d[fieldKey];
                }
            });
            if (Object.keys(customValues).length > 0) {
                customFieldData[d.id] = customValues;
            }
        });
        localStorage.setItem('slsmbrui_custom_field_data', JSON.stringify(customFieldData));
        
        Storage.saveData(rawData);
        
        // Trigger refresh
        if (typeof refreshDashboardData === 'function') {
            refreshDashboardData();
        }
        window.dispatchEvent(new CustomEvent('dataChanged'));
    }

    // Export
    exportData() {
        const data = this.currentData.map(item => {
            const row = {};
            this.visibleFields.forEach(fieldKey => {
                const field = this.allFields[fieldKey];
                row[field.label] = item[fieldKey];
            });
            return row;
        });

        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sls_data_export.csv';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported to CSV', 'success');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            });
            rows.push(values.join(','));
        });
        
        return rows.join('\n');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Change History Methods
    getChangeHistory() {
        try {
            const history = localStorage.getItem('slsmbrui_change_history');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    saveChangeHistory(history) {
        // Keep only the last 100 entries
        const trimmed = history.slice(-100);
        localStorage.setItem('slsmbrui_change_history', JSON.stringify(trimmed));
    }

    recordChange(action, recordName, details = {}) {
        const history = this.getChangeHistory();
        const entry = {
            id: Date.now(),
            action: action, // 'create', 'update', 'delete'
            recordName: recordName,
            timestamp: new Date().toISOString(),
            details: details
        };
        history.push(entry);
        this.saveChangeHistory(history);
    }

    toggleHistoryPanel() {
        // Close field manager if open
        this.closeFieldManager();
        
        this.historyPanel.classList.toggle('active');
        if (this.historyPanel.classList.contains('active')) {
            this.renderHistoryList();
        }
    }

    closeHistoryPanel() {
        this.historyPanel.classList.remove('active');
    }

    renderHistoryList() {
        const list = document.getElementById('history-list');
        const filter = document.getElementById('history-filter').value;
        let history = this.getChangeHistory();
        
        // Filter by action type
        if (filter !== 'all') {
            history = history.filter(h => h.action === filter);
        }
        
        // Sort by newest first
        history = history.slice().reverse();
        
        if (history.length === 0) {
            list.innerHTML = '<div class="history-empty">No changes recorded yet</div>';
            return;
        }
        
        let html = '';
        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            const timeAgo = this.getTimeAgo(date);
            const actionIcon = this.getActionIcon(entry.action);
            const actionClass = `action-${entry.action}`;
            
            let detailsHtml = '';
            if (entry.details && entry.details.changes) {
                detailsHtml = '<div class="history-changes">';
                entry.details.changes.forEach(change => {
                    detailsHtml += `
                        <div class="history-change-item">
                            <span class="change-field">${change.field}:</span>
                            <span class="change-old">${change.oldValue || '-'}</span>
                            <span class="change-arrow">→</span>
                            <span class="change-new">${change.newValue || '-'}</span>
                        </div>
                    `;
                });
                detailsHtml += '</div>';
            }
            
            html += `
                <div class="history-item ${actionClass}">
                    <div class="history-item-header">
                        <span class="history-icon">${actionIcon}</span>
                        <span class="history-action">${this.capitalizeFirst(entry.action)}</span>
                        <span class="history-record">${entry.recordName}</span>
                    </div>
                    <div class="history-item-time" title="${date.toLocaleString()}">${timeAgo}</div>
                    ${detailsHtml}
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    getActionIcon(action) {
        switch (action) {
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            default: return '📝';
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    clearHistory() {
        if (!confirm('Clear all change history? This cannot be undone.')) return;
        
        localStorage.removeItem('slsmbrui_change_history');
        this.renderHistoryList();
        this.showToast('History cleared', 'success');
    }
}

// Create global instance
window.dataViewModal = new DataViewModal();
