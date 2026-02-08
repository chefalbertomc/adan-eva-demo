// Firebase Diagnostic Tool
// Add this to browser console to check Firebase status

window.checkFirebaseStatus = function () {
    console.log('=== FIREBASE DIAGNOSTIC ===');
    console.log('1. Firebase App:', !!window.firebaseApp);
    console.log('2. Firestore DB:', !!window.dbFirestore);
    console.log('3. FB Module:', !!window.FB);
    console.log('4. Auth:', !!window.db?.auth);

    if (window.dbFirestore) {
        console.log('✅ Firestore is initialized');
        console.log('   Type:', window.dbFirestore.type);
    } else {
        console.error('❌ Firestore NOT initialized');
    }

    if (window.FB) {
        console.log('✅ FB module loaded');
        console.log('   Available functions:', Object.keys(window.FB));
    } else {
        console.error('❌ FB module NOT loaded');
    }

    // Try to read from Firestore
    if (window.dbFirestore && window.FB) {
        const { collection, getDocs } = window.FB;
        console.log('🔍 Testing Firestore read...');
        getDocs(collection(window.dbFirestore, 'visits'))
            .then(snapshot => {
                console.log('✅ Firestore READ successful!');
                console.log('   Documents found:', snapshot.size);
                snapshot.forEach(doc => {
                    console.log('   -', doc.id, doc.data());
                });
            })
            .catch(e => {
                console.error('❌ Firestore READ failed:', e);
            });
    }

    console.log('=========================');
};

console.log('💡 Run window.checkFirebaseStatus() to diagnose Firebase connection');
