/**
 * Migration Script: Fix Imported AOG Event Milestones
 * 
 * This script updates all imported AOG events to set milestone timestamps
 * that enable three-bucket analytics. It sets:
 * - reportedAt = detectedAt
 * - installationCompleteAt = clearedAt (if resolved)
 * - upAndRunningAt = clearedAt (if resolved)
 * 
 * The pre-save hook will then compute metrics automatically.
 * 
 * Usage: node fix-imported-aog-milestones.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpis';

// AOG Event Schema (minimal for migration)
const aogEventSchema = new mongoose.Schema({
  aircraftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Aircraft' },
  detectedAt: Date,
  clearedAt: Date,
  category: String,
  reasonCode: String,
  location: String,
  responsibleParty: String,
  actionTaken: String,
  manpowerCount: Number,
  manHours: Number,
  isImported: Boolean,
  isLegacy: Boolean,
  reportedAt: Date,
  procurementRequestedAt: Date,
  availableAtStoreAt: Date,
  issuedBackAt: Date,
  installationCompleteAt: Date,
  testStartAt: Date,
  upAndRunningAt: Date,
  technicalTimeHours: { type: Number, default: 0 },
  procurementTimeHours: { type: Number, default: 0 },
  opsTimeHours: { type: Number, default: 0 },
  totalDowntimeHours: { type: Number, default: 0 },
  internalCost: { type: Number, default: 0 },
  externalCost: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Function to compute metrics (same logic as pre-save hook)
function computeMetrics(doc) {
  // Compute metrics if milestone timestamps are present
  if (doc.reportedAt && doc.upAndRunningAt) {
    // Technical Time = (reportedAt → procurementRequestedAt) + (availableAtStoreAt → installationCompleteAt)
    let technicalTime = 0;
    
    // Phase 1: Troubleshooting (reportedAt → procurementRequestedAt OR installationCompleteAt if no procurement)
    if (doc.procurementRequestedAt) {
      const phase1Ms = new Date(doc.procurementRequestedAt).getTime() - new Date(doc.reportedAt).getTime();
      technicalTime += Math.max(0, phase1Ms / (1000 * 60 * 60));
    } else if (doc.installationCompleteAt) {
      // No procurement - all time from reported to installation is technical
      const phase1Ms = new Date(doc.installationCompleteAt).getTime() - new Date(doc.reportedAt).getTime();
      technicalTime += Math.max(0, phase1Ms / (1000 * 60 * 60));
    }
    
    // Phase 2: Installation (availableAtStoreAt → installationCompleteAt)
    if (doc.availableAtStoreAt && doc.installationCompleteAt) {
      const phase2Ms = new Date(doc.installationCompleteAt).getTime() - new Date(doc.availableAtStoreAt).getTime();
      technicalTime += Math.max(0, phase2Ms / (1000 * 60 * 60));
    }
    
    doc.technicalTimeHours = technicalTime;
    
    // Procurement Time = (procurementRequestedAt → availableAtStoreAt)
    let procurementTime = 0;
    if (doc.procurementRequestedAt && doc.availableAtStoreAt) {
      const procurementMs = new Date(doc.availableAtStoreAt).getTime() - new Date(doc.procurementRequestedAt).getTime();
      procurementTime = Math.max(0, procurementMs / (1000 * 60 * 60));
    }
    doc.procurementTimeHours = procurementTime;
    
    // Ops Time = (testStartAt → upAndRunningAt)
    let opsTime = 0;
    if (doc.testStartAt && doc.upAndRunningAt) {
      const opsMs = new Date(doc.upAndRunningAt).getTime() - new Date(doc.testStartAt).getTime();
      opsTime = Math.max(0, opsMs / (1000 * 60 * 60));
    }
    doc.opsTimeHours = opsTime;
    
    // Total Downtime = (reportedAt → upAndRunningAt)
    const totalMs = new Date(doc.upAndRunningAt).getTime() - new Date(doc.reportedAt).getTime();
    doc.totalDowntimeHours = Math.max(0, totalMs / (1000 * 60 * 60));
  } else if (doc.detectedAt && doc.clearedAt) {
    // Fallback: compute total downtime from detectedAt and clearedAt
    const totalMs = new Date(doc.clearedAt).getTime() - new Date(doc.detectedAt).getTime();
    doc.totalDowntimeHours = Math.max(0, totalMs / (1000 * 60 * 60));
  }
  
  // Set defaults for reportedAt and upAndRunningAt if not set
  if (!doc.reportedAt && doc.detectedAt) {
    doc.reportedAt = doc.detectedAt;
  }
  if (!doc.upAndRunningAt && doc.clearedAt) {
    doc.upAndRunningAt = doc.clearedAt;
  }
}

const AOGEvent = mongoose.model('AOGEvent', aogEventSchema, 'aogevents');

// Aircraft schema (minimal for display)
const aircraftSchema = new mongoose.Schema({
  registration: String,
  fleetGroup: String,
  aircraftType: String,
  msn: String,
  owner: String,
  manufactureDate: Date,
  enginesCount: Number,
  status: String,
}, { timestamps: true });

const Aircraft = mongoose.model('Aircraft', aircraftSchema, 'aircraft');

async function fixImportedMilestones() {
  console.log('🚀 Starting AOG Milestone Migration...\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all imported events
    console.log('🔍 Finding imported AOG events...');
    const importedEvents = await AOGEvent.find({ isImported: true });
    console.log(`📊 Found ${importedEvents.length} imported events\n`);
    
    if (importedEvents.length === 0) {
      console.log('ℹ️  No imported events found. Nothing to migrate.');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each event
    for (const event of importedEvents) {
      try {
        let needsUpdate = false;
        
        // Set reportedAt if not set
        if (!event.reportedAt && event.detectedAt) {
          event.reportedAt = event.detectedAt;
          needsUpdate = true;
        }
        
        // Set installationCompleteAt and upAndRunningAt if event is resolved
        if (event.clearedAt) {
          if (!event.installationCompleteAt) {
            event.installationCompleteAt = event.clearedAt;
            needsUpdate = true;
          }
          
          if (!event.upAndRunningAt) {
            event.upAndRunningAt = event.clearedAt;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          // Compute metrics manually
          computeMetrics(event);
          
          // Save without triggering hooks
          await event.save({ validateBeforeSave: false });
          updatedCount++;
          
          // Log progress every 10 events
          if (updatedCount % 10 === 0) {
            console.log(`⏳ Processed ${updatedCount} events...`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing event ${event._id}:`, error.message);
      }
    }
    
    // Summary
    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} events`);
    console.log(`   ⏭️  Skipped: ${skippedCount} events (already had milestones)`);
    console.log(`   ❌ Errors: ${errorCount} events`);
    
    // Verify metrics were computed
    console.log('\n🔍 Verifying computed metrics...');
    const eventsWithMetrics = await AOGEvent.countDocuments({
      isImported: true,
      totalDowntimeHours: { $gt: 0 }
    });
    console.log(`   ✅ ${eventsWithMetrics} events now have computed downtime metrics`);
    
    // Show sample event (without populate to avoid schema issues)
    const sampleEvent = await AOGEvent.findOne({
      isImported: true,
      totalDowntimeHours: { $gt: 0 }
    });
    
    if (sampleEvent) {
      // Get aircraft separately
      const aircraft = await Aircraft.findById(sampleEvent.aircraftId);
      
      console.log('\n📋 Sample Event (after migration):');
      console.log(`   Aircraft: ${aircraft?.registration || 'Unknown'}`);
      console.log(`   Detected: ${sampleEvent.detectedAt?.toISOString()}`);
      console.log(`   Cleared: ${sampleEvent.clearedAt?.toISOString() || 'Active'}`);
      console.log(`   Reported At: ${sampleEvent.reportedAt?.toISOString()}`);
      console.log(`   Installation Complete: ${sampleEvent.installationCompleteAt?.toISOString() || 'N/A'}`);
      console.log(`   Up & Running: ${sampleEvent.upAndRunningAt?.toISOString() || 'N/A'}`);
      console.log(`   Technical Time: ${sampleEvent.technicalTimeHours.toFixed(2)}h`);
      console.log(`   Procurement Time: ${sampleEvent.procurementTimeHours.toFixed(2)}h`);
      console.log(`   Ops Time: ${sampleEvent.opsTimeHours.toFixed(2)}h`);
      console.log(`   Total Downtime: ${sampleEvent.totalDowntimeHours.toFixed(2)}h`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run migration
fixImportedMilestones()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
