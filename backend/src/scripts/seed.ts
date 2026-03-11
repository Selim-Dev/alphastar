/**
 * Production Database Seed Script
 * 
 * Seeds ONLY essential data for production:
 * - Default admin user
 * - Aircraft master data from Alpha Star fleet
 * 
 * NO dummy data (no AOG events, maintenance tasks, etc.)
 * Client will input actual operational data through the UI.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/seed-production.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Import schemas
import { User, UserDocument, UserRole, UserSchema } from '../auth/schemas/user.schema';
import { Aircraft, AircraftDocument, AircraftStatus, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { BudgetProject, BudgetProjectDocument, BudgetProjectSchema } from '../budget-projects/schemas/budget-project.schema';
import { BudgetPlanRow, BudgetPlanRowDocument, BudgetPlanRowSchema } from '../budget-projects/schemas/budget-plan-row.schema';
import { RSAF_SPENDING_TERMS } from '../budget-projects/templates/spending-terms.registry';

// Production seed data - ONLY essential data
const ADMIN_USER = {
  email: 'admin@alphastarav.com',
  password: 'Admin@123!', // IMPORTANT: Change this password after first login!
  name: 'System Administrator',
  role: UserRole.Admin,
};

// Aircraft fleet data from Alpha Star Aviation (27 aircraft)
const AIRCRAFT_DATA: Partial<Aircraft>[] = [
  {
    registration: 'HZ-A42',
    fleetGroup: 'AIRBUS 340',
    aircraftType: 'A340-642 ACJ',
    msn: '924',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2008-08-04'),
    certificationDate: undefined,
    inServiceDate: new Date('2012-05-25'),
    enginesCount: 4,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SKY1',
    fleetGroup: 'AIRBUS 340',
    aircraftType: 'A340-212 ACJ',
    msn: '9',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('1993-01-13'),
    inServiceDate: new Date('1993-01-13'),
    enginesCount: 4,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SKY2',
    fleetGroup: 'AIRBUS 330',
    aircraftType: 'A330-243',
    msn: '1676',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2015-11-16'),
    inServiceDate: new Date('2017-01-31'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SKY4',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A319-115 ACJ',
    msn: '6727',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2015-10-06'),
    inServiceDate: new Date('2016-10-14'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A2',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320-214',
    msn: '3164',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2007-01-01'),
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A3',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320',
    msn: '764',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A4',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320',
    msn: 'TBD',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A5',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320',
    msn: 'TBD',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A15',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320',
    msn: 'TBD',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A10',
    fleetGroup: 'ATR',
    aircraftType: 'ATR 42-500',
    msn: '859',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2012-09-28'),
    certificationDate: new Date('2012-09-28'),
    inServiceDate: new Date('2012-09-28'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A11',
    fleetGroup: 'ATR',
    aircraftType: 'ATR 72-212A',
    msn: '1184',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2014-10-08'),
    certificationDate: new Date('2014-10-08'),
    inServiceDate: new Date('2014-10-08'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A24',
    fleetGroup: 'ATR',
    aircraftType: 'ATR 72-212A',
    msn: '1541',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2018-12-27'),
    certificationDate: new Date('2018-12-27'),
    inServiceDate: new Date('2018-12-27'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A8',
    fleetGroup: 'HAWKER 900XP',
    aircraftType: 'HAWKER 900XP',
    msn: 'HA-0153',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2009-11-05'),
    certificationDate: new Date('2009-11-05'),
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A9',
    fleetGroup: 'HAWKER 900XP',
    aircraftType: 'HAWKER 900XP',
    msn: 'HA-0173',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2010-11-28'),
    certificationDate: new Date('2010-10-13'),
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A25',
    fleetGroup: 'CITATION LATITUDE',
    aircraftType: '680A CITATION LATITUDE',
    msn: '680A-0355',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A26',
    fleetGroup: 'CITATION LATITUDE',
    aircraftType: '680A CITATION LATITUDE',
    msn: '680A-0412',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A32',
    fleetGroup: 'KING AIR',
    aircraftType: 'SUPER KING AIR B300C',
    msn: 'FM-116',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2024-03-07'),
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A22',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G450',
    msn: '4064',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2006-11-01'),
    inServiceDate: new Date('2007-02-20'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SK2',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G450',
    msn: '4067',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2006-12-04'),
    inServiceDate: new Date('2007-04-26'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SK3',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G450',
    msn: '4073',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2007-02-05'),
    inServiceDate: new Date('2007-05-24'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SK5',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G450',
    msn: '4007',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2004-11-27'),
    inServiceDate: new Date('2005-06-14'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SK7',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G450',
    msn: '4024',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: new Date('2005-07-24'),
    inServiceDate: new Date('2005-11-18'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-CMJ',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A319-115 ACJ',
    msn: '4768',
    owner: 'MBF',
    manufactureDate: new Date('2011-07-05'),
    certificationDate: undefined,
    inServiceDate: new Date('2013-11-01'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-MD6',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G650ER',
    msn: '6558',
    owner: 'DWA',
    manufactureDate: undefined,
    certificationDate: new Date('2023-10-31'),
    inServiceDate: new Date('2024-02-22'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-MD62',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G650ER',
    msn: '6562',
    owner: 'DWA',
    manufactureDate: undefined,
    certificationDate: new Date('2023-11-22'),
    inServiceDate: new Date('2024-03-22'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'M-III',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'G650ER',
    msn: '6549',
    owner: 'PIF',
    manufactureDate: undefined,
    certificationDate: new Date('2023-08-08'),
    inServiceDate: new Date('2023-12-05'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'VP-CSN',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A319-115 ACJ',
    msn: '3356',
    owner: 'SBN',
    manufactureDate: undefined,
    certificationDate: new Date('2008-01-04'),
    inServiceDate: new Date('2009-07-16'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  // ===== ADDED FOR HISTORICAL AOG DATA IMPORT =====
  {
    registration: 'HZ-SKY',
    fleetGroup: 'AIRBUS 340',
    aircraftType: 'A340-212 ACJ',
    msn: 'Unknown',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 4,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-XY7',
    fleetGroup: 'AIRBUS 340',
    aircraftType: 'A340 ACJ',
    msn: 'Unknown',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 4,
    status: AircraftStatus.Active,
  },
  {
    registration: 'M-IIII',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'Gulfstream G650ER',
    msn: 'Unknown',
    owner: 'Alpha Star Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'SU-SME',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320',
    msn: 'Unknown',
    owner: 'Wet Lease',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Leased,
  },
  {
    registration: 'SU-SMK',
    fleetGroup: 'AIRBUS A320 FAMILY',
    aircraftType: 'A320',
    msn: 'Unknown',
    owner: 'Wet Lease',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Leased,
  },
  {
    registration: 'VP-CAL',
    fleetGroup: 'CESSNA',
    aircraftType: 'Citation Bravo',
    msn: 'Unknown',
    owner: 'Sky Prime Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'VP-CMJ',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'Gulfstream G450',
    msn: 'Unknown',
    owner: 'Sky Prime Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'VP-CSK',
    fleetGroup: 'CESSNA',
    aircraftType: 'Citation Bravo',
    msn: 'Unknown',
    owner: 'Sky Prime Aviation',
    manufactureDate: undefined,
    certificationDate: undefined,
    inServiceDate: undefined,
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
];

// Create seed module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Aircraft.name, schema: AircraftSchema },
      { name: BudgetProject.name, schema: BudgetProjectSchema },
      { name: BudgetPlanRow.name, schema: BudgetPlanRowSchema },
    ]),
  ],
})
class SeedModule {}

class ProductionSeeder {
  private adminUserId!: Types.ObjectId;

  constructor(
    private userModel: Model<UserDocument>,
    private aircraftModel: Model<AircraftDocument>,
    private budgetProjectModel: Model<BudgetProjectDocument>,
    private budgetPlanRowModel: Model<BudgetPlanRowDocument>,
  ) {}

  async seedUsers(): Promise<void> {
    console.log('🔐 Seeding admin user...');

    let existingUser = await this.userModel.findOne({ email: ADMIN_USER.email });
    if (existingUser) {
      console.log(`  ⏭️  User ${ADMIN_USER.email} already exists, skipping...`);
      this.adminUserId = existingUser._id as Types.ObjectId;
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);
    const newUser = await this.userModel.create({
      email: ADMIN_USER.email,
      passwordHash,
      name: ADMIN_USER.name,
      role: ADMIN_USER.role,
    });
    console.log(`  ✅ Created admin user: ${ADMIN_USER.email}`);
    console.log(`  ⚠️  IMPORTANT: Change the default password after first login!`);
    
    this.adminUserId = newUser._id as Types.ObjectId;
  }

  async seedAircraft(): Promise<AircraftDocument[]> {
    console.log('✈️  Seeding aircraft master data...');
    const createdAircraft: AircraftDocument[] = [];

    for (const aircraft of AIRCRAFT_DATA) {
      let existing = await this.aircraftModel.findOne({ registration: aircraft.registration });
      if (existing) {
        console.log(`  ⏭️  Aircraft ${aircraft.registration} already exists, skipping...`);
        createdAircraft.push(existing);
        continue;
      }

      // Clean up undefined values - Mongoose doesn't like explicit undefined
      const cleanedAircraft: Record<string, any> = {};
      for (const [key, value] of Object.entries(aircraft)) {
        if (value !== undefined) {
          cleanedAircraft[key] = value;
        }
      }

      const newAircraft = await this.aircraftModel.create(cleanedAircraft);
      console.log(`  ✅ Created aircraft: ${aircraft.registration} (${aircraft.aircraftType || 'N/A'})`);
      createdAircraft.push(newAircraft);
    }

    return createdAircraft;
  }

  async seedRSAFBudgetProject(): Promise<void> {
    console.log('💰 Seeding RSAF budget project...');

    const existingProject = await this.budgetProjectModel.findOne({ name: 'RSAF FY2025 Budget' });
    if (existingProject) {
      console.log('  ⏭️  RSAF FY2025 Budget already exists, skipping...');
      return;
    }

    const columnNames = ['A330', 'G650ER-1', 'G650ER-2', 'PMO'];

    // Create the budget project
    const project = await this.budgetProjectModel.create({
      name: 'RSAF FY2025 Budget',
      templateType: 'RSAF',
      columnNames,
      dateRange: {
        start: new Date('2025-04-01'),
        end: new Date('2028-03-31'),
      },
      currency: 'USD',
      status: 'active',
      createdBy: this.adminUserId,
    });
    console.log('  ✅ Created RSAF FY2025 Budget project');

    // Map 18 RSAF clauses to the first spending term in each category
    // Format: termId → { A330, 'G650ER-1', 'G650ER-2', PMO }
    const clauseAmounts: Record<string, Record<string, number>> = {
      'off-base-maint-intl-scheduled': { 'A330': 275_789, 'G650ER-1': 1_399_409, 'G650ER-2': 1_399_409, 'PMO': 0 },
      'scheduled-maint-a-check':       { 'A330': 1_000_000, 'G650ER-1': 2_500_000, 'G650ER-2': 2_500_000, 'PMO': 0 },
      'engines-apu-corporate-care':    { 'A330': 2_000_000, 'G650ER-1': 5_000_000, 'G650ER-2': 5_000_000, 'PMO': 0 },
      'landing-gear-overhaul':         { 'A330': 500_000, 'G650ER-1': 1_200_000, 'G650ER-2': 1_200_000, 'PMO': 0 },
      'component-repair-avionics':     { 'A330': 300_000, 'G650ER-1': 800_000, 'G650ER-2': 800_000, 'PMO': 0 },
      'spare-parts-rotable':           { 'A330': 800_000, 'G650ER-1': 2_000_000, 'G650ER-2': 2_000_000, 'PMO': 0 },
      'gse-purchase':                  { 'A330': 200_000, 'G650ER-1': 500_000, 'G650ER-2': 500_000, 'PMO': 300_000 },
      'handling-permits-landing-fees':  { 'A330': 400_000, 'G650ER-1': 1_000_000, 'G650ER-2': 1_000_000, 'PMO': 200_000 },
      'fuel-jet-a1':                   { 'A330': 2_000_000, 'G650ER-1': 4_000_000, 'G650ER-2': 4_000_000, 'PMO': 0 },
      'subscriptions-navigation-data': { 'A330': 100_000, 'G650ER-1': 200_000, 'G650ER-2': 200_000, 'PMO': 500_000 },
      'insurance-hull':                { 'A330': 500_000, 'G650ER-1': 1_200_000, 'G650ER-2': 1_200_000, 'PMO': 0 },
      'cabin-crew-salaries':           { 'A330': 300_000, 'G650ER-1': 800_000, 'G650ER-2': 800_000, 'PMO': 0 },
      'manpower-pilots':               { 'A330': 800_000, 'G650ER-1': 1_500_000, 'G650ER-2': 1_500_000, 'PMO': 5_000_000 },
      'miscellaneous-office-supplies': { 'A330': 200_000, 'G650ER-1': 500_000, 'G650ER-2': 500_000, 'PMO': 3_000_000 },
      'communication-satcom':          { 'A330': 100_000, 'G650ER-1': 200_000, 'G650ER-2': 200_000, 'PMO': 500_000 },
      'consumables-oil':               { 'A330': 50_000, 'G650ER-1': 100_000, 'G650ER-2': 100_000, 'PMO': 200_000 },
      'catering-meals':                { 'A330': 67_979, 'G650ER-1': 142_410, 'G650ER-2': 142_410, 'PMO': 168_241 },
      'training-pilot-recurrent':      { 'A330': 700_000, 'G650ER-1': 1_100_000, 'G650ER-2': 1_100_000, 'PMO': 1_800_000 },
    };

    // Generate plan rows: 65 terms × 4 columns = 260 rows
    const planRows: Array<{
      projectId: Types.ObjectId;
      termId: string;
      termName: string;
      termCategory: string;
      columnName: string;
      plannedAmount: number;
    }> = [];

    for (const term of RSAF_SPENDING_TERMS) {
      for (const colName of columnNames) {
        const amounts = clauseAmounts[term.id];
        const plannedAmount = amounts ? (amounts[colName] || 0) : 0;

        planRows.push({
          projectId: project._id as Types.ObjectId,
          termId: term.id,
          termName: term.name,
          termCategory: term.category,
          columnName: colName,
          plannedAmount,
        });
      }
    }

    await this.budgetPlanRowModel.insertMany(planRows);
    console.log(`  ✅ Created ${planRows.length} plan rows (${RSAF_SPENDING_TERMS.length} terms × ${columnNames.length} columns)`);

    // Log grand totals for verification
    const totals: Record<string, number> = {};
    for (const row of planRows) {
      totals[row.columnName] = (totals[row.columnName] || 0) + row.plannedAmount;
    }
    const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);
    console.log('  📊 Grand totals:');
    for (const [col, total] of Object.entries(totals)) {
      console.log(`     ${col}: $${total.toLocaleString()}`);
    }
    console.log(`     Total: $${grandTotal.toLocaleString()}`);
  }

  async run(): Promise<void> {
    console.log('\n🚀 Starting PRODUCTION database seed...\n');
    console.log('⚠️  This script seeds ONLY essential data:');
    console.log('   - Admin user');
    console.log('   - Aircraft master data (27 aircraft)');
    console.log('');
    console.log('📝 NO dummy data will be created.');
    console.log('   Client will input actual operational data through the UI.\n');

    await this.seedUsers();
    console.log('');
    
    const aircraft = await this.seedAircraft();
    console.log('');

    await this.seedRSAFBudgetProject();
    console.log('');

    console.log('✨ Production database seed completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 NEXT STEPS - Data Entry Workflow:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1️⃣  LOGIN');
    console.log('   Email: admin@alphastarav.com');
    console.log('   Password: Admin@123!');
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    console.log('');
    console.log('2️⃣  CREATE ADDITIONAL USERS (Admin Panel)');
    console.log('   - Create Editor accounts for operations team');
    console.log('   - Create Viewer accounts for management');
    console.log('');
    console.log('3️⃣  VERIFY AIRCRAFT DATA (Aircraft Page)');
    console.log('   - Review all 27 aircraft');
    console.log('   - Update any missing information');
    console.log('   - Verify fleet groups and types');
    console.log('');
    console.log('4️⃣  INPUT CURRENT UTILIZATION COUNTERS');
    console.log('   - Navigate to each aircraft detail page');
    console.log('   - Enter current airframe hours (TTSN)');
    console.log('   - Enter current airframe cycles (TCSN)');
    console.log('   - Enter engine hours and cycles');
    console.log('   - Enter APU hours');
    console.log('   OR use Excel import for bulk entry');
    console.log('');
    console.log('5️⃣  START DAILY STATUS TRACKING');
    console.log('   - Begin recording daily availability');
    console.log('   - Track FMC hours, scheduled/unscheduled downtime');
    console.log('   - Establish baseline availability metrics');
    console.log('');
    console.log('6️⃣  SETUP BUDGET (Optional)');
    console.log('   - Navigate to Budget page');
    console.log('   - Enter fiscal year budget plans');
    console.log('   - Configure budget clauses for your operation');
    console.log('');
    console.log('7️⃣  BEGIN OPERATIONAL TRACKING');
    console.log('   - Log AOG events as they occur');
    console.log('   - Record maintenance tasks');
    console.log('   - Track work orders');
    console.log('   - Document discrepancies');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 For detailed instructions, see: PRODUCTION-DATA-ENTRY-GUIDE.md');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Main execution
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const budgetProjectModel = app.get<Model<BudgetProjectDocument>>('BudgetProjectModel');
  const budgetPlanRowModel = app.get<Model<BudgetPlanRowDocument>>('BudgetPlanRowModel');

  const seeder = new ProductionSeeder(userModel, aircraftModel, budgetProjectModel, budgetPlanRowModel);

  try {
    await seeder.run();
  } catch (error) {
    console.error('❌ Production seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
