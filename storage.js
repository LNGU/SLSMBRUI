// Storage Module - Hybrid persistence with localStorage + JSON file backup
const Storage = (function() {
    const STORAGE_KEY = 'slsmbrui_data';
    const SNAPSHOTS_KEY = 'slsmbrui_snapshots';
    const DIRTY_KEY = 'slsmbrui_dirty';
    const STORAGE_THRESHOLD = 0.9; // 90% capacity triggers cleanup
    const CLEANUP_TARGET = 0.8; // Clean down to 80%

    // Check if localStorage is available
    function isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Get current storage usage (returns ratio 0-1)
    function getStorageUsage() {
        if (!isStorageAvailable()) return 0;
        
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
            }
        }
        // Estimate 5MB limit (conservative)
        const limit = 5 * 1024 * 1024;
        return total / limit;
    }

    // Get storage info for display
    function getStorageInfo() {
        const usage = getStorageUsage();
        const snapshots = getSnapshots();
        return {
            usagePercent: Math.round(usage * 100),
            usageBytes: Math.round(usage * 5 * 1024 * 1024),
            snapshotCount: snapshots.length,
            oldestSnapshot: snapshots.length > 0 ? snapshots[0].timestamp : null,
            newestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null
        };
    }

    // Auto-cleanup old snapshots when storage is near capacity
    function cleanupIfNeeded() {
        const usage = getStorageUsage();
        if (usage < STORAGE_THRESHOLD) return { cleaned: false };

        const snapshots = getSnapshots();
        const removed = [];
        
        // Remove oldest snapshots until under target
        while (getStorageUsage() > CLEANUP_TARGET && snapshots.length > 1) {
            const oldest = snapshots.shift();
            removed.push(oldest.timestamp);
        }
        
        if (removed.length > 0) {
            localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
            console.log(`Storage cleanup: removed ${removed.length} old snapshots`);
        }
        
        return { cleaned: true, removedCount: removed.length, removed };
    }

    // Save raw data to localStorage
    function saveData(data) {
        if (!isStorageAvailable()) {
            console.warn('localStorage not available');
            return false;
        }
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setDirty(true);
            
            // Dispatch event for chart updates
            window.dispatchEvent(new CustomEvent('dataChanged', { detail: data }));
            return true;
        } catch (e) {
            console.error('Failed to save data:', e);
            return false;
        }
    }

    // Load raw data from localStorage (or return default)
    function loadData(defaultData) {
        if (!isStorageAvailable()) return defaultData;
        
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        return defaultData;
    }

    // Check if there's stored data
    function hasStoredData() {
        return isStorageAvailable() && localStorage.getItem(STORAGE_KEY) !== null;
    }

    // Clear stored data (reset to defaults)
    function clearData() {
        if (isStorageAvailable()) {
            localStorage.removeItem(STORAGE_KEY);
            setDirty(false);
        }
    }

    // Dirty flag management (unsaved changes since last JSON download)
    function isDirty() {
        if (!isStorageAvailable()) return false;
        return localStorage.getItem(DIRTY_KEY) === 'true';
    }

    function setDirty(value) {
        if (isStorageAvailable()) {
            localStorage.setItem(DIRTY_KEY, value ? 'true' : 'false');
            updateDirtyIndicator();
        }
    }

    function updateDirtyIndicator() {
        const indicator = document.getElementById('unsavedIndicator');
        if (indicator) {
            indicator.style.display = isDirty() ? 'inline-block' : 'none';
        }
    }

    // Snapshot management
    function getSnapshots() {
        if (!isStorageAvailable()) return [];
        
        try {
            const stored = localStorage.getItem(SNAPSHOTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    function createSnapshot(name = null) {
        if (!isStorageAvailable()) return null;
        
        // Cleanup if needed before creating new snapshot
        cleanupIfNeeded();
        
        const data = loadData(null);
        if (!data) return null;
        
        const snapshot = {
            id: generateId(),
            name: name || formatDate(new Date()),
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(data)) // Deep copy
        };
        
        const snapshots = getSnapshots();
        snapshots.push(snapshot);
        
        try {
            localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
            return snapshot;
        } catch (e) {
            console.error('Failed to create snapshot:', e);
            // If failed due to quota, try cleanup and retry
            cleanupIfNeeded();
            try {
                localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
                return snapshot;
            } catch (e2) {
                return null;
            }
        }
    }

    function restoreSnapshot(snapshotId) {
        const snapshots = getSnapshots();
        const snapshot = snapshots.find(s => s.id === snapshotId);
        
        if (snapshot) {
            saveData(snapshot.data);
            return true;
        }
        return false;
    }

    function deleteSnapshot(snapshotId) {
        let snapshots = getSnapshots();
        snapshots = snapshots.filter(s => s.id !== snapshotId);
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    }

    // JSON file export (triggers download)
    function exportToJson(filename = null) {
        const data = loadData(null);
        if (!data) return false;
        
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: data
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `slsmbrui-backup-${formatDateForFile(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Mark as clean after successful download
        setDirty(false);
        return true;
    }

    // JSON file import
    function importFromJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    
                    // Handle both old format (raw data) and new format (with version wrapper)
                    const data = imported.data || imported;
                    
                    // Validate basic structure
                    if (!data.annualSpend || !data.riskHeatmap || !data.publishers) {
                        reject(new Error('Invalid data format: missing required fields'));
                        return;
                    }
                    
                    saveData(data);
                    resolve(data);
                } catch (err) {
                    reject(new Error('Failed to parse JSON file'));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Setup beforeunload warning
    function setupBeforeUnloadWarning() {
        window.addEventListener('beforeunload', function(e) {
            if (isDirty()) {
                const message = 'You have unsaved changes. Stay to save your backup.';
                e.returnValue = message;
                return message;
            }
        });
    }

    // Utility functions
    function generateId() {
        return 'snap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    function formatDateForFile(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Initialize
    function init() {
        setupBeforeUnloadWarning();
        updateDirtyIndicator();
    }

    // Public API
    return {
        init,
        saveData,
        loadData,
        hasStoredData,
        clearData,
        isDirty,
        setDirty,
        getSnapshots,
        createSnapshot,
        restoreSnapshot,
        deleteSnapshot,
        exportToJson,
        importFromJson,
        getStorageInfo,
        cleanupIfNeeded,
        isStorageAvailable
    };
})();

// Initialize storage on load
document.addEventListener('DOMContentLoaded', function() {
    Storage.init();
});

// Export for global access
window.Storage = Storage;
