import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

// ============================================================
// PRODUCT DATA
// ============================================================
const products = [
  {
    name: "Hydra Retractable Patio Cover",
    pricingModel: "matrix",
    prices: {
      6:  {8:7150,9:7645,10:8140,11:8635,12:9130,13:9625,14:10120,15:10615,16:11110,17:11605,18:12100,19:12595,20:13090},
      7:  {8:7453,9:7948,10:8443,11:8938,12:9433,13:9928,14:10423,15:10918,16:11413,17:11908,18:12403,19:12898,20:13393},
      8:  {8:7755,9:8250,10:8745,11:9240,12:9735,13:10230,14:10725,15:11220,16:11715,17:12210,18:12705,19:13200,20:13695},
      9:  {8:8058,9:8553,10:9048,11:9543,12:10038,13:10533,14:11028,15:11523,16:12018,17:12513,18:13008,19:13503,20:13998},
      10: {8:8360,9:8855,10:9350,11:9845,12:10340,13:10835,14:11330,15:11825,16:12320,17:12815,18:13310,19:13805,20:14300},
      11: {8:8663,9:9158,10:9653,11:10148,12:10643,13:11138,14:11633,15:12128,16:12623,17:13118,18:13613,19:14108,20:14603},
      12: {8:8965,9:9460,10:9955,11:10450,12:10945,13:11440,14:11935,15:12430,16:12925,17:13420,18:13915,19:14410,20:14905},
      13: {8:9268,9:9763,10:10258,11:10753,12:11248,13:11743,14:12238,15:12733,16:13228,17:13723,18:14218,19:14713,20:15208},
      14: {8:9570,9:10065,10:10560,11:11055,12:11550,13:12045,14:12540,15:13035,16:13530,17:14025,18:14520,19:15015,20:15510},
      15: {8:9873,9:10368,10:10863,11:11358,12:11853,13:12348,14:12843,15:13338,16:13833,17:14328,18:14823,19:15318,20:15813},
      16: {8:10175,9:10670,10:11165,11:11660,12:12155,13:12650,14:13145,15:13640,16:14135,17:14630,18:15125,19:15620,20:16115}
    }
  },
  {
    name: "Motorized Power Screen 5in Cassette",
    pricingModel: "matrix",
    prices: {
      4:  {4:3000,5:3120,6:3240,7:3360,8:3480,9:3600,10:3720,11:3840,12:3960,13:4080,14:4200,15:4320,16:4440,17:4560,18:4680,19:4800,20:4920},
      5:  {4:3120,5:3240,6:3360,7:3480,8:3600,9:3720,10:3840,11:3960,12:4080,13:4200,14:4320,15:4440,16:4560,17:4680,18:4800,19:4920,20:5040},
      6:  {4:3240,5:3360,6:3480,7:3600,8:3720,9:3840,10:3960,11:4080,12:4200,13:4320,14:4440,15:4560,16:4680,17:4800,18:4920,19:5040,20:5160},
      7:  {4:3360,5:3480,6:3600,7:3720,8:3840,9:3960,10:4080,11:4200,12:4320,13:4440,14:4560,15:4680,16:4800,17:4920,18:5040,19:5160,20:5280},
      8:  {4:3480,5:3600,6:3720,7:3840,8:3960,9:4080,10:4200,11:4320,12:4440,13:4560,14:4680,15:4800,16:4920,17:5040,18:5160,19:5280,20:5400},
      9:  {4:3600,5:3720,6:3840,7:3960,8:4080,9:4200,10:4320,11:4440,12:4560,13:4680,14:4800,15:4920,16:5040,17:5160,18:5280,19:5400,20:5520},
      10: {4:3720,5:3840,6:3960,7:4080,8:4200,9:4320,10:4440,11:4560,12:4680,13:4800,14:4920,15:5040,16:5160,17:5280,18:5400,19:5520,20:5640}
    }
  },
  {
    name: "Motorized Power Screen 6in Cassette",
    pricingModel: "matrix",
    prices: {
      4:  {3:3143,4:3375,5:3607,6:3839,7:4071,8:4303,9:4535,10:4767,11:4999,12:5231,13:5463,14:5695,15:5927,16:6159,17:6391,18:6623,19:6855,20:7088,21:7320,22:7552,23:7784,24:8016,25:8248,26:8480},
      5:  {3:3375,4:3607,5:3839,6:4071,7:4303,8:4535,9:4767,10:4999,11:5231,12:5463,13:5695,14:5927,15:6159,16:6391,17:6623,18:6855,19:7088,20:7320,21:7552,22:7784,23:8016,24:8248,25:8480,26:8712},
      6:  {3:3607,4:3839,5:4071,6:4303,7:4535,8:4767,9:4999,10:5231,11:5463,12:5695,13:5927,14:6159,15:6391,16:6623,17:6855,18:7088,19:7320,20:7552,21:7784,22:8016,23:8248,24:8480,25:8712,26:8944},
      7:  {3:3839,4:4071,5:4303,6:4535,7:4767,8:4999,9:5231,10:5463,11:5695,12:5927,13:6159,14:6391,15:6623,16:6855,17:7088,18:7320,19:7552,20:7784,21:8016,22:8248,23:8480,24:8712,25:8944,26:9176},
      8:  {3:4071,4:4303,5:4535,6:4767,7:4999,8:5231,9:5463,10:5695,11:5927,12:6159,13:6391,14:6623,15:6855,16:7088,17:7320,18:7552,19:7784,20:8016,21:8248,22:8480,23:8712,24:8944,25:9176,26:9408},
      9:  {3:4303,4:4535,5:4767,6:4999,7:5231,8:5463,9:5695,10:5927,11:6159,12:6391,13:6623,14:6855,15:7088,16:7320,17:7552,18:7784,19:8016,20:8248,21:8480,22:8712,23:8944,24:9176,25:9408,26:9640},
      10: {3:4535,4:4767,5:4999,6:5231,7:5463,8:5695,9:5927,10:6159,11:6391,12:6623,13:6855,14:7088,15:7320,16:7552,17:7784,18:8016,19:8248,20:8480,21:8712,22:8944,23:9176,24:9408,25:9640,26:9872},
      11: {3:4767,4:4999,5:5231,6:5463,7:5695,8:5927,9:6159,10:6391,11:6623,12:6855,13:7088,14:7320,15:7552,16:7784,17:8016,18:8248,19:8480,20:8712,21:8944,22:9176,23:9408,24:9640,25:9872,26:10104},
      12: {3:4999,4:5231,5:5463,6:5695,7:5927,8:6159,9:6391,10:6623,11:6855,12:7088,13:7320,14:7552,15:7784,16:8016,17:8248,18:8480,19:8712,20:8944,21:9176,22:9408,23:9640,24:9872,25:10104,26:10336},
      13: {3:5231,4:5463,5:5695,6:5927,7:6159,8:6391,9:6623,10:6855,11:7088,12:7320,13:7552,14:7784,15:8016,16:8248,17:8480,18:8712,19:8944,20:9176,21:9408,22:9640,23:9872,24:10104,25:10336,26:10568},
      14: {3:5463,4:5695,5:5927,6:6159,7:6391,8:6623,9:6855,10:7088,11:7320,12:7552,13:7784,14:8016,15:8248,16:8480,17:8712,18:8944,19:9176,20:9408,21:9640,22:9872,23:10104,24:10336,25:10568,26:10800},
      15: {3:5695,4:5927,5:6159,6:6391,7:6623,8:6855,9:7088,10:7320,11:7552,12:7784,13:8016,14:8248,15:8480,16:8712,17:8944,18:9176,19:9408,20:9640,21:9872,22:10104,23:10336,24:10568,25:10800,26:11032},
      16: {3:5927,4:6159,5:6391,6:6623,7:6855,8:7088,9:7320,10:7552,11:7784,12:8016,13:8248,14:8480,15:8712,16:8944,17:9176,18:9408,19:9640,20:9872,21:10104,22:10336,23:10568,24:10800,25:11032,26:11264},
      17: {3:6159,4:6391,5:6623,6:6855,7:7088,8:7320,9:7552,10:7784,11:8016,12:8248,13:8480,14:8712,15:8944,16:9176,17:9408,18:9640,19:9872,20:10104,21:10336,22:10568,23:10800,24:11032,25:11264,26:11496},
      18: {3:6391,4:6623,5:6855,6:7088,7:7320,8:7552,9:7784,10:8016,11:8248,12:8480,13:8712,14:8944,15:9176,16:9408,17:9640,18:9872,19:10104,20:10336,21:10568,22:10800,23:11032,24:11264,25:11496,26:11729}
    }
  },
  {
    name: "Motorized Power Screen open roll",
    pricingModel: "matrix",
    prices: {
      4:  {3:1935,4:2040,5:2145,6:2250,7:2355,8:2460,9:2565,10:2670,11:2775,12:2880,13:2985,14:3090,15:3195,16:3300,17:3405,18:3510,19:3615,20:3720,21:3825,22:3930,23:4035,24:4140,25:4245,26:4350},
      5:  {3:2040,4:2145,5:2250,6:2355,7:2460,8:2565,9:2670,10:2775,11:2880,12:2985,13:3090,14:3195,15:3300,16:3405,17:3510,18:3615,19:3720,20:3825,21:3930,22:4035,23:4140,24:4245,25:4350,26:4455},
      6:  {3:2145,4:2250,5:2355,6:2460,7:2565,8:2670,9:2775,10:2880,11:2985,12:3090,13:3195,14:3300,15:3405,16:3510,17:3615,18:3720,19:3825,20:3930,21:4035,22:4140,23:4245,24:4350,25:4455,26:4560},
      7:  {3:2250,4:2355,5:2460,6:2565,7:2670,8:2775,9:2880,10:2985,11:3090,12:3195,13:3300,14:3405,15:3510,16:3615,17:3720,18:3825,19:3930,20:4035,21:4140,22:4245,23:4350,24:4455,25:4560,26:4665},
      8:  {3:2355,4:2460,5:2565,6:2670,7:2775,8:2880,9:2985,10:3090,11:3195,12:3300,13:3405,14:3510,15:3615,16:3720,17:3825,18:3930,19:4035,20:4140,21:4245,22:4350,23:4455,24:4560,25:4665,26:4770},
      9:  {3:2460,4:2565,5:2670,6:2775,7:2880,8:2985,9:3090,10:3195,11:3300,12:3405,13:3510,14:3615,15:3720,16:3825,17:3930,18:4035,19:4140,20:4245,21:4350,22:4455,23:4560,24:4665,25:4770,26:4875},
      10: {3:2565,4:2670,5:2775,6:2880,7:2985,8:3090,9:3195,10:3300,11:3405,12:3510,13:3615,14:3720,15:3825,16:3930,17:4035,18:4140,19:4245,20:4350,21:4455,22:4560,23:4665,24:4770,25:4875,26:4980},
      11: {3:2670,4:2775,5:2880,6:2985,7:3090,8:3195,9:3300,10:3405,11:3510,12:3615,13:3720,14:3825,15:3930,16:4035,17:4140,18:4245,19:4350,20:4455,21:4560,22:4665,23:4770,24:4875,25:4980,26:5085},
      12: {3:2775,4:2880,5:2985,6:3090,7:3195,8:3300,9:3405,10:3510,11:3615,12:3720,13:3825,14:3930,15:4035,16:4140,17:4245,18:4350,19:4455,20:4560,21:4665,22:4770,23:4875,24:4980,25:5085,26:5190},
      13: {3:2880,4:2985,5:3090,6:3195,7:3300,8:3405,9:3510,10:3615,11:3720,12:3825,13:3930,14:4035,15:4140,16:4245,17:4350,18:4455,19:4560,20:4665,21:4770,22:4875,23:4980,24:5085,25:5190,26:5295},
      14: {3:2985,4:3090,5:3195,6:3300,7:3405,8:3510,9:3615,10:3720,11:3825,12:3930,13:4035,14:4140,15:4245,16:4350,17:4455,18:4560,19:4665,20:4770,21:4875,22:4980,23:5085,24:5190,25:5295,26:5400},
      15: {3:3090,4:3195,5:3300,6:3405,7:3510,8:3615,9:3720,10:3825,11:3930,12:4035,13:4140,14:4245,15:4350,16:4455,17:4560,18:4665,19:4770,20:4875,21:4980,22:5085,23:5190,24:5295,25:5400,26:5505},
      16: {3:3195,4:3300,5:3405,6:3510,7:3615,8:3720,9:3825,10:3930,11:4035,12:4140,13:4245,14:4350,15:4455,16:4560,17:4665,18:4770,19:4875,20:4980,21:5085,22:5190,23:5295,24:5400,25:5505,26:5610},
      17: {3:3300,4:3405,5:3510,6:3615,7:3720,8:3825,9:3930,10:4035,11:4140,12:4245,13:4350,14:4455,15:4560,16:4665,17:4770,18:4875,19:4980,20:5085,21:5190,22:5295,23:5400,24:5505,25:5610,26:5715},
      18: {3:3405,4:3510,5:3615,6:3720,7:3825,8:3930,9:4035,10:4140,11:4245,12:4350,13:4455,14:4560,15:4665,16:4770,17:4875,18:4980,19:5085,20:5190,21:5295,22:5400,23:5505,24:5610,25:5715,26:5820}
    }
  },
  {
    name: "Vista View Single Housing Unit",
    pricingModel: "matrix",
    dimensionUnit: "in",
    prices: {
      84:  {72:2950,96:3050,108:3150,120:3250,132:3350,144:3450,156:3550,168:3650,180:4850,192:4950,204:5050,228:5150,240:5250,252:5350,264:5450,276:5550},
      96:  {72:3050,96:3150,108:3250,120:3350,132:3450,144:3550,156:3650,168:3750,180:4950,192:5050,204:5150,228:5250,240:5350,252:5450,264:5550,276:5650},
      108: {72:3150,96:3250,108:3350,120:3450,132:3550,144:3650,156:3750,168:3850,180:5050,192:5150,204:5250,228:5350,240:5450,252:5550,264:5650,276:5750},
      120: {72:3250,96:3350,108:3450,120:3550,132:3650,144:3750,156:3850,168:3950,180:5150,192:5250,204:5350,228:5450,240:5550,252:5650,264:5750,276:5850},
      135: {72:3350,96:3450,108:3550,120:3650,132:3750,144:3850,156:3950,168:4050,180:5250,192:5350,204:5450,228:5550,240:5650,252:5750,264:5850,276:5950}
    }
  },
  {
    name: "Vista View Double Housing Units",
    pricingModel: "matrix",
    dimensionUnit: "in",
    prices: {
      84:  {192:5350,216:5450,240:5550,264:5650,288:5750,312:5850,336:5950},
      96:  {192:5450,216:5550,240:5650,264:5750,288:5850,312:5950,336:6050},
      108: {192:5550,216:5650,240:5750,264:5850,288:5950,312:6050,336:6150},
      120: {192:5650,216:5750,240:5850,264:5950,288:6050,312:6150,336:6250},
      135: {192:5750,216:5850,240:5950,264:6050,288:6150,312:6250,336:6350}
    }
  },
  {
    name: "Single Horizon View Retractable Screens",
    pricingModel: "matrix",
    dimensionUnit: "in",
    prices: {
      84:  {72:4250,84:4350,96:4450,108:4550,120:4650,132:4750,144:4850,156:4950,168:5050,180:5150,192:5500,204:5750,216:5900,228:6050,240:6200,252:6350},
      96:  {72:4500,84:4600,96:4700,108:4800,120:4900,132:5000,144:5100,156:5200,168:5300,180:5400,192:5750,204:5900,216:6150,228:6250,240:6450,252:6500},
      108: {72:4750,84:4850,96:4950,108:5050,120:5150,132:5250,144:5350,156:5450,168:5550,180:5650,192:6000,204:6250,216:6400,228:6550,240:6650,252:6850},
      120: {72:5000,84:5100,96:5200,108:5300,120:5400,132:5500,144:5600,156:5700,168:5800,180:5900,192:6250,204:6450,216:6650,228:6850,240:7000,252:7200},
      132: {72:5250,84:5350,96:5450,108:5550,120:5650,132:5750,144:5850,156:5950,168:6050,180:6150,192:6500,204:6700,216:6900,228:7100,240:7300,252:7500}
    }
  },
  {
    name: "Clearview Retractable Screen Doors",
    pricingModel: "matrix",
    dimensionUnit: "in",
    prices: {
      48: {98:695},
      60: {98:545},
      68: {98:895},
      96: {98:1390}
    }
  },
  {
    name: "Clearview Oversized Doors",
    pricingModel: "matrix",
    dimensionUnit: "in",
    prices: {
      55: {120:895},
      68: {120:1295},
      136: {98:1695, 120:2095}
    }
  },
  {
    name: "Duralum Solid Patio Cover",
    pricingModel: "tier_per_sqft",
    tiers: [
      {minSqft:0,   maxSqft:200, rate:40},
      {minSqft:201, maxSqft:400, rate:35},
      {minSqft:401, maxSqft:Infinity, rate:30}
    ]
  },
  {
    name: "Motorized Louvered Roof Pergolas",
    pricingModel: "tier_per_sqft",
    tiers: [
      {minSqft:0,   maxSqft:200, rate:160},
      {minSqft:201, maxSqft:400, rate:150},
      {minSqft:401, maxSqft:Infinity, rate:140}
    ]
  },
  {
    name: "Motorized Canvas Roof Pergolas",
    pricingModel: "tier_per_sqft",
    tiers: [
      {minSqft:0,   maxSqft:200, rate:160},
      {minSqft:201, maxSqft:400, rate:150},
      {minSqft:401, maxSqft:Infinity, rate:140}
    ]
  },
  {
    name: "Slide on Wire Shades",
    pricingModel: "tier_per_sqft",
    tiers: [
      {minSqft:0,  maxSqft:42, rate:100},
      {minSqft:43, maxSqft:60, rate:125}
    ]
  },
  // ── CHANGE 1: Skyline MRA — combined Motor A + Motor B QIP Square Box ──
  // Pricing is the full merged table (Motor A rows 7–12, Motor B rows 13–20)
  {
    name: "Skyline Motorized Retractable Awning",
    pricingModel: "mra_configured",  // handled in ProductSummary like MPS
  },
  // ── CHANGE 2: Open Roll MRA — combined Motor A + Motor B Open Roll ──
  {
    name: "Open Roll Motorized Retractable Awning",
    pricingModel: "mra_configured",  // handled in ProductSummary like MPS
  },
  // Keep Skylight Plus MRA (Motor B Retractable Awning) as before
  {
    name: "Skylight Plus MRA",
    pricingModel: "mra_configured",
  },
];

const productCatalog = {
  "Retractable Roof Pergolas/DURALUM": [
    "Hydra Retractable Patio Cover","Duralum Solid Patio Cover",
    "Motorized Louvered Roof Pergolas","Motorized Canvas Roof Pergolas","Slide on Wire Shades"
  ],
  "Retractable Screens/MPS": [
    "Motorized Power Screen 5in Cassette","Motorized Power Screen 6in Cassette",
    "Motorized Power Screen open roll","Vista View Single Housing Unit","Vista View Double Housing Units",
    "Single Horizon View Retractable Screens","Clearview Retractable Screen Doors","Clearview Oversized Doors"
  ],
  "Retractable Awnings": [
    // CHANGE 1 & 2: Replaced separate Motor A/B products with unified products
    "Skylight Plus MRA",
    "Skyline Motorized Retractable Awning",
    "Open Roll Motorized Retractable Awning",
  ]
};

// ── Products that are configured per-opening in ProductSummary (no width/height on intake form) ──
const MPS_PRODUCTS = [
  "Motorized Power Screen 5in Cassette",
  "Motorized Power Screen 6in Cassette",
  "Motorized Power Screen open roll",
];

// ── Awning products that are fully configured in ProductSummary (like MPS — no width/height on intake) ──
// CHANGE 3: Skyline MRA and Open Roll MRA skip width/projection on intake form
const MRA_CONFIGURED_PRODUCTS = [
  "Skylight Plus MRA",
  "Skyline Motorized Retractable Awning",
  "Open Roll Motorized Retractable Awning",
];

// Combined: all products that skip width/height on intake form
const SUMMARY_CONFIGURED_PRODUCTS = [...MPS_PRODUCTS, ...MRA_CONFIGURED_PRODUCTS];

const mountTypes = ['Inside Mount','Outside Mount','Ceiling Mount','Wall Mount'];
const fabrics = ['Light Filtering','Room Darkening','Blackout','Sheer','Solar Screen','Canvas','Wood','Faux Wood'];
const colorOptions = ['White','Ivory','Beige','Gray','Black','Brown','Custom'];
const addOns = [
  {name:'Motorization', price:250},
  {name:'Remote Control', price:75},
  {name:'Smart Home Integration', price:150},
  {name:'Decorative Valance', price:100},
  {name:'Cordless Lift', price:50},
  {name:'Premium Fabric Upgrade', price:125}
];

// ============================================================
// SESSION STORAGE KEY
// ============================================================
const SESSION_KEY = 'retail_intake_form_data';

// ============================================================
// PRICING HELPERS
// ============================================================
function feetInchesToInches(input) {
  if (typeof input === "number") return input;
  const s = String(input).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n > 30 ? Math.round(n) : Math.round(n * 12);
  }
  const m = s.match(/(\d+)\s*(?:'|ft|-)\s*(\d+)?/i);
  if (!m) return null;
  return parseInt(m[1], 10) * 12 + (m[2] ? parseInt(m[2], 10) : 0);
}

function toFeetKey(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const feet = n > 30 ? n / 12 : n;
  return Math.ceil(feet);
}

function toFeetNumber(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 30 ? n / 12 : n;
}

function findProduct(productName) {
  return products.find(p => p.name === productName) || null;
}

function getTierRate(tiers, sqft) {
  if (!Array.isArray(tiers)) return null;
  const t = tiers.find(x => sqft >= x.minSqft && sqft <= x.maxSqft);
  return t ? t.rate : null;
}

function getBasePriceUnified(line) {
  const p = findProduct(line.product);
  if (!p) return {ok:false, price:0, message:"Select a product."};

  // MRA configured products are priced in ProductSummary — not here
  if (p.pricingModel === "mra_configured") {
    return {ok:true, price:0, message:"Configured in Product Summary screen."};
  }

  if (p.pricingModel === "matrix") {
    let widthKey, projectionKey, unitLabel;
    if (p.dimensionUnit === "in") {
      widthKey = parseInt(line.width, 10);
      projectionKey = parseInt(line.height, 10);
      unitLabel = "in";
      if (!widthKey || !projectionKey || isNaN(widthKey) || isNaN(projectionKey))
        return {ok:false, price:0, message:"Enter valid width and height in inches (e.g. 96 and 84)."};
    } else {
      widthKey = toFeetKey(line.width);
      projectionKey = toFeetKey(line.height);
      unitLabel = "ft";
      if (!widthKey || !projectionKey)
        return {ok:false, price:0, message:"Enter valid width and projection."};
    }
    const base = p?.prices?.[projectionKey]?.[widthKey] ?? null;
    if (base == null)
      return {ok:false, price:0, message:`No matrix price for Width=${widthKey}${unitLabel}, Height=${projectionKey}${unitLabel}.`};
    return {ok:true, price:Number(base), message:`Matrix price: $${base} (Width=${widthKey}${unitLabel}, Height=${projectionKey}${unitLabel})`};
  }

  if (p.pricingModel === "tier_per_sqft") {
    let sqft = parseFloat(line.sqft);
    if (!Number.isFinite(sqft) || sqft <= 0) {
      const wFt = toFeetNumber(line.width);
      const hFt = toFeetNumber(line.height);
      if (wFt && hFt) sqft = wFt * hFt;
    }
    if (!Number.isFinite(sqft) || sqft <= 0)
      return {ok:false, price:0, message:"Enter sqft or width + projection."};
    const rate = getTierRate(p.tiers, sqft);
    if (rate == null)
      return {ok:false, price:0, message:`No tier rate found for ${sqft.toFixed(2)} sqft.`};
    const base = sqft * rate;
    return {ok:true, price:base, message:`${sqft.toFixed(2)} sqft × $${rate}/sqft = $${base.toFixed(2)}`};
  }

  if (p.pricingModel === "matrix_axes") {
    const widthKey = toFeetKey(line.width);
    const projIn = feetInchesToInches(line.height);
    if (!widthKey || !projIn)
      return {ok:false, price:0, message:'Enter valid width and projection (e.g. 14 and 4\'11").'};
    const base = p?.prices?.[projIn]?.[widthKey] ?? null;
    if (base == null)
      return {ok:false, price:0, message:`No price for Width=${widthKey}ft, Projection=${projIn}in.`};
    return {ok:true, price:Number(base), message:`Matrix price: $${base} (Width=${widthKey}ft, Projection=${projIn}in)`};
  }

  return {ok:false, price:0, message:"Unsupported pricing model."};
}

function calcLineTotal(line) {
  if (!line.category || !line.product) return 0;
  // Summary-configured products are priced on the next screen
  if (SUMMARY_CONFIGURED_PRODUCTS.includes(line.product)) return 0;
  const base = getBasePriceUnified(line);
  if (!base.ok) return 0;
  let total = base.price * (parseInt(line.quantity, 10) || 1);
  if (line.operation === 'motorized') total += 250 * (parseInt(line.quantity, 10) || 1);
  line.addons.forEach((checked, idx) => {
    if (checked) total += addOns[idx].price * (parseInt(line.quantity, 10) || 1);
  });
  return total;
}

// ============================================================
// PRODUCT LINE COMPONENT
// ============================================================
function ProductLine({ line, lineNumber, onUpdate, onRemove, showRemove }) {
  const p = findProduct(line.product);
  const isSummaryConfigure = SUMMARY_CONFIGURED_PRODUCTS.includes(line.product);

  const baseResult = (line.category && line.product && !isSummaryConfigure) ? getBasePriceUnified(line) : null;
  const lineTotal  = line.category && line.product ? calcLineTotal(line) : 0;

  let badgeClass = '';
  let badgeText  = 'Not Configured';
  if (line.category && line.product) {
    if (isSummaryConfigure) {
      badgeClass = 'configured';
      badgeText  = 'Configured on next screen';
    } else if (baseResult && baseResult.ok) {
      badgeClass = 'configured';
      badgeText  = 'Configured';
    } else {
      badgeClass = 'invalid';
      badgeText  = 'Invalid Size';
    }
  }

  const widthLabel  = p?.pricingModel === 'matrix_axes' ? 'Width (ft)' : p?.dimensionUnit === 'in' ? 'Width (inches)' : 'Width';
  const heightLabel = p?.pricingModel === 'matrix_axes' ? "Projection (4' 11\" or inches)" : p?.dimensionUnit === 'in' ? 'Height (inches)' : 'Projection or Height';

  return (
    <div className="product-line">
      <div className="product-line-header">
        <div className="product-line-title">
          Product #{lineNumber}
          <span className={`badge ${badgeClass}`}>{badgeText}</span>
        </div>
        {showRemove && (
          <button type="button" className="remove-product" onClick={onRemove}>Remove</button>
        )}
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="required">Product Category</label>
          <select value={line.category} onChange={e => onUpdate({...line, category:e.target.value, product:''})}>
            <option value="">Select Category</option>
            {Object.keys(productCatalog).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Window Coverings">Window Coverings</option>
          </select>
        </div>
        <div className="form-group">
          <label className="required">Specific Product</label>
          <select
            value={line.product}
            disabled={!line.category}
            onChange={e => onUpdate({...line, product:e.target.value})}
          >
            <option value="">{line.category ? 'Select Product' : 'Select Category First'}</option>
            {(productCatalog[line.category] || []).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CHANGE 3: Show "configured on next screen" notice for all summary-configured products */}
      {isSummaryConfigure && (
        <div className="alert alert-info mps-intake-notice">
          <span>ℹ️</span>
          <div>
            <strong>
              {MPS_PRODUCTS.includes(line.product)
                ? "Dimensions & pricing are configured per opening"
                : "Dimensions, projection & pricing are configured on the next screen"}
            </strong><br />
            {MPS_PRODUCTS.includes(line.product)
              ? "Width, height, quantity, and notes for this product are entered on the next screen where you can add multiple areas and openings."
              : "Width, projection, fabric, and all configuration details for this product are entered on the next screen."}
          </div>
        </div>
      )}

      {!isSummaryConfigure && (
        <>
          <div className="dim-row">
            <div className="form-group">
              <label className="required">{widthLabel}</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={line.width}
                onChange={e => onUpdate({...line, width:e.target.value})}
                placeholder={p?.dimensionUnit === 'in' ? "e.g. 98 (inches)" : "e.g. 10 (or 120 inches)"}
              />
            </div>
            <div className="form-group">
              <label className="required">{heightLabel}</label>
              <input
                type="text"
                value={line.height}
                onChange={e => onUpdate({...line, height:e.target.value})}
                placeholder={p?.pricingModel === 'matrix_axes' ? `e.g. 4' 11" or 59` : p?.dimensionUnit === 'in' ? "e.g. 48 (inches)" : "e.g. 8"}
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={line.quantity}
                min="1"
                onChange={e => onUpdate({...line, quantity:e.target.value})}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Product Notes</label>
              <textarea
                rows="3"
                value={line.notes}
                onChange={e => onUpdate({...line, notes:e.target.value})}
                placeholder="Special instructions, site conditions, etc."
              />
            </div>
          </div>

          <div className="product-subtotal">
            <div className="product-subtotal-row">
              <span>Product Subtotal:</span>
              <span>${lineTotal.toFixed(2)}</span>
            </div>
            {baseResult && (
              <div className="price-hint">{baseResult.message}</div>
            )}
          </div>
        </>
      )}

      {isSummaryConfigure && (
        <div className="product-subtotal">
          <div className="product-subtotal-row">
            <span>Product Subtotal:</span>
            <span>Priced on next screen</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
let idCounter = 1;

function createEmptyLine() {
  return {
    id: idCounter++,
    category:   '',
    product:    '',
    width:      '',
    height:     '',
    sqft:       '',
    quantity:   1,
    mount:      '',
    fabric:     '',
    color:      '',
    operation:  'manual',
    addons:     addOns.map(() => false),
    notes:      '',
    photoCount: 0,
  };
}

function createInitialOrderData() {
  return {
    customer: { name:'', email:'', phone:'', address:'', installationDate:'' },
    productLines: [createEmptyLine()],
    discount: { percent:0, managerName:'', managerEmail:'', approvalCode:'' },
    createdAt:   new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

function loadInitialState() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const maxId = parsed.productLines?.reduce((m, l) => Math.max(m, l.id || 0), 0) || 0;
      if (maxId >= idCounter) idCounter = maxId + 1;
      if (!parsed.customer.installationDate) parsed.customer.installationDate = '';
      return {
        customer: parsed.customer || { name:'', email:'', phone:'', address:'', installationDate:'' },
        productLines: parsed.productLines?.length ? parsed.productLines : [createEmptyLine()],
        discount: parsed.discount || { percent:0, managerName:'', managerEmail:'', approvalCode:'' },
        createdAt: parsed.createdAt || new Date().toISOString(),
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (_) {}
  return createInitialOrderData();
}

export default function App() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(loadInitialState);
  const { customer, productLines, discount } = orderData;

  const updateOrder = (key, value) =>
    setOrderData(prev => ({
      ...prev,
      [key]: typeof value === 'object' && !Array.isArray(value)
        ? { ...prev[key], ...value }
        : value,
      lastUpdated: new Date().toISOString(),
    }));

  const updateCustomer  = (field, value) => updateOrder('customer', { [field]: value });
  const addLine         = () => updateOrder('productLines', [...productLines, createEmptyLine()]);
  const removeLine      = (id) => updateOrder('productLines', productLines.filter(l => l.id !== id));
  const updateLine      = (updatedLine) => updateOrder('productLines', productLines.map(l => l.id === updatedLine.id ? updatedLine : l));
  const updateDiscount  = (field, value) => updateOrder('discount', { [field]: value });

  const subtotal     = productLines.reduce((sum, line) => sum + calcLineTotal(line), 0);
  const discountAmt  = subtotal * (discount.percent / 100);
  const total        = subtotal - discountAmt;
  const needsManager = discount.percent > 20;

  const buildSnapshot = () => {
    return {
      ...orderData,
      productLines: productLines.map(line => {
        const p = findProduct(line.product);
        const isSummaryConfigure = SUMMARY_CONFIGURED_PRODUCTS.includes(line.product);
        const priceResult = (line.category && line.product && !isSummaryConfigure) ? getBasePriceUnified(line) : null;
        return {
          ...line,
          productMeta: { pricingModel: p?.pricingModel || null, dimensionUnit: p?.dimensionUnit || 'ft' },
          pricing: {
            basePrice:    priceResult?.ok ? priceResult.price : 0,
            priceNote:    priceResult?.message || (isSummaryConfigure ? 'Priced on Product Summary screen' : ''),
            lineSubtotal: calcLineTotal(line),
          },
        };
      }),
      pricingSummary: { subtotal, discountPercent: discount.percent, discountAmount: discountAmt, total },
      submittedAt: new Date().toISOString(),
    };
  };

  const validateForm = () => {
    if (!customer.name || !customer.email || !customer.phone) {
      alert('Please fill in all required customer information.'); return false;
    }
    if (productLines.length === 0) {
      alert('Please add at least one product.'); return false;
    }
    const hasValid = productLines.some(line => {
      if (!line.category || !line.product) return false;
      if (SUMMARY_CONFIGURED_PRODUCTS.includes(line.product)) return true;
      return getBasePriceUnified(line).ok;
    });
    if (!hasValid) {
      alert('Please configure at least one product with a valid size.'); return false;
    }
    if (needsManager && (!discount.managerName || !discount.managerEmail || !discount.approvalCode)) {
      alert('Manager approval required for discounts above 20%.'); return false;
    }
    return true;
  };

  React.useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(orderData));
    } catch (_) {}
  }, [orderData]);

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="container">
      <header className="app-header">
        <h1>Retail Field Sales Intake &amp; Quoting Tool</h1>
        <p>Complete order form with live pricing calculation</p>
      </header>

      <div className="form-wrapper">
        {/* ── SECTION 1: Customer Information ── */}
        <div className="section">
          <div className="section-header"><div className="section-number">1</div><h2>Customer Information</h2></div>
          <div className="grid-2">
            <div className="form-group">
              <label className="required">Customer Name</label>
              <input type="text" value={customer.name} onChange={e => updateCustomer('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="required">Email</label>
              <input type="text" value={customer.email} onChange={e => updateCustomer('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="required">Phone</label>
              <input type="text" value={customer.phone} onChange={e => updateCustomer('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Installation Address</label>
              <input type="text" value={customer.address} onChange={e => updateCustomer('address', e.target.value)} />
            </div>

            <div className="form-group installation-date-group">
              <label>
                Date of Installation
                <span className="field-hint">Estimated or confirmed install date</span>
              </label>
              <input
                type="date"
                className="installation-date-input"
                value={customer.installationDate || ''}
                min={todayISO}
                onChange={e => updateCustomer('installationDate', e.target.value)}
              />
              {customer.installationDate && (
                <div className="installation-date-display">
                  📅 {new Date(customer.installationDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Product Selection ── */}
        <div className="section">
          <div className="section-header"><div className="section-number">2</div><h2>Product Selection</h2></div>
          {productLines.map((line, idx) => (
            <ProductLine
              key={line.id}
              line={line}
              lineNumber={idx + 1}
              onUpdate={updateLine}
              onRemove={() => removeLine(line.id)}
              showRemove={productLines.length > 1}
            />
          ))}
          <button type="button" className="btn btn-primary" onClick={addLine}><span>+</span> Add Product Line</button>
        </div>

        {/* ── SECTION 3: Pricing & Discount ── */}
        <div className="section">
          <div className="section-header"><div className="section-number">3</div><h2>Pricing &amp; Discount</h2></div>
          <div className="form-group">
            <label>Discount Percentage</label>
            <select value={discount.percent} onChange={e => updateDiscount('percent', parseFloat(e.target.value))}>
              <option value="0">0% - No Discount</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
              <option value="25">25% - Requires Manager Approval</option>
              <option value="30">30% - Requires Manager Approval</option>
            </select>
          </div>
          {needsManager && (
            <div className="manager-approval">
              <h3>⚠ Manager Approval Required</h3>
              <div className="form-group"><label className="required">Manager Name</label><input type="text" value={discount.managerName} onChange={e => updateDiscount('managerName', e.target.value)} /></div>
              <div className="form-group"><label className="required">Manager Email</label><input type="text" value={discount.managerEmail} onChange={e => updateDiscount('managerEmail', e.target.value)} /></div>
              <div className="form-group"><label className="required">Approval Code</label><input type="text" value={discount.approvalCode} onChange={e => updateDiscount('approvalCode', e.target.value)} placeholder="Enter manager approval code" /></div>
            </div>
          )}
          <div className="pricing-summary">
            <div className="pricing-row"><span className="pricing-label">Subtotal (Before Discount)</span><span className="pricing-value">${subtotal.toFixed(2)}</span></div>
            <div className="pricing-row"><span className="pricing-label">Discount ({discount.percent}%)</span><span className="pricing-value">-${discountAmt.toFixed(2)}</span></div>
            <div className="pricing-row total-row"><span className="pricing-label">Total</span><span className="pricing-value">${total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-next"
            onClick={() => {
              if (!validateForm()) return;
              const snapshot = buildSnapshot();
              navigate('/summary', { state: { snapshot } });
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}