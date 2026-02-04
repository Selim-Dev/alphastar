/* =========================
   1) DATA MODEL (TypeScript)
   ========================= */

export type AircraftStatus = "ACTIVE" | "PARKED";

export type Aircraft = {
  // Required in instructions (kept required, but allow null where sheet has blanks)
  registration: string;         // e.g. "HZ-SKY4"
  fleetGroup: string;           // e.g. "AIRBUS A320 FAMILY"
  aircraftType: string | null;  // e.g. "A319-115 ACJ"
  msn: string | null;           // e.g. "6727" or "HA-0153"
  owner: string;                // e.g. "Alpha Star Aviation"
  manufacturedDate: string | null; // ISO date "YYYY-MM-DD"
  enginesCount: number;         // e.g. 2
  status: AircraftStatus;       // ACTIVE | PARKED

  // Extra fields present in your data sheet (optional)
  certificationDate?: string | null; // ISO date "YYYY-MM-DD"
  inServiceDate?: string | null;     // ISO date "YYYY-MM-DD"
};


/* ==================================
   2) JSON SCHEMA (for validation)
   ================================== */

export const AircraftJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Aircraft",
  type: "object",
  additionalProperties: false,
  required: [
    "registration",
    "fleetGroup",
    "aircraftType",
    "msn",
    "owner",
    "manufacturedDate",
    "enginesCount",
    "status"
  ],
  properties: {
    registration: { type: "string", minLength: 1 },
    fleetGroup: { type: "string", minLength: 1 },
    aircraftType: { type: ["string", "null"] },
    msn: { type: ["string", "null"] },
    owner: { type: "string", minLength: 1 },

    manufacturedDate: { type: ["string", "null"], format: "date" },

    // optional extra fields
    certificationDate: { type: ["string", "null"], format: "date" },
    inServiceDate: { type: ["string", "null"], format: "date" },

    enginesCount: { type: "number", minimum: 1 },
    status: { type: "string", enum: ["ACTIVE", "PARKED"] }
  }
} as const;


/* =========================
   3) SEED / IMPORT DATA (JSON)
   ========================= */

export const aircraftSeedData: Aircraft[] = [
  {
    "registration": "HZ-A42",
    "fleetGroup": "AIRBUS 340",
    "aircraftType": "A340-642 ACJ",
    "msn": "924",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2008-08-04",
    "certificationDate": null,
    "inServiceDate": "2012-05-25",
    "enginesCount": 4,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SKY1",
    "fleetGroup": "AIRBUS 340",
    "aircraftType": "A340-212 ACJ",
    "msn": "9",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "1993-01-13",
    "inServiceDate": "1993-01-13",
    "enginesCount": 4,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SKY2",
    "fleetGroup": "AIRBUS 330",
    "aircraftType": "A330-243",
    "msn": "1676",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2015-11-16",
    "inServiceDate": "2017-01-31",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SKY4",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": "A319-115 ACJ",
    "msn": "6727",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2015-10-06",
    "inServiceDate": "2016-10-14",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A2",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": "A320-214",
    "msn": "3164",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2007-01-01",
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A3",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": "A320",
    "msn": "764",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A4",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": null,
    "msn": null,
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A5",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": null,
    "msn": null,
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A15",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": null,
    "msn": null,
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A10",
    "fleetGroup": "ATR",
    "aircraftType": "ATR 42-500",
    "msn": "859",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2012-09-28",
    "certificationDate": "2012-09-28",
    "inServiceDate": "2012-09-28",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A11",
    "fleetGroup": "ATR",
    "aircraftType": "ATR 72-212A",
    "msn": "1184",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2014-10-08",
    "certificationDate": "2014-10-08",
    "inServiceDate": "2014-10-08",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A24",
    "fleetGroup": "ATR",
    "aircraftType": "ATR 72-212A",
    "msn": "1541",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2018-12-27",
    "certificationDate": "2018-12-27",
    "inServiceDate": "2018-12-27",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A8",
    "fleetGroup": "HAWKER 900XP",
    "aircraftType": "HAWKER 900XP",
    "msn": "HA-0153",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2009-11-05",
    "certificationDate": "2009-11-05",
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A9",
    "fleetGroup": "HAWKER 900XP",
    "aircraftType": "HAWKER 900XP",
    "msn": "HA-0173",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": "2010-11-28",
    "certificationDate": "2010-10-13",
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A25",
    "fleetGroup": "CITATION LATITUDE",
    "aircraftType": "680A CITATION LATITUDE",
    "msn": "680A-0355",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A26",
    "fleetGroup": "CITATION LATITUDE",
    "aircraftType": "680A CITATION LATITUDE",
    "msn": "680A-0412",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": null,
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A32",
    "fleetGroup": "KING AIR",
    "aircraftType": "SUPER KING AIR B300C",
    "msn": "FM-116",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2024-03-07",
    "inServiceDate": null,
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-A22",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G450",
    "msn": "4064",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2006-11-01",
    "inServiceDate": "2007-02-20",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SK2",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G450",
    "msn": "4067",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2006-12-04",
    "inServiceDate": "2007-04-26",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SK3",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G450",
    "msn": "4073",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2007-02-05",
    "inServiceDate": "2007-05-24",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SK5",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G450",
    "msn": "4007",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2004-11-27",
    "inServiceDate": "2005-06-14",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-SK7",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G450",
    "msn": "4024",
    "owner": "Alpha Star Aviation",
    "manufacturedDate": null,
    "certificationDate": "2005-07-24",
    "inServiceDate": "2005-11-18",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-CMJ",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": "A319-115 ACJ",
    "msn": "4768",
    "owner": "MBF",
    "manufacturedDate": "2011-07-05",
    "certificationDate": null,
    "inServiceDate": "2013-11-01",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-MD6",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G650ER",
    "msn": "6558",
    "owner": "DWA",
    "manufacturedDate": null,
    "certificationDate": "2023-10-31",
    "inServiceDate": "2024-02-22",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "HZ-MD62",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G650ER",
    "msn": "6562",
    "owner": "DWA",
    "manufacturedDate": null,
    "certificationDate": "2023-11-22",
    "inServiceDate": "2024-03-22",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "M-III",
    "fleetGroup": "GULFSTREAM",
    "aircraftType": "G650ER",
    "msn": "6549",
    "owner": "PIF",
    "manufacturedDate": null,
    "certificationDate": "2023-08-08",
    "inServiceDate": "2023-12-05",
    "enginesCount": 2,
    "status": "ACTIVE"
  },
  {
    "registration": "VP-CSN",
    "fleetGroup": "AIRBUS A320 FAMILY",
    "aircraftType": "A319-115 ACJ",
    "msn": "3356",
    "owner": "SBN",
    "manufacturedDate": null,
    "certificationDate": "2008-01-04",
    "inServiceDate": "2009-07-16",
    "enginesCount": 2,
    "status": "ACTIVE"
  }
];
