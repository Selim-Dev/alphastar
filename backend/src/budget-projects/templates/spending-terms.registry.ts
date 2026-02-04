export interface SpendingTerm {
  id: string;
  name: string;
  category: string;
  description?: string;
  sortOrder: number;
}

export interface BudgetTemplate {
  type: string;
  name: string;
  spendingTerms: SpendingTerm[];
  excelStructure: {
    headerRow: number;
    termColumn: string;
    plannedColumns: string[];
    actualColumns: string[];
  };
}

// RSAF Template with 60+ spending terms
export const RSAF_SPENDING_TERMS: SpendingTerm[] = [
  // Off Base Maintenance - International
  { id: 'off-base-maint-intl-scheduled', name: 'Off Base Maintenance International - Scheduled', category: 'Off Base Maintenance International', sortOrder: 1 },
  { id: 'off-base-maint-intl-unscheduled', name: 'Off Base Maintenance International - Unscheduled', category: 'Off Base Maintenance International', sortOrder: 2 },
  { id: 'off-base-maint-intl-aog', name: 'Off Base Maintenance International - AOG', category: 'Off Base Maintenance International', sortOrder: 3 },
  
  // Off Base Maintenance - Domestic
  { id: 'off-base-maint-dom-scheduled', name: 'Off Base Maintenance Domestic - Scheduled', category: 'Off Base Maintenance Domestic', sortOrder: 4 },
  { id: 'off-base-maint-dom-unscheduled', name: 'Off Base Maintenance Domestic - Unscheduled', category: 'Off Base Maintenance Domestic', sortOrder: 5 },
  { id: 'off-base-maint-dom-aog', name: 'Off Base Maintenance Domestic - AOG', category: 'Off Base Maintenance Domestic', sortOrder: 6 },
  
  // Scheduled Maintenance
  { id: 'scheduled-maint-a-check', name: 'Scheduled Maintenance - A Check', category: 'Scheduled Maintenance', sortOrder: 7 },
  { id: 'scheduled-maint-c-check', name: 'Scheduled Maintenance - C Check', category: 'Scheduled Maintenance', sortOrder: 8 },
  { id: 'scheduled-maint-d-check', name: 'Scheduled Maintenance - D Check', category: 'Scheduled Maintenance', sortOrder: 9 },
  { id: 'scheduled-maint-other', name: 'Scheduled Maintenance - Other', category: 'Scheduled Maintenance', sortOrder: 10 },
  
  // Engines & APU
  { id: 'engines-apu-corporate-care', name: 'Engines & APU Corporate Care Program', category: 'Engines & APU', sortOrder: 11 },
  { id: 'engines-apu-overhaul', name: 'Engines & APU Overhaul', category: 'Engines & APU', sortOrder: 12 },
  { id: 'engines-apu-repair', name: 'Engines & APU Repair', category: 'Engines & APU', sortOrder: 13 },
  
  // Landing Gear
  { id: 'landing-gear-overhaul', name: 'Landing Gear Overhaul', category: 'Landing Gear', sortOrder: 14 },
  { id: 'landing-gear-repair', name: 'Landing Gear Repair', category: 'Landing Gear', sortOrder: 15 },
  
  // Component Repair
  { id: 'component-repair-avionics', name: 'Component Repair - Avionics', category: 'Component Repair', sortOrder: 16 },
  { id: 'component-repair-hydraulics', name: 'Component Repair - Hydraulics', category: 'Component Repair', sortOrder: 17 },
  { id: 'component-repair-pneumatics', name: 'Component Repair - Pneumatics', category: 'Component Repair', sortOrder: 18 },
  { id: 'component-repair-electrical', name: 'Component Repair - Electrical', category: 'Component Repair', sortOrder: 19 },
  { id: 'component-repair-other', name: 'Component Repair - Other', category: 'Component Repair', sortOrder: 20 },
  
  // Spare Parts
  { id: 'spare-parts-rotable', name: 'Spare Parts - Rotable', category: 'Spare Parts', sortOrder: 21 },
  { id: 'spare-parts-expendable', name: 'Spare Parts - Expendable', category: 'Spare Parts', sortOrder: 22 },
  { id: 'spare-parts-consumable', name: 'Spare Parts - Consumable', category: 'Spare Parts', sortOrder: 23 },
  
  // Consumables
  { id: 'consumables-oil', name: 'Consumables - Oil', category: 'Consumables', sortOrder: 24 },
  { id: 'consumables-hydraulic-fluid', name: 'Consumables - Hydraulic Fluid', category: 'Consumables', sortOrder: 25 },
  { id: 'consumables-chemicals', name: 'Consumables - Chemicals', category: 'Consumables', sortOrder: 26 },
  { id: 'consumables-other', name: 'Consumables - Other', category: 'Consumables', sortOrder: 27 },
  
  // Ground Support Equipment
  { id: 'gse-purchase', name: 'Ground Support Equipment - Purchase', category: 'Ground Support Equipment', sortOrder: 28 },
  { id: 'gse-rental', name: 'Ground Support Equipment - Rental', category: 'Ground Support Equipment', sortOrder: 29 },
  { id: 'gse-maintenance', name: 'Ground Support Equipment - Maintenance', category: 'Ground Support Equipment', sortOrder: 30 },
  
  // Fuel
  { id: 'fuel-jet-a1', name: 'Fuel - Jet A1', category: 'Fuel', sortOrder: 31 },
  { id: 'fuel-avgas', name: 'Fuel - Avgas', category: 'Fuel', sortOrder: 32 },
  
  // Subscriptions
  { id: 'subscriptions-navigation-data', name: 'Subscriptions - Navigation Data', category: 'Subscriptions', sortOrder: 33 },
  { id: 'subscriptions-weather-services', name: 'Subscriptions - Weather Services', category: 'Subscriptions', sortOrder: 34 },
  { id: 'subscriptions-flight-planning', name: 'Subscriptions - Flight Planning', category: 'Subscriptions', sortOrder: 35 },
  { id: 'subscriptions-technical-manuals', name: 'Subscriptions - Technical Manuals', category: 'Subscriptions', sortOrder: 36 },
  { id: 'subscriptions-other', name: 'Subscriptions - Other', category: 'Subscriptions', sortOrder: 37 },
  
  // Insurance
  { id: 'insurance-hull', name: 'Insurance - Hull', category: 'Insurance', sortOrder: 38 },
  { id: 'insurance-liability', name: 'Insurance - Liability', category: 'Insurance', sortOrder: 39 },
  { id: 'insurance-war-risk', name: 'Insurance - War Risk', category: 'Insurance', sortOrder: 40 },
  
  // Cabin Crew
  { id: 'cabin-crew-salaries', name: 'Cabin Crew - Salaries', category: 'Cabin Crew', sortOrder: 41 },
  { id: 'cabin-crew-training', name: 'Cabin Crew - Training', category: 'Cabin Crew', sortOrder: 42 },
  { id: 'cabin-crew-uniforms', name: 'Cabin Crew - Uniforms', category: 'Cabin Crew', sortOrder: 43 },
  { id: 'cabin-crew-allowances', name: 'Cabin Crew - Allowances', category: 'Cabin Crew', sortOrder: 44 },
  
  // Manpower
  { id: 'manpower-pilots', name: 'Manpower - Pilots', category: 'Manpower', sortOrder: 45 },
  { id: 'manpower-engineers', name: 'Manpower - Engineers', category: 'Manpower', sortOrder: 46 },
  { id: 'manpower-technicians', name: 'Manpower - Technicians', category: 'Manpower', sortOrder: 47 },
  { id: 'manpower-admin', name: 'Manpower - Administrative', category: 'Manpower', sortOrder: 48 },
  
  // Handling & Permits
  { id: 'handling-permits-landing-fees', name: 'Handling & Permits - Landing Fees', category: 'Handling & Permits', sortOrder: 49 },
  { id: 'handling-permits-parking-fees', name: 'Handling & Permits - Parking Fees', category: 'Handling & Permits', sortOrder: 50 },
  { id: 'handling-permits-overflight', name: 'Handling & Permits - Overflight', category: 'Handling & Permits', sortOrder: 51 },
  { id: 'handling-permits-ground-handling', name: 'Handling & Permits - Ground Handling', category: 'Handling & Permits', sortOrder: 52 },
  
  // Catering
  { id: 'catering-meals', name: 'Catering - Meals', category: 'Catering', sortOrder: 53 },
  { id: 'catering-beverages', name: 'Catering - Beverages', category: 'Catering', sortOrder: 54 },
  { id: 'catering-supplies', name: 'Catering - Supplies', category: 'Catering', sortOrder: 55 },
  
  // Communication
  { id: 'communication-satcom', name: 'Communication - Satcom', category: 'Communication', sortOrder: 56 },
  { id: 'communication-wifi', name: 'Communication - WiFi', category: 'Communication', sortOrder: 57 },
  { id: 'communication-phone', name: 'Communication - Phone', category: 'Communication', sortOrder: 58 },
  
  // Miscellaneous
  { id: 'miscellaneous-office-supplies', name: 'Miscellaneous - Office Supplies', category: 'Miscellaneous', sortOrder: 59 },
  { id: 'miscellaneous-utilities', name: 'Miscellaneous - Utilities', category: 'Miscellaneous', sortOrder: 60 },
  { id: 'miscellaneous-other', name: 'Miscellaneous - Other', category: 'Miscellaneous', sortOrder: 61 },
  
  // Training
  { id: 'training-pilot-recurrent', name: 'Training - Pilot Recurrent', category: 'Training', sortOrder: 62 },
  { id: 'training-pilot-type-rating', name: 'Training - Pilot Type Rating', category: 'Training', sortOrder: 63 },
  { id: 'training-engineer-recurrent', name: 'Training - Engineer Recurrent', category: 'Training', sortOrder: 64 },
  { id: 'training-engineer-type', name: 'Training - Engineer Type', category: 'Training', sortOrder: 65 },
];

export const RSAF_TEMPLATE: BudgetTemplate = {
  type: 'RSAF',
  name: 'RSAF Budget Template',
  spendingTerms: RSAF_SPENDING_TERMS,
  excelStructure: {
    headerRow: 1,
    termColumn: 'A',
    plannedColumns: ['B'],
    actualColumns: ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'], // 12 months
  },
};

export const BUDGET_TEMPLATES: Record<string, BudgetTemplate> = {
  RSAF: RSAF_TEMPLATE,
};
