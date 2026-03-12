/**
 * Seed script: inserts old AOG events into the new revamped model.
 * Each old event → 1 parent AOGEvent + 1 AOGSubEvent (the defect/repair detail).
 *
 * Run: node seed-aog-events.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI =
  'mongodb+srv://alislimaly_db_user:5WN8B5PqBx3I5lZe@cluster0.0jvpnjs.mongodb.net/alphastar-kpi?retryWrites=true&w=majority&appName=Cluster0';

// Admin user ObjectId (from seed.ts default users)
const ADMIN_USER_ID = new ObjectId('6940af20f91253dab46aeb7d');

// ─── Raw old events ────────────────────────────────────────────────────────────
const OLD_EVENTS = [
  {
    _id: '698288adba31a3ea040ef44d',
    aircraftId: '697da5f0839c317522ad0f05',
    detectedAt: '2026-01-21T12:34:00.000Z',
    clearedAt: '2026-01-21T13:00:00.000Z',
    category: 'aog',
    reasonCode: 'PTU CHECK VALVE HAS HYD LEAK',
    location: 'OEJN',
    responsibleParty: 'Other',
    actionTaken: 'PTU valve re-torqued and check no leak found',
    manpowerCount: 1,
    manHours: 0,
    reportedAt: '2026-01-21T12:30:00.000Z',
    installationCompleteAt: '2026-01-21T13:00:00.000Z',
    upAndRunningAt: '2026-01-21T13:00:00.000Z',
    totalDowntimeHours: 0.5,
  },
  {
    _id: '698288adba31a3ea040ef450',
    aircraftId: '697da6a25218b76522bab571',
    detectedAt: '2026-01-22T10:00:00.000Z',
    clearedAt: '2026-01-23T05:00:00.000Z',
    category: 'aog',
    reasonCode:
      'During take off asymmetry between torque #1 90% and torque#2 40% on digital and analog indication.',
    location: 'OERK',
    responsibleParty: 'Other',
    actionTaken:
      'R/R OF MFCU AND PERFORMED ENG HIGH POWER RUN, FOUND SATIS. ALL ENG PARAMETERS NORMAL.',
    manpowerCount: 1,
    manHours: 19,
    reportedAt: '2026-01-22T12:00:00.000Z',
    testStartAt: '2026-01-23T05:15:00.000Z',
    installationCompleteAt: '2026-01-23T05:00:00.000Z',
    upAndRunningAt: '2026-01-23T19:00:00.000Z',
    totalDowntimeHours: 31,
  },
  {
    _id: '698288adba31a3ea040ef453',
    aircraftId: '697da6a25218b76522bab568',
    detectedAt: '2026-01-24T05:02:00.000Z',
    clearedAt: '2026-01-24T20:00:00.000Z',
    category: 'aog',
    reasonCode: 'DURING ENGINE START BOTH ENGINE NO ROTATION',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken:
      'T/S CARRIED OUT FOUND EIU #1 AND #2 FAULT, RESET AND RE-RACK EIU NIL HELP. TEST EIU SHOWS SEL SW-ENG/MODE/CRANK/AUTO IGN/IGN WIRING DAMAGED. R/R OF ROTARY SWITCH AND REPAIR OF WIRING PINS C/W.',
    manpowerCount: 1,
    manHours: 18,
    reportedAt: '2026-01-24T06:40:00.000Z',
    procurementRequestedAt: '2026-01-24T07:40:00.000Z',
    availableAtStoreAt: '2026-01-24T09:10:00.000Z',
    issuedBackAt: '2026-01-24T10:00:00.000Z',
    installationCompleteAt: '2026-01-24T12:00:00.000Z',
    testStartAt: '2026-01-24T16:00:00.000Z',
    upAndRunningAt: '2026-01-24T20:00:00.000Z',
    totalDowntimeHours: 13.33,
  },
  {
    _id: '698288adba31a3ea040ef456',
    aircraftId: '697da6a45218b76522bab583',
    detectedAt: '2026-01-25T07:23:00.000Z',
    clearedAt: '2026-01-26T05:00:00.000Z',
    category: 'aog',
    reasonCode: 'MAIN DOOR HINGE CRACKED',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken:
      'RISER ASSY AFFECTED AREA IS THE UPPER HINGE HALF ASSY: DOOR AFT FAIRING COVER AFTER CLEANED & REMOVED ONE AT A TIME OF THE MOUNT SCREW FOUND NO CRACK/NIL FINDINGS.',
    manpowerCount: 1,
    manHours: 23,
    reportedAt: '2026-01-25T09:20:00.000Z',
    installationCompleteAt: '2026-01-26T05:00:00.000Z',
    upAndRunningAt: '2026-01-26T05:00:00.000Z',
    totalDowntimeHours: 19.67,
  },
  {
    _id: '698288aeba31a3ea040ef459',
    aircraftId: '697da6a55218b76522bab58c',
    detectedAt: '2026-01-27T06:04:00.000Z',
    clearedAt: '2026-02-08T15:30:00.000Z',
    category: 'aog',
    reasonCode: 'R GCU FAIL (RH A/C POWER FAIL)',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken: 'Cable repaired and reinstalled',
    manpowerCount: 1,
    manHours: 167,
    reportedAt: '2026-01-27T07:08:00.000Z',
    procurementRequestedAt: '2026-01-31T05:30:00.000Z',
    installationCompleteAt: '2026-02-08T12:00:00.000Z',
    testStartAt: '2026-02-08T15:30:00.000Z',
    upAndRunningAt: '2026-02-08T15:30:00.000Z',
    totalDowntimeHours: 296.37,
  },
  {
    _id: '698b8ec7d9be2d0185542fd3',
    aircraftId: '697da6a25218b76522bab568',
    detectedAt: '2026-01-06T21:42:00.000Z',
    clearedAt: '2026-01-08T01:27:00.000Z',
    category: 'aog',
    reasonCode: 'SPINNER FRONT CONE BOLT ARE DISTORE',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken: 'BOLT REPLACED',
    manpowerCount: 2,
    manHours: 0,
    reportedAt: '2026-01-06T20:42:00.000Z',
    procurementRequestedAt: '2026-01-06T21:42:00.000Z',
    availableAtStoreAt: '2026-01-07T08:20:00.000Z',
    issuedBackAt: '2026-01-07T10:00:00.000Z',
    installationCompleteAt: '2026-01-07T23:30:00.000Z',
    upAndRunningAt: '2026-01-07T23:30:00.000Z',
    totalDowntimeHours: 26.8,
  },
  {
    _id: '698ef8194977e255a39555bb',
    aircraftId: '697da6a55218b76522bab58f',
    detectedAt: '2026-02-01T08:20:00.000Z',
    clearedAt: '2026-02-03T11:45:00.000Z',
    category: 'aog',
    reasonCode: 'R/H WING FUEL LEAKS',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken:
      'Due to defect out of capability A/C relocated to Alkan Air on 03Feb2026 at 02:45 PM for rivet nut replace',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-01T06:20:00.000Z',
    upAndRunningAt: '2026-02-03T11:45:00.000Z',
    totalDowntimeHours: 53.42,
  },
  {
    _id: '698ef94b4977e255a39555d7',
    aircraftId: '697da5ef839c317522ad0ef9',
    detectedAt: '2026-02-09T02:05:00.000Z',
    clearedAt: '2026-02-09T12:45:00.000Z',
    category: 'aog',
    reasonCode: 'COCKPIT LAV SIGN SEAT BELT INOP // MEL EXPIRED',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken: 'SIGN LIGHT R&R C/W',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-09T00:05:00.000Z',
    procurementRequestedAt: '2026-02-09T00:10:00.000Z',
    availableAtStoreAt: '2026-02-09T03:45:00.000Z',
    issuedBackAt: '2026-02-09T03:50:00.000Z',
    installationCompleteAt: '2026-02-09T12:45:00.000Z',
    upAndRunningAt: '2026-02-09T12:45:00.000Z',
    totalDowntimeHours: 12.67,
  },
  {
    _id: '698efac24977e255a39555f3',
    aircraftId: '697da6a25218b76522bab568',
    detectedAt: '2026-02-09T23:40:00.000Z',
    clearedAt: '2026-02-12T12:00:00.000Z',
    category: 'aog',
    reasonCode: 'DAMAGED AFT LOWER FUESLAGE',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken:
      'The damaged out of limit, A/C relocated to Al-Salam Facility on 12 Feb 2026 at 01:00 PM',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-09T23:40:00.000Z',
    upAndRunningAt: '2026-02-12T12:00:00.000Z',
    totalDowntimeHours: 60.33,
  },
  {
    _id: '698f9f8f4977e255a3955773',
    aircraftId: '697da6a45218b76522bab586',
    detectedAt: '2025-09-15T17:00:00.000Z',
    clearedAt: '2025-10-07T19:00:00.000Z',
    category: 'aog',
    reasonCode: 'L MLG DOOR & LOWER LH WING & AFT FUSELAGE HAS DAMAGED',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken:
      'Under evolution by LNM and QC and contacted Gulfstream for permeant or temporary repair to be perform by Jet Aviation',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2025-09-15T17:00:00.000Z',
    upAndRunningAt: '2025-10-07T07:00:00.000Z',
    totalDowntimeHours: 518,
  },
  {
    _id: '69901c624977e255a39557c3',
    aircraftId: '697da5f0839c317522ad0eff',
    detectedAt: '2026-01-12T08:30:00.000Z',
    clearedAt: null, // still active MRO
    category: 'mro',
    reasonCode: 'Aircraft at jet aviation Basel for schedule maintenance',
    location: 'LFSB',
    responsibleParty: 'Other',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-01-12T08:30:00.000Z',
    totalDowntimeHours: 0,
  },
  {
    _id: '69901cfe4977e255a39557ce',
    aircraftId: '697da6a15218b76522bab565',
    detectedAt: '2025-11-16T08:30:00.000Z',
    clearedAt: null, // still active MRO
    category: 'mro',
    reasonCode: 'Aircraft at AMAC Basel for schedule maintenance',
    location: 'LFSB',
    responsibleParty: 'Other',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2025-11-16T08:30:00.000Z',
    totalDowntimeHours: 0,
  },
  {
    _id: '699020374977e255a39557ed',
    aircraftId: '697da6a35218b76522bab574',
    detectedAt: '2026-01-23T08:00:00.000Z',
    clearedAt: null, // still active MRO
    category: 'mro',
    reasonCode: 'Aircraft at TEXTRON Zurich for schedule maintenance',
    location: 'LSZH',
    responsibleParty: 'Other',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-01-23T08:00:00.000Z',
    totalDowntimeHours: 0,
  },
  {
    _id: '6990241f4977e255a3955838',
    aircraftId: '697da6a45218b76522bab589',
    detectedAt: '2025-07-21T08:30:00.000Z',
    clearedAt: null, // still active MRO
    category: 'mro',
    reasonCode: 'Aircraft at JET AVIATION Dubai for schedule maintenance',
    location: 'OMDB',
    responsibleParty: 'Other',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2025-07-21T08:30:00.000Z',
    totalDowntimeHours: 0,
  },
  {
    _id: '6991a65a4977e255a3955a43',
    aircraftId: '697da6a25218b76522bab568',
    detectedAt: '2026-02-12T14:00:00.000Z',
    clearedAt: null, // still active
    category: 'unscheduled',
    reasonCode:
      'A/C relocated to Al-Salam Facility due to damaged need to be repair',
    location: 'OERK',
    responsibleParty: 'Other',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-12T12:00:00.000Z',
    totalDowntimeHours: 0,
  },
  {
    _id: '69930bb74977e255a39565e5',
    aircraftId: '697da5f0839c317522ad0f02',
    detectedAt: '2024-05-05T19:25:00.000Z',
    clearedAt: '2025-12-21T21:59:00.000Z',
    category: 'mro',
    reasonCode: 'A/C at Jet Aviation Basel for schedule maintenance',
    location: 'LFSB',
    responsibleParty: 'Other',
    actionTaken: 'A/C returned in Services',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2024-05-05T19:25:00.000Z',
    upAndRunningAt: '2025-12-21T21:59:00.000Z',
    totalDowntimeHours: 14282.57,
  },
  {
    _id: '6993387e4977e255a3956669',
    aircraftId: '697da6a45218b76522bab586',
    detectedAt: '2025-10-07T09:00:00.000Z',
    clearedAt: '2026-02-16T11:01:00.000Z',
    category: 'unscheduled',
    reasonCode:
      'L MLG DOOR & LOWER LH WING & AFT FUSELAGE HAS DAMAGED AND UNDER TEMPORARY REPAIR BY JET AVIATION DXB TEAM at Medivac Facility',
    location: 'OERK',
    responsibleParty: 'Other',
    actionTaken:
      'Temporary repair performed and A/C returned to LNM to perform scheduled maintenance and awaiting GSA instructions',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2025-10-07T09:00:00.000Z',
    upAndRunningAt: '2026-02-16T11:01:00.000Z',
    totalDowntimeHours: 3170.02,
  },
  {
    _id: '699338da4977e255a3956671',
    aircraftId: '697da6a45218b76522bab586',
    detectedAt: '2026-02-16T12:00:00.000Z',
    clearedAt: null, // still active
    category: 'scheduled',
    reasonCode:
      'A/C under Scheduled maintenance to perform the overdue tasks, C Check and APU installation',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-16T12:00:00.000Z',
    totalDowntimeHours: 0,
  },
  {
    _id: '69934dd74977e255a39566a9',
    aircraftId: '697da6a35218b76522bab57d',
    detectedAt: '2025-12-28T07:00:00.000Z',
    clearedAt: '2025-12-28T17:55:00.000Z',
    category: 'mro',
    reasonCode: 'A/C at Al-Wallan Facility for schedule maintenance',
    location: null,
    responsibleParty: 'Other',
    actionTaken: 'schedule maintenance completed',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2025-12-28T07:00:00.000Z',
    upAndRunningAt: '2025-12-28T17:55:00.000Z',
    totalDowntimeHours: 10.92,
  },
  {
    _id: '69934f954977e255a39566c3',
    aircraftId: '697da6a55218b76522bab58f',
    detectedAt: '2026-02-03T17:00:00.000Z',
    clearedAt: '2026-02-13T14:45:00.000Z',
    category: 'unscheduled',
    reasonCode: 'FUEL LEAK, TANK RIVET LEAKING',
    location: 'HECA',
    responsibleParty: 'Other',
    actionTaken: 'Rivets nut replaced and fuel leak check found ok',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-03T17:00:00.000Z',
    upAndRunningAt: '2026-02-13T14:45:00.000Z',
    totalDowntimeHours: 237.75,
  },
  {
    _id: '699350cf4977e255a39566d9',
    aircraftId: '697da5f0839c317522ad0f02',
    detectedAt: '2026-02-04T02:00:00.000Z',
    clearedAt: '2026-02-08T13:00:00.000Z',
    category: 'unscheduled',
    reasonCode:
      'A/C at Jet Aviation Basel for special visit to repair the IFE system',
    location: 'LFSB',
    responsibleParty: 'Internal',
    actionTaken: 'System repaired as required',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-04T02:00:00.000Z',
    upAndRunningAt: '2026-02-08T13:00:00.000Z',
    totalDowntimeHours: 107,
  },
  {
    _id: '69939c974977e255a3956754',
    aircraftId: '697da5ef839c317522ad0ef9',
    detectedAt: '2026-02-16T21:37:00.000Z',
    clearedAt: null, // still active
    category: 'aog',
    reasonCode:
      'ENG #4 THERMAL BLANKET AT R/H TR 6 O\'CLOCK POSITION IS DAMAGED & A PIECE IS MISSING',
    location: 'OERK',
    responsibleParty: 'Internal',
    actionTaken: 'See defect description',
    manpowerCount: 0,
    manHours: 0,
    reportedAt: '2026-02-16T21:37:00.000Z',
    procurementRequestedAt: '2026-02-17T19:20:00.000Z',
    totalDowntimeHours: 0,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function d(iso) {
  return iso ? new Date(iso) : undefined;
}

function computeSubEventBuckets(event) {
  const detectedAt = d(event.detectedAt) || new Date();
  const clearedAt = d(event.clearedAt);
  const endTime = clearedAt || new Date();
  const totalDowntimeHours = Math.max(
    0,
    (endTime - detectedAt) / (1000 * 60 * 60),
  );
  // No department handoffs in old data → departmentTimeHours = 0
  return {
    technicalTimeHours: totalDowntimeHours,
    departmentTimeHours: 0,
    departmentTimeTotals: {},
    totalDowntimeHours,
  };
}

// ─── Build documents ───────────────────────────────────────────────────────────

function buildParentEvent(e) {
  const now = new Date();
  const doc = {
    _id: new ObjectId(e._id),
    aircraftId: new ObjectId(e.aircraftId),
    detectedAt: d(e.detectedAt),
    clearedAt: d(e.clearedAt) || undefined,
    category: e.category,
    reasonCode: e.reasonCode,
    responsibleParty: e.responsibleParty,
    actionTaken: e.actionTaken,
    manpowerCount: e.manpowerCount ?? 0,
    manHours: e.manHours ?? 0,
    location: e.location || undefined,
    // Milestone timestamps (preserved from old data)
    reportedAt: d(e.reportedAt),
    procurementRequestedAt: d(e.procurementRequestedAt),
    availableAtStoreAt: d(e.availableAtStoreAt),
    issuedBackAt: d(e.issuedBackAt),
    installationCompleteAt: d(e.installationCompleteAt),
    testStartAt: d(e.testStartAt),
    upAndRunningAt: d(e.upAndRunningAt),
    // Computed buckets (from old stored values)
    technicalTimeHours: 0,
    procurementTimeHours: 0,
    opsTimeHours: 0,
    totalDowntimeHours: e.totalDowntimeHours ?? 0,
    internalCost: 0,
    externalCost: 0,
    attachments: [],
    isLegacy: false,
    isImported: true,
    milestoneHistory: [],
    updatedBy: ADMIN_USER_ID,
    createdAt: now,
    updatedAt: now,
    __v: 0,
  };

  // Remove undefined keys so MongoDB doesn't store them
  Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
  return doc;
}

function buildSubEvent(e, parentId) {
  const now = new Date();
  const buckets = computeSubEventBuckets(e);

  const doc = {
    _id: new ObjectId(),
    parentEventId: parentId,
    category: ['aog', 'scheduled', 'unscheduled'].includes(e.category)
      ? e.category
      : 'unscheduled', // mro → unscheduled for sub-event enum
    reasonCode: e.reasonCode,
    actionTaken: e.actionTaken || 'See defect description',
    detectedAt: d(e.detectedAt),
    clearedAt: d(e.clearedAt) || undefined,
    manpowerCount: e.manpowerCount ?? 0,
    manHours: e.manHours ?? 0,
    departmentHandoffs: [],
    notes: e.location ? `Location: ${e.location}` : undefined,
    updatedBy: ADMIN_USER_ID,
    technicalTimeHours: buckets.technicalTimeHours,
    departmentTimeHours: buckets.departmentTimeHours,
    departmentTimeTotals: buckets.departmentTimeTotals,
    totalDowntimeHours: buckets.totalDowntimeHours,
    createdAt: now,
    updatedAt: now,
    __v: 0,
  };

  Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
  return doc;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('alphastar-kpi');
    const eventsCol = db.collection('aogevents');
    const subEventsCol = db.collection('aogsubevents');

    // Clear existing data
    await eventsCol.deleteMany({});
    await subEventsCol.deleteMany({});
    console.log('Cleared aogevents and aogsubevents collections');

    const parentDocs = [];
    const subEventDocs = [];

    for (const e of OLD_EVENTS) {
      const parent = buildParentEvent(e);
      const sub = buildSubEvent(e, parent._id);
      parentDocs.push(parent);
      subEventDocs.push(sub);
    }

    await eventsCol.insertMany(parentDocs);
    console.log(`Inserted ${parentDocs.length} parent AOG events`);

    await subEventsCol.insertMany(subEventDocs);
    console.log(`Inserted ${subEventDocs.length} AOG sub-events`);

    console.log('\nDone! Summary:');
    parentDocs.forEach((p, i) => {
      console.log(
        `  [${i + 1}] ${p._id} | ${p.category.toUpperCase()} | ${p.reasonCode?.substring(0, 50)}`,
      );
    });
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
