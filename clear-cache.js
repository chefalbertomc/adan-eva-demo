// EMERGENCY CACHE CLEAR SCRIPT
// Run this in the browser console on mobile to clear all cached data

console.log('🧹 Starting emergency cache clear...');

// 1. Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// 2. Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// 3. Clear IndexedDB (where Firebase stores data)
if (window.indexedDB) {
    indexedDB.databases().then(databases => {
        databases.forEach(db => {
            indexedDB.deleteDatabase(db.name);
            console.log('✅ Deleted IndexedDB:', db.name);
        });
    });
}

// 4. Unregister service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            registration.unregister();
            console.log('✅ Unregistered service worker');
        });
    });
}

// 5. Clear cache storage
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => {
            caches.delete(name);
            console.log('✅ Deleted cache:', name);
        });
    });
}

console.log('🎉 Cache clear complete! Now reload the page.');
console.log('👉 Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to hard reload');
