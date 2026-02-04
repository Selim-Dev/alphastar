/**
 * Standard ATA (Air Transport Association) Chapter Codes
 * 
 * ATA chapters are the standard categorization system used in aviation
 * for organizing aircraft systems and maintenance documentation.
 * 
 * Reference: ATA Spec 100 (iSpec 2200)
 */

export interface ATAChapter {
  number: number;
  title: string;
  code: string;
}

/**
 * Complete list of standard ATA chapters
 */
export const ATA_CHAPTERS: ATAChapter[] = [
  { number: 11, title: 'Placards and Markings', code: '11' },
  { number: 12, title: 'Servicing', code: '12' },
  { number: 14, title: 'Hardware', code: '14' },
  { number: 18, title: 'Helicopter Vibration', code: '18' },
  { number: 21, title: 'Air Conditioning', code: '21' },
  { number: 22, title: 'Auto Flight', code: '22' },
  { number: 23, title: 'Communications', code: '23' },
  { number: 24, title: 'Electrical Power', code: '24' },
  { number: 25, title: 'Equipment/Furnishings', code: '25' },
  { number: 26, title: 'Fire Protection', code: '26' },
  { number: 27, title: 'Flight Controls', code: '27' },
  { number: 28, title: 'Fuel', code: '28' },
  { number: 29, title: 'Hydraulic Power', code: '29' },
  { number: 30, title: 'Ice and Rain Protection', code: '30' },
  { number: 31, title: 'Instruments', code: '31' },
  { number: 32, title: 'Landing Gear', code: '32' },
  { number: 33, title: 'Lights', code: '33' },
  { number: 34, title: 'Navigation', code: '34' },
  { number: 35, title: 'Oxygen', code: '35' },
  { number: 36, title: 'Pneumatic', code: '36' },
  { number: 37, title: 'Vacuum', code: '37' },
  { number: 38, title: 'Water/Waste', code: '38' },
  { number: 45, title: 'Central Maintenance System', code: '45' },
  { number: 49, title: 'Airborne Auxiliary Power', code: '49' },
  { number: 51, title: 'Standard Practices/Structures', code: '51' },
  { number: 52, title: 'Doors', code: '52' },
  { number: 53, title: 'Fuselage', code: '53' },
  { number: 54, title: 'Nacelles/Pylons', code: '54' },
  { number: 55, title: 'Stabilizers', code: '55' },
  { number: 56, title: 'Windows', code: '56' },
  { number: 57, title: 'Wings', code: '57' },
  { number: 61, title: 'Propellers/Propulsors', code: '61' },
  { number: 62, title: 'Main Rotor', code: '62' },
  { number: 63, title: 'Main Rotor Drive', code: '63' },
  { number: 64, title: 'Tail Rotor', code: '64' },
  { number: 65, title: 'Tail Rotor Drive', code: '65' },
  { number: 67, title: 'Rotors Flight Control', code: '67' },
  { number: 71, title: 'PowerPlant', code: '71' },
  { number: 72, title: 'Turbine/Turboprop Engine', code: '72' },
  { number: 73, title: 'Engine Fuel and Control', code: '73' },
  { number: 74, title: 'Ignition', code: '74' },
  { number: 75, title: 'Air', code: '75' },
  { number: 76, title: 'Engine Controls', code: '76' },
  { number: 77, title: 'Engine Indicating', code: '77' },
  { number: 78, title: 'Engine Exhaust', code: '78' },
  { number: 79, title: 'Engine Oil', code: '79' },
  { number: 80, title: 'Starting', code: '80' },
  { number: 81, title: 'Turbocharging', code: '81' },
  { number: 82, title: 'Water Injection', code: '82' },
  { number: 83, title: 'Accessory Gearboxes', code: '83' },
  { number: 85, title: 'Reciprocating Engine', code: '85' },
];

/**
 * Get ATA chapter codes only (for validation and seeding)
 */
export const ATA_CHAPTER_CODES = ATA_CHAPTERS.map((c) => c.code);

/**
 * Most commonly used ATA chapters for seeding and demo data
 */
export const COMMON_ATA_CHAPTER_CODES = [
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '36', '49', '52', '71', '72', '73',
  '74', '78', '79', '80',
];

/**
 * Get ATA chapter description by code
 */
export function getATAChapterDescription(code: string): string {
  const found = ATA_CHAPTERS.find((c) => c.code === code);
  return found ? `${code} - ${found.title}` : `ATA ${code}`;
}

/**
 * Validate if a code is a valid ATA chapter
 */
export function isValidATAChapter(code: string): boolean {
  return ATA_CHAPTER_CODES.includes(code);
}
