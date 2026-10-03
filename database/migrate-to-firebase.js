// ===================================================================
// CARECONNECT HOSPITAL - MIGRATION SCRIPT TO FIREBASE FIRESTORE
// Exports relational SQL data into Firebase Firestore collections
// ===================================================================

const fs = require('fs');
const path = require('path');
const sqliteDb = require('../backend/config/db');
const { getFirestore } = require('../backend/config/firebase');

async function migrateData() {
  console.log('🚀 Extracting records from local relational database...');

  const users = sqliteDb.prepare('SELECT * FROM users').all();
  const patients = sqliteDb.prepare('SELECT * FROM patients').all();
  const departments = sqliteDb.prepare('SELECT * FROM departments').all();
  const doctors = sqliteDb.prepare('SELECT * FROM doctors').all();
  const appointments = sqliteDb.prepare('SELECT * FROM appointments').all();

  console.log(`📊 Found:`);
  console.log(`   - ${users.length} Users`);
  console.log(`   - ${patients.length} Patients`);
  console.log(`   - ${departments.length} Departments`);
  console.log(`   - ${doctors.length} Doctors`);
  console.log(`   - ${appointments.length} Appointments`);

  const firestoreData = {
    users,
    patients,
    departments,
    doctors,
    appointments,
    exported_at: new Date().toISOString()
  };

  // 1. Save local Firebase seed JSON file
  const exportPath = path.join(__dirname, 'firebase-seed.json');
  fs.writeFileSync(exportPath, JSON.stringify(firestoreData, null, 2));
  console.log(`✅ Exported Firestore seed file to: ${exportPath}`);

  // 2. If Firebase credentials are present, upload directly to Firestore
  const firestore = getFirestore();
  if (!firestore) {
    console.log('\n⚠️  Firebase credentials not detected yet.');
    console.log('👉 To sync directly to your live Firestore cloud:');
    console.log('   1. Download serviceAccountKey.json from Firebase Console.');
    console.log('   2. Save it to: backend/config/serviceAccountKey.json');
    console.log('   3. Re-run: node database/migrate-to-firebase.js\n');
    return;
  }

  console.log('\n🔥 Uploading collections to live Firebase Firestore...');

  async function uploadCollection(colName, items) {
    const batch = firestore.batch();
    for (const item of items) {
      const docRef = firestore.collection(colName).doc(String(item.id));
      batch.set(docRef, item);
    }
    await batch.commit();
    console.log(`   ✅ Migrated ${items.length} documents into '${colName}' collection.`);
  }

  try {
    await uploadCollection('users', users);
    await uploadCollection('patients', patients);
    await uploadCollection('departments', departments);
    await uploadCollection('doctors', doctors);
    await uploadCollection('appointments', appointments);
    console.log('\n🎉 Firebase Firestore migration completed successfully!');
  } catch (error) {
    console.error('❌ Firestore migration error:', error);
  }
}

migrateData();
