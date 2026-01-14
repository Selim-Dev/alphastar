// MongoDB initialization script
// Creates the application database and user

db = db.getSiblingDB('alphastar-kpi');

// Create collections with validation
db.createCollection('aircraft');
db.createCollection('dailycounters');
db.createCollection('dailystatus');
db.createCollection('aogevents');
db.createCollection('maintenancetasks');
db.createCollection('workorders');
db.createCollection('discrepancies');
db.createCollection('budgetplans');
db.createCollection('actualspends');
db.createCollection('users');

// Create indexes for better query performance
db.aircraft.createIndex({ registration: 1 }, { unique: true });
db.aircraft.createIndex({ fleetGroup: 1, status: 1 });

db.dailycounters.createIndex({ aircraftId: 1, date: -1 }, { unique: true });
db.dailycounters.createIndex({ date: -1 });

db.dailystatus.createIndex({ aircraftId: 1, date: -1 }, { unique: true });
db.dailystatus.createIndex({ date: -1 });

db.aogevents.createIndex({ aircraftId: 1, detectedAt: -1 });
db.aogevents.createIndex({ responsibleParty: 1, detectedAt: -1 });
db.aogevents.createIndex({ detectedAt: -1 });

db.maintenancetasks.createIndex({ aircraftId: 1, date: -1 });
db.maintenancetasks.createIndex({ date: -1 });
db.maintenancetasks.createIndex({ date: -1, shift: 1 });
db.maintenancetasks.createIndex({ taskType: 1, date: -1 });

db.workorders.createIndex({ woNumber: 1 }, { unique: true });
db.workorders.createIndex({ aircraftId: 1, status: 1 });
db.workorders.createIndex({ dueDate: 1, status: 1 });

db.discrepancies.createIndex({ ataChapter: 1 });
db.discrepancies.createIndex({ aircraftId: 1, dateDetected: -1 });

db.budgetplans.createIndex({ fiscalYear: 1, clauseId: 1, aircraftGroup: 1 }, { unique: true });
db.budgetplans.createIndex({ fiscalYear: 1 });
db.budgetplans.createIndex({ clauseId: 1 });

db.actualspends.createIndex({ period: 1, clauseId: 1 });
db.actualspends.createIndex({ aircraftGroup: 1, period: 1 });
db.actualspends.createIndex({ aircraftId: 1, period: 1 });

db.users.createIndex({ email: 1 }, { unique: true });

print('MongoDB initialization completed successfully');
