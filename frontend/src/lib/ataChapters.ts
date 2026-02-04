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
  value: string;
  label: string;
}

/**
 * Complete list of standard ATA chapters
 */
export const ATA_CHAPTERS: ATAChapter[] = [
  { number: 11, title: "Placards and Markings", value: "11", label: "11 - Placards and Markings" },
  { number: 12, title: "Servicing", value: "12", label: "12 - Servicing" },
  { number: 14, title: "Hardware", value: "14", label: "14 - Hardware" },
  { number: 18, title: "Helicopter Vibration", value: "18", label: "18 - Helicopter Vibration" },
  { number: 21, title: "Air Conditioning", value: "21", label: "21 - Air Conditioning" },
  { number: 22, title: "Auto Flight", value: "22", label: "22 - Auto Flight" },
  { number: 23, title: "Communications", value: "23", label: "23 - Communications" },
  { number: 24, title: "Electrical Power", value: "24", label: "24 - Electrical Power" },
  { number: 25, title: "Equipment/Furnishings", value: "25", label: "25 - Equipment/Furnishings" },
  { number: 26, title: "Fire Protection", value: "26", label: "26 - Fire Protection" },
  { number: 27, title: "Flight Controls", value: "27", label: "27 - Flight Controls" },
  { number: 28, title: "Fuel", value: "28", label: "28 - Fuel" },
  { number: 29, title: "Hydraulic Power", value: "29", label: "29 - Hydraulic Power" },
  { number: 30, title: "Ice and Rain Protection", value: "30", label: "30 - Ice and Rain Protection" },
  { number: 31, title: "Instruments", value: "31", label: "31 - Instruments" },
  { number: 32, title: "Landing Gear", value: "32", label: "32 - Landing Gear" },
  { number: 33, title: "Lights", value: "33", label: "33 - Lights" },
  { number: 34, title: "Navigation", value: "34", label: "34 - Navigation" },
  { number: 35, title: "Oxygen", value: "35", label: "35 - Oxygen" },
  { number: 36, title: "Pneumatic", value: "36", label: "36 - Pneumatic" },
  { number: 37, title: "Vacuum", value: "37", label: "37 - Vacuum" },
  { number: 38, title: "Water/Waste", value: "38", label: "38 - Water/Waste" },
  { number: 45, title: "Central Maintenance System", value: "45", label: "45 - Central Maintenance System" },
  { number: 49, title: "Airborne Auxiliary Power", value: "49", label: "49 - Airborne Auxiliary Power" },
  { number: 51, title: "Standard Practices/Structures", value: "51", label: "51 - Standard Practices/Structures" },
  { number: 52, title: "Doors", value: "52", label: "52 - Doors" },
  { number: 53, title: "Fuselage", value: "53", label: "53 - Fuselage" },
  { number: 54, title: "Nacelles/Pylons", value: "54", label: "54 - Nacelles/Pylons" },
  { number: 55, title: "Stabilizers", value: "55", label: "55 - Stabilizers" },
  { number: 56, title: "Windows", value: "56", label: "56 - Windows" },
  { number: 57, title: "Wings", value: "57", label: "57 - Wings" },
  { number: 61, title: "Propellers/Propulsors", value: "61", label: "61 - Propellers/Propulsors" },
  { number: 62, title: "Main Rotor", value: "62", label: "62 - Main Rotor" },
  { number: 63, title: "Main Rotor Drive", value: "63", label: "63 - Main Rotor Drive" },
  { number: 64, title: "Tail Rotor", value: "64", label: "64 - Tail Rotor" },
  { number: 65, title: "Tail Rotor Drive", value: "65", label: "65 - Tail Rotor Drive" },
  { number: 67, title: "Rotors Flight Control", value: "67", label: "67 - Rotors Flight Control" },
  { number: 71, title: "PowerPlant", value: "71", label: "71 - PowerPlant" },
  { number: 72, title: "Turbine/Turboprop Engine", value: "72", label: "72 - Turbine/Turboprop Engine" },
  { number: 73, title: "Engine Fuel and Control", value: "73", label: "73 - Engine Fuel and Control" },
  { number: 74, title: "Ignition", value: "74", label: "74 - Ignition" },
  { number: 75, title: "Air", value: "75", label: "75 - Air" },
  { number: 76, title: "Engine Controls", value: "76", label: "76 - Engine Controls" },
  { number: 77, title: "Engine Indicating", value: "77", label: "77 - Engine Indicating" },
  { number: 78, title: "Engine Exhaust", value: "78", label: "78 - Engine Exhaust" },
  { number: 79, title: "Engine Oil", value: "79", label: "79 - Engine Oil" },
  { number: 80, title: "Starting", value: "80", label: "80 - Starting" },
  { number: 81, title: "Turbocharging", value: "81", label: "81 - Turbocharging" },
  { number: 82, title: "Water Injection", value: "82", label: "82 - Water Injection" },
  { number: 83, title: "Accessory Gearboxes", value: "83", label: "83 - Accessory Gearboxes" },
  { number: 85, title: "Reciprocating Engine", value: "85", label: "85 - Reciprocating Engine" },
];

/**
 * Get ATA chapter description by chapter number
 */
export function getATAChapterDescription(chapter: string): string {
  const found = ATA_CHAPTERS.find((c) => c.value === chapter);
  return found ? found.label : `ATA ${chapter}`;
}

/**
 * Get ATA chapter title only (without number prefix)
 */
export function getATAChapterTitle(chapter: string): string {
  const found = ATA_CHAPTERS.find((c) => c.value === chapter);
  return found ? found.title : `Chapter ${chapter}`;
}

/**
 * Validate if a chapter number is a valid ATA chapter
 */
export function isValidATAChapter(chapter: string): boolean {
  return ATA_CHAPTERS.some((c) => c.value === chapter);
}

/**
 * Get ATA chapters as simple value/label pairs for dropdowns
 */
export function getATAChapterOptions(): Array<{ value: string; label: string }> {
  return ATA_CHAPTERS.map((c) => ({ value: c.value, label: c.label }));
}

/**
 * Most commonly used ATA chapters for quick access
 * (Based on typical maintenance operations)
 */
export const COMMON_ATA_CHAPTERS = [
  { value: '21', label: '21 - Air Conditioning' },
  { value: '22', label: '22 - Auto Flight' },
  { value: '23', label: '23 - Communications' },
  { value: '24', label: '24 - Electrical Power' },
  { value: '25', label: '25 - Equipment/Furnishings' },
  { value: '26', label: '26 - Fire Protection' },
  { value: '27', label: '27 - Flight Controls' },
  { value: '28', label: '28 - Fuel' },
  { value: '29', label: '29 - Hydraulic Power' },
  { value: '30', label: '30 - Ice and Rain Protection' },
  { value: '31', label: '31 - Instruments' },
  { value: '32', label: '32 - Landing Gear' },
  { value: '33', label: '33 - Lights' },
  { value: '34', label: '34 - Navigation' },
  { value: '36', label: '36 - Pneumatic' },
  { value: '49', label: '49 - Airborne Auxiliary Power' },
  { value: '52', label: '52 - Doors' },
  { value: '71', label: '71 - PowerPlant' },
  { value: '72', label: '72 - Turbine/Turboprop Engine' },
  { value: '73', label: '73 - Engine Fuel and Control' },
  { value: '74', label: '74 - Ignition' },
  { value: '78', label: '78 - Engine Exhaust' },
  { value: '79', label: '79 - Engine Oil' },
  { value: '80', label: '80 - Starting' },
];
