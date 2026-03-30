import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProductSummary.css';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const MPS_PRODUCTS = [
  "Motorized Power Screen 5in Cassette",
  "Motorized Power Screen 6in Cassette",
  "Motorized Power Screen open roll",
];

// CHANGE 3: Skylight Plus MRA (renamed from "Motor B Retractable Awning")
// AWNING products list — used for transmitter auto-assignment logic
const AWNING_PRODUCTS = [
  "Skylight Plus MRA",
  "Motor A QIP-Square box Retractable Awning",
  "Motor B QIP-Square box Retractable Awning",
  "Motor A Open Roll Retractable Awning",
  "Motor B Open Roll Retractable Awning",
];

// CHANGE 3: Skylight Plus MRA projection options (locked dropdown — no free text)
const SKYLIGHT_MRA_PROJECTIONS = [
  "4'11\"",
  "6'6\"",
  "8'2\"",
  "9'10\"",
  "11'2\"",
  "13'1\"",
];

// CHANGE 3: Skylight Plus MRA fabric catalog
const SKYLIGHT_FABRIC_BRANDS = ["Sunbrella", "Recacril", "Dickson", "Tempotest"];
const SKYLIGHT_FABRIC_TYPES = {
  Sunbrella:  ["Stripe", "Solid", "Jacquard", "Canvas"],
  Recacril:   ["Standard", "Premium"],
  Dickson:    ["Orchestra", "Fantasy", "Tweed"],
  Tempotest:  ["Base", "Para", "Uni"],
};

// ─────────────────────────────────────────────────────────────
// MOTOR CATALOG
// ─────────────────────────────────────────────────────────────
const MOTOR_CATALOG = [
  {
    id: "somfy_lt50_535",
    name: "Somfy LT50 Altus RTS 535A2-1038168",
    displayName: "Somfy LT50 Altus RTS (535)",
    brand: "Somfy",
    priceAdjustment: 0,
    includedInBase: true,
    compatibleProducts: ["Motorized Power Screen 5in Cassette"],
    notes: "Default for 5\" cassette — included in base price",
  },
  {
    id: "somfy_lt50_550",
    name: "Somfy LT50 Altus RTS 550R2-1038170",
    displayName: "Somfy LT50 Altus RTS (550R2)",
    brand: "Somfy",
    priceAdjustment: 0,
    includedInBase: true,
    compatibleProducts: ["Motorized Power Screen 6in Cassette", "Motorized Power Screen open roll"],
    notes: "Default for 6\" cassette & open roll — included in base price",
  },
  {
    id: "dooya",
    name: "Dooya Motor",
    displayName: "Dooya Motor",
    brand: "Dooya",
    priceAdjustment: 0,
    includedInBase: false,
    compatibleProducts: [
      "Motorized Power Screen 5in Cassette",
      "Motorized Power Screen 6in Cassette",
      "Motorized Power Screen open roll",
    ],
    notes: "Alternative motor — pricing TBD (may apply credit from base)",
  },
];

function getDefaultMotorId(productName) {
  const motor = MOTOR_CATALOG.find(m => m.compatibleProducts.includes(productName) && m.includedInBase);
  return motor?.id || null;
}

function getCompatibleMotors(productName) {
  return MOTOR_CATALOG.filter(m => m.compatibleProducts.includes(productName));
}

function getMotorPriceAdjustment(motorId) {
  const motor = MOTOR_CATALOG.find(m => m.id === motorId);
  if (!motor) return 0;
  return motor.priceAdjustment;
}

// ─────────────────────────────────────────────────────────────
// FABRIC CATALOG — Hierarchical Brand → Series → Openness → Color
// ─────────────────────────────────────────────────────────────
const FABRIC_CATALOG = {
  Twitchell: {
    "Nano": {
      hasOpenness: true,
      openness: {
        "50": ["Black", "White"],
        "55": ["Black", "White"],
        "60": ["Black"],
        "70": ["Black"],
        "95": ["White", "Bone", "Sable", "Desert Sand", "Almond", "Café", "Stone Texture", "Shadow Texture", "Tumbleweed", "Espresso Texture", "Granite", "Tobacco", "Charcoal", "Flat Black"],
        "97": ["White", "Bone", "Sable", "Desert Sand", "Almond", "Café", "Stone Texture", "Shadow Texture", "Tumbleweed", "Espresso Texture", "Granite", "Tobacco", "Charcoal", "Flat Black"],
        "99": ["Flat Black", "Charcoal", "Espresso Texture", "Tobacco", "Granite"],
      },
    },
    "Textilene (80/90)": {
      hasOpenness: false,
      colors: ["White", "Desert Sand", "Sandstone", "Dusk Grey", "Brown", "Black/Brown", "Black"],
    },
    "Blackout (Dimout)": {
      hasOpenness: false,
      colors: ["Light Grey", "Shadow Texture", "Grey", "Charcoal", "Espresso Texture", "Flat Black", "Tan", "Stone Texture", "Putty", "Tobacco"],
    },
  },
  Phifer: {
    "Suntex (Standard)": {
      hasOpenness: true,
      openness: {
        "80": ["Black", "Brown", "Grey", "Beige", "Stucco", "Dark Bronze"],
        "90": ["Black", "Brown", "Grey", "Beige", "Stucco", "Dark Bronze"],
        "95": ["Dark Bronze", "White", "White/Grey", "Stucco", "Sand", "Alpaca", "Chestnut", "Mocha", "Carbon", "Black"],
        "97": ["Dark Bronze", "White", "White/Grey", "Stucco", "Sand", "Alpaca", "Chestnut", "Mocha", "Carbon", "Black"],
        "99": ["Dark Bronze", "White", "White/Grey", "Stucco", "Sand", "Alpaca", "Chestnut", "Mocha", "Carbon", "Black"],
      },
    },
    "Suntex Matte": {
      hasOpenness: true,
      openness: {
        "95": ["Matte Dark Bronze", "Matte Niko", "Matte Iron Grey", "Matte Black"],
        "97": ["Matte Dark Bronze", "Matte Niko", "Matte Iron Grey", "Matte Black"],
      },
    },
  },
};

function getFabricBrands() { return Object.keys(FABRIC_CATALOG); }
function getFabricSeries(brand) { if (!brand || !FABRIC_CATALOG[brand]) return []; return Object.keys(FABRIC_CATALOG[brand]); }
function getFabricSeriesData(brand, series) { return FABRIC_CATALOG[brand]?.[series] || null; }
function getFabricOpennessOptions(brand, series) {
  const data = getFabricSeriesData(brand, series);
  if (!data || !data.hasOpenness) return [];
  return Object.keys(data.openness);
}
function getFabricColors(brand, series, openness) {
  const data = getFabricSeriesData(brand, series);
  if (!data) return [];
  if (data.hasOpenness) { if (!openness) return []; return data.openness[openness] || []; }
  return data.colors || [];
}
function buildFabricLabel(fabricSelection) {
  if (!fabricSelection?.brand) return "";
  const parts = [fabricSelection.brand, fabricSelection.series];
  if (fabricSelection.openness) parts.push(`${fabricSelection.openness}%`);
  if (fabricSelection.color) parts.push(fabricSelection.color);
  return parts.filter(Boolean).join(" › ");
}

// ─────────────────────────────────────────────────────────────
// MPS DEFAULTS
// ─────────────────────────────────────────────────────────────
const MPS_DEFAULTS = {
  mountTypes:    ["Surface", "Inside", "Soffit Mount"],
  trackTypes:    ["Zipper", "Wire Guide", "Storm Rail"],
  motorTypes:    ["Somfy (default)", "Somfy RTS", "Somfy WireFree", "Custom"],
  lChannelSizes: ["1×1", "1×2", "Custom"],
  lChannelLocs:  ["Left", "Right", "Top", "Bottom"],
  buildoutTypes: ["Wood", "Alumitube"],
  woodSizes:     ["2x4", "2x6", "2x8", "2x10", "4x4", "4x6", "4x8", "4x10"],
  motorSides:    ["Left", "Right"],
  weightBarTypes:["Sand", "White", "Black", "Bronze", "Custom"],
  remoteTypes:   ["1 Channel Somfy Remote", "5 Channel Somfy Remote", "16 Channel Somfy Remote"],
};

const WOOD_BUILDOUT_RATES = {
  "2x4":  4,  "2x6":  6,  "2x8":  8,  "2x10": 10,
  "4x4":  10, "4x6":  25, "4x8":  30, "4x10": 40,
};

const STORM_RAIL_RATE        = 40;
const L_CHANNEL_RATE         = 25;
const ALUMITUBE_DEFAULT_RATE = 35;

const REMOTE_PRICING = {
  "1 Channel Somfy Remote":  125,
  "5 Channel Somfy Remote":  180,
  "16 Channel Somfy Remote": 320,
};

function getAutoRemote(openingCount) {
  if (openingCount <= 1)  return "1 Channel Somfy Remote";
  if (openingCount <= 5)  return "5 Channel Somfy Remote";
  return "16 Channel Somfy Remote";
}

// ─────────────────────────────────────────────────────────────
// CHANGE 1 & 2: WIND SENSOR ADD-ONS
// Renamed from Whirly/Shaker to correct Somfy product names.
// Wireless (Eolis 3D) = per-opening (1:1) — NOT available for 5in/6in cassette
// Wired (Eolis RTS 24V) = shared/global (1:many) — available for all MPS products
// ─────────────────────────────────────────────────────────────
const WIND_SENSOR_WIRED = {
  id: "wind_sensor_wired",
  name: "Somfy Eolis RTS 24V Wired Wind Sensor Kit",
  shortName: "Eolis RTS 24V (Wired)",
  price: 290,
  type: "global",   // one per project, shared across openings
  description: "Shared sensor — selected once, applies across all openings",
};

const WIND_SENSOR_WIRELESS = {
  id: "wind_sensor_wireless",
  name: "Somfy Eolis 3D Wirefree RTS Wind Sensor",
  shortName: "Eolis 3D Wirefree (Wireless)",
  price: 290,
  type: "per_opening",   // one per opening
  description: "Per-opening sensor — quantity scales with number of openings",
};

// Returns which wind sensors are available for a given product
function getAvailableWindSensors(productName) {
  const isCassette = productName === "Motorized Power Screen 5in Cassette" ||
                     productName === "Motorized Power Screen 6in Cassette";
  if (isCassette) {
    // CHANGE 2: Cassette products only allow wired sensor
    return [WIND_SENSOR_WIRED];
  }
  // Open roll and all other MPS products get both options
  return [WIND_SENSOR_WIRED, WIND_SENSOR_WIRELESS];
}

// CHANGE 1: Updated MPS_SIMPLE_ADDONS — wind sensors removed from here,
// now handled separately with proper per-opening / global logic
const MPS_SIMPLE_ADDONS = [
  { id: "remote_1ch",  name: "1 Channel Somfy Remote",  price: 125 },
  { id: "remote_5ch",  name: "5 Channel Somfy Remote",  price: 180 },
  { id: "remote_16ch", name: "16 Channel Somfy Remote", price: 320 },
  { id: "tahoma",      name: "Somfy Tahoma",             price: 420 },
];

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

// ─────────────────────────────────────────────────────────────
// MPS PRODUCT PRICE DATA
// ─────────────────────────────────────────────────────────────
const MPS_PRICE_DATA = {
  "Motorized Power Screen 5in Cassette": {
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
  "Motorized Power Screen 6in Cassette": {
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
  "Motorized Power Screen open roll": {
    pricingModel: "matrix",
    prices: {
      4:  {3:1935,4:2040,5:2145,6:2250,7:2355,8:2460,9:2565,10:2670,11:2775,12:2880,13:2985,14:3090,15:3195,16:3300,17:3405,18:3510,19:3615,20:3720,21:3825,22:3930,23:4035,24:4140,25:4245,26:4350},
      5:  {3:2040,4:2145,5:2250,6:2355,7:2460,8:2565,9:2670,10:2775,11:2880,12:2985,13:3090,14:3195,15:3300,16:3405,17:3510,18:3615,19:3720,20:3825,21:3930,22:4035,23:4140,24:4245,25:4350,26:4455},
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
  }
};

// ─────────────────────────────────────────────────────────────
// MPS PRICING LOGIC
// ─────────────────────────────────────────────────────────────
function toFeetKey(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const feet = n > 30 ? n / 12 : n;
  return Math.ceil(feet);
}

function getMPSOpeningPrice(productName, widthRaw, heightRaw) {
  const productData = MPS_PRICE_DATA[productName];
  if (!productData) return { ok: false, price: 0, message: "Unknown MPS product." };
  const widthKey  = toFeetKey(widthRaw);
  const heightKey = toFeetKey(heightRaw);
  if (!widthKey || !heightKey) {
    return { ok: false, price: 0, message: "Enter valid width and height (feet or inches)." };
  }
  const price = productData.prices?.[heightKey]?.[widthKey] ?? null;
  if (price == null) {
    const rowKeys = Object.keys(productData.prices).map(Number).sort((a,b)=>a-b);
    const colKeys = rowKeys.length > 0 ? Object.keys(productData.prices[rowKeys[0]]).map(Number).sort((a,b)=>a-b) : [];
    return {
      ok: false, price: 0,
      message: `No price found for Width=${widthKey}ft × Height=${heightKey}ft. Valid height: ${rowKeys[0]}–${rowKeys[rowKeys.length-1]}ft, Width: ${colKeys[0]}–${colKeys[colKeys.length-1]}ft.`
    };
  }
  return { ok: true, price: Number(price), message: `Matrix price: ${fmt(price)} (Width=${widthKey}ft × Height=${heightKey}ft)` };
}

// ─────────────────────────────────────────────────────────────
// PRODUCT ADD-ONS
// ─────────────────────────────────────────────────────────────
const PRODUCT_ADDONS = {
  "Hydra Retractable Patio Cover": [
    { id:"wind_sensor",   name:"Wind Sensor",            price:195 },
    { id:"rain_sensor",   name:"Rain Sensor",            price:175 },
    { id:"led_lighting",  name:"LED Lighting Kit",       price:350 },
    { id:"remote",        name:"Remote Control",         price:75  },
    { id:"smart_home",    name:"Smart Home Integration", price:150 },
    { id:"heater",        name:"Infrared Heater",        price:480 },
    { id:"side_curtains", name:"Side Drop Curtains",     price:220 },
  ],
  "Duralum Solid Patio Cover": [
    { id:"gutters",       name:"Integrated Gutters",                                        price:280  },
    { id:"led_lighting",  name:"LED Lighting Kit",                                          price:350  },
    { id:"fan_kit",       name:"Ceiling Fan Pre-wire Kit",                                  price:130  },
    { id:"skylight",      name:"Skylight Panel",                                            price:420  },
    { id:"paint_upgrade", name:"Custom Paint Upgrade",                                      price:200  },
    { id:"can_light",     name:"6in Can Light (incl. wire & electrical)",                   price:100  },
    { id:"bromic_heater", name:"Bromic 220V Electric Heater (incl. electric heater unit)",  price:2500 },
  ],
  "Motorized Louvered Roof Pergolas": [],
  "Motorized Canvas Roof Pergolas": [
    { id:"wind_sensor",   name:"Wind Sensor",            price:195 },
    { id:"led_lighting",  name:"LED Lighting Kit",       price:350 },
    { id:"smart_home",    name:"Smart Home Integration", price:150 },
    { id:"side_curtains", name:"Side Drop Curtains",     price:220 },
    { id:"remote",        name:"Remote Control",         price:75  },
  ],
  "Slide on Wire Shades": [
    { id:"motorization", name:"Motorization",   price:250 },
    { id:"remote",       name:"Remote Control", price:75  },
    { id:"wind_sensor",  name:"Wind Sensor",    price:195 },
  ],
  "Vista View Single Housing Unit": [
    { id:"remote",         name:"Remote Control",         price:75  },
    { id:"smart_home",     name:"Smart Home Integration", price:150 },
    { id:"fabric_upgrade", name:"Premium Fabric Upgrade", price:125 },
    { id:"valance",        name:"Decorative Valance",     price:100 },
  ],
  "Vista View Double Housing Units": [
    { id:"remote",         name:"Remote Control",         price:75  },
    { id:"smart_home",     name:"Smart Home Integration", price:150 },
    { id:"fabric_upgrade", name:"Premium Fabric Upgrade", price:125 },
    { id:"valance",        name:"Decorative Valance",     price:100 },
  ],
  "Single Horizon View Retractable Screens": [
    { id:"remote",         name:"Remote Control",         price:75  },
    { id:"smart_home",     name:"Smart Home Integration", price:150 },
    { id:"fabric_upgrade", name:"Premium Fabric Upgrade", price:125 },
    { id:"wind_sensor",    name:"Wind Sensor",            price:195 },
  ],
  "Clearview Retractable Screen Doors": [],
  "Clearview Oversized Doors": [],
  // CHANGE 3: "Motor B Retractable Awning" renamed to "Skylight Plus MRA"
  // The old "Motor B Retractable Awning" key is removed; "Skylight Plus MRA" handled in SkylightMRACard
  "Motor A QIP-Square box Retractable Awning": [
    { id:"wind_sensor",  name:"Wind Sensor",            price:195 },
    { id:"led_lighting", name:"LED Lighting Kit",       price:350 },
    { id:"smart_home",   name:"Smart Home Integration", price:150 },
    { id:"remote",       name:"Additional Remote",      price:75  },
    { id:"valance",      name:"Decorative Valance",     price:100 },
  ],
  "Motor B QIP-Square box Retractable Awning": [
    { id:"wind_sensor",  name:"Wind Sensor",            price:195 },
    { id:"led_lighting", name:"LED Lighting Kit",       price:350 },
    { id:"smart_home",   name:"Smart Home Integration", price:150 },
    { id:"remote",       name:"Additional Remote",      price:75  },
    { id:"pitch_kit",    name:"Adjustable Pitch Kit",   price:110 },
    { id:"valance",      name:"Decorative Valance",     price:100 },
  ],
  "Motor A Open Roll Retractable Awning": [
    { id:"wind_sensor",    name:"Wind Sensor",            price:195 },
    { id:"smart_home",     name:"Smart Home Integration", price:150 },
    { id:"remote",         name:"Additional Remote",      price:75  },
    { id:"fabric_upgrade", name:"Premium Fabric Upgrade", price:125 },
  ],
  "Motor B Open Roll Retractable Awning": [
    { id:"wind_sensor",    name:"Wind Sensor",            price:195 },
    { id:"led_lighting",   name:"LED Lighting Kit",       price:350 },
    { id:"smart_home",     name:"Smart Home Integration", price:150 },
    { id:"remote",         name:"Additional Remote",      price:75  },
    { id:"fabric_upgrade", name:"Premium Fabric Upgrade", price:125 },
    { id:"pitch_kit",      name:"Adjustable Pitch Kit",   price:110 },
  ],
  default: [
    { id:"motorization",   name:"Motorization",           price:250 },
    { id:"remote",         name:"Remote Control",         price:75  },
    { id:"smart_home",     name:"Smart Home Integration", price:150 },
    { id:"valance",        name:"Decorative Valance",     price:100 },
    { id:"cordless",       name:"Cordless Lift",          price:50  },
    { id:"fabric_upgrade", name:"Premium Fabric Upgrade", price:125 },
  ],
};

function getAddonsForProduct(productName) {
  return PRODUCT_ADDONS[productName] || PRODUCT_ADDONS["default"];
}

const PRODUCT_FIELD_ADDONS = {
  "Motorized Louvered Roof Pergolas": [
    { id:"led_strip",       name:"Built-in LED Strip Lights (dimmable)", pricingType:"per_lf",   rate:60,   unit:"linear feet", unitShort:"LF", placeholder:"e.g. 20" },
    { id:"bromic_heater",   name:"Bromic 220V Heaters",                  pricingType:"per_unit", rate:2500, unit:"units",       unitShort:"ea", placeholder:"e.g. 2"  },
    { id:"ceiling_fan",     name:"Ceiling Fan",                          pricingType:"per_unit", rate:1000, unit:"units",       unitShort:"ea", placeholder:"e.g. 1"  },
    { id:"utility_beam",    name:"Utility Beam",                         pricingType:"per_unit", rate:1000, unit:"units",       unitShort:"ea", placeholder:"e.g. 1"  },
    { id:"cement_footings", name:'24" x 24" Cement Footings',            pricingType:"per_unit", rate:1000, unit:"units",       unitShort:"ea", placeholder:"e.g. 4"  },
  ],
  "Clearview Retractable Screen Doors": [
    { id:"pet_solar_mesh",       name:"Pet or Solar Mesh (per door, 42\" max)",     pricingType:"per_unit", rate:95,   unit:"doors", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_short",   name:"External Pin Lock Short",                    pricingType:"per_unit", rate:45,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_long",    name:"External Pin Lock Long",                     pricingType:"per_unit", rate:65,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_measure", name:"Internal Pin Lock (@ measure)",              pricingType:"per_unit", rate:125,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_after",   name:"Internal Pin Lock (after measure)",          pricingType:"per_unit", rate:250,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"diecast_handles",      name:"Diecast Handles (per door)",                 pricingType:"per_unit", rate:60,   unit:"doors", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"pet_guard",            name:"Pet Guard (per door)",                       pricingType:"per_unit", rate:125,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"cleaning_kit",         name:"Cleaning Kit",                               pricingType:"per_unit", rate:25,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"silicone_spray",       name:"Silicone Spray Only",                        pricingType:"per_unit", rate:15,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_single", name:"Custom Powder Single",                       pricingType:"per_unit", rate:500,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_double", name:"Custom Powder Double",                       pricingType:"per_unit", rate:900,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_single",   name:"Custom Wood Grain Single",                   pricingType:"per_unit", rate:1000, unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_double",   name:"Custom Wood Grain Double",                   pricingType:"per_unit", rate:1800, unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_threshold",     name:"Custom Threshold Cuts ($150–$300)",          pricingType:"custom",   rate:0,    unit:"units", unitShort:"ea", placeholder:"Enter price", group:"Upgrades" },
    { id:"buildout_stationary",  name:"Build Out on Stationary Door ($100–$200)",   pricingType:"custom",   rate:0,    unit:"units", unitShort:"ea", placeholder:"Enter price", group:"Upgrades" },
    { id:"rescreen_std",         name:"Standard Mesh (48\" max)",                   pricingType:"per_unit", rate:225,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_solar_pet",   name:"Solar/Pet Mesh (42\" max)",                  pricingType:"per_unit", rate:275,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_single_dbl",  name:"Single Over Double (68\" max)",              pricingType:"per_unit", rate:250,  unit:"units", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_phantom",     name:"Phantom / Eclipse / Mirage / Wizard / Aira", pricingType:"per_unit", rate:275,  unit:"units", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_stowaway",    name:"Stowaway (Stowaway Mesh)",                   pricingType:"per_unit", rate:275,  unit:"units", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_casper",      name:"Casper / Genius / Brisa / ODL",              pricingType:"custom",   rate:0,    unit:"units", unitShort:"ea", placeholder:"Cannot rescreen", group:"Rescreens" },
    { id:"service_call",         name:"Service Call",                               pricingType:"per_unit", rate:99,   unit:"calls", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"service_extra_door",   name:"Service Extra Doors (per door)",             pricingType:"per_unit", rate:45,   unit:"doors", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"uninstall_single",     name:"Uninstall Single Door",                      pricingType:"per_unit", rate:175,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"uninstall_double",     name:"Uninstall Double Door",                      pricingType:"per_unit", rate:300,  unit:"units", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"reinstall_single",     name:"Reinstall Single Door",                      pricingType:"per_unit", rate:175,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"reinstall_double",     name:"Reinstall Double Door",                      pricingType:"per_unit", rate:300,  unit:"units", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"part_housing",         name:"Housing",                                    pricingType:"per_unit", rate:125,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_pull_bar",        name:"Pull Bar",                                   pricingType:"per_unit", rate:105,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_roller_tube",     name:"Roller Tube",                                pricingType:"per_unit", rate:50,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_end_caps",        name:"End Caps / Housing Caps / Handles (per set)",pricingType:"per_unit", rate:35,   unit:"sets",  unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_springs",         name:"Springs",                                    pricingType:"per_unit", rate:35,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_single",   name:"5\" Sill Single",                            pricingType:"per_unit", rate:60,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_s",   name:"5\" Gold Sill Single",                       pricingType:"per_unit", rate:100,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_double",   name:"5\" Sill Double",                            pricingType:"per_unit", rate:120,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_d",   name:"5\" Gold Sill Double",                       pricingType:"per_unit", rate:200,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_magnets",         name:"Magnets",                                    pricingType:"per_unit", rate:20,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_int_mag_single",  name:"Internal Magnet Single Door",                pricingType:"per_unit", rate:80,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_int_mag_double",  name:"Internal Magnet Double Door",                pricingType:"per_unit", rate:160,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_speed_reducer",   name:"Speed Reducer",                              pricingType:"per_unit", rate:90,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_s",    name:"Extra Parts Deco / Sq Sill etc (single)",    pricingType:"per_unit", rate:40,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_d",    name:"Extra Parts Deco / Sq Sill etc (double)",    pricingType:"per_unit", rate:80,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_s",     name:"Gold Extra Parts Deco / Sq Sill etc (single)",pricingType:"per_unit",rate:70,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_d",     name:"Gold Extra Parts Deco / Sq Sill etc (double)",pricingType:"per_unit",rate:140,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
  ],
  "Clearview Oversized Doors": [
    { id:"pet_solar_mesh",       name:"Pet or Solar Mesh (per door, 42\" max)",     pricingType:"per_unit", rate:95,   unit:"doors", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_short",   name:"External Pin Lock Short",                    pricingType:"per_unit", rate:45,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_long",    name:"External Pin Lock Long",                     pricingType:"per_unit", rate:65,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_measure", name:"Internal Pin Lock (@ measure)",              pricingType:"per_unit", rate:125,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_after",   name:"Internal Pin Lock (after measure)",          pricingType:"per_unit", rate:250,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"diecast_handles",      name:"Diecast Handles (per door)",                 pricingType:"per_unit", rate:60,   unit:"doors", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"pet_guard",            name:"Pet Guard (per door)",                       pricingType:"per_unit", rate:125,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"cleaning_kit",         name:"Cleaning Kit",                               pricingType:"per_unit", rate:25,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"silicone_spray",       name:"Silicone Spray Only",                        pricingType:"per_unit", rate:15,   unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_single", name:"Custom Powder Single",                       pricingType:"per_unit", rate:500,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_double", name:"Custom Powder Double",                       pricingType:"per_unit", rate:900,  unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_single",   name:"Custom Wood Grain Single",                   pricingType:"per_unit", rate:1000, unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_double",   name:"Custom Wood Grain Double",                   pricingType:"per_unit", rate:1800, unit:"units", unitShort:"ea", placeholder:"1", group:"Upgrades" },
    { id:"custom_threshold",     name:"Custom Threshold Cuts ($150–$300)",          pricingType:"custom",   rate:0,    unit:"units", unitShort:"ea", placeholder:"Enter price", group:"Upgrades" },
    { id:"buildout_stationary",  name:"Build Out on Stationary Door ($100–$200)",   pricingType:"custom",   rate:0,    unit:"units", unitShort:"ea", placeholder:"Enter price", group:"Upgrades" },
    { id:"rescreen_std",         name:"Standard Mesh (48\" max)",                   pricingType:"per_unit", rate:225,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_solar_pet",   name:"Solar/Pet Mesh (42\" max)",                  pricingType:"per_unit", rate:275,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_single_dbl",  name:"Single Over Double (68\" max)",              pricingType:"per_unit", rate:250,  unit:"units", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_phantom",     name:"Phantom / Eclipse / Mirage / Wizard / Aira", pricingType:"per_unit", rate:275,  unit:"units", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_stowaway",    name:"Stowaway (Stowaway Mesh)",                   pricingType:"per_unit", rate:275,  unit:"units", unitShort:"ea", placeholder:"1", group:"Rescreens" },
    { id:"rescreen_casper",      name:"Casper / Genius / Brisa / ODL",              pricingType:"custom",   rate:0,    unit:"units", unitShort:"ea", placeholder:"Cannot rescreen", group:"Rescreens" },
    { id:"service_call",         name:"Service Call",                               pricingType:"per_unit", rate:99,   unit:"calls", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"service_extra_door",   name:"Service Extra Doors (per door)",             pricingType:"per_unit", rate:45,   unit:"doors", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"uninstall_single",     name:"Uninstall Single Door",                      pricingType:"per_unit", rate:175,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"uninstall_double",     name:"Uninstall Double Door",                      pricingType:"per_unit", rate:300,  unit:"units", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"reinstall_single",     name:"Reinstall Single Door",                      pricingType:"per_unit", rate:175,  unit:"doors", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"reinstall_double",     name:"Reinstall Double Door",                      pricingType:"per_unit", rate:300,  unit:"units", unitShort:"ea", placeholder:"1", group:"Service Calls" },
    { id:"part_housing",         name:"Housing",                                    pricingType:"per_unit", rate:125,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_pull_bar",        name:"Pull Bar",                                   pricingType:"per_unit", rate:105,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_roller_tube",     name:"Roller Tube",                                pricingType:"per_unit", rate:50,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_end_caps",        name:"End Caps / Housing Caps / Handles (per set)",pricingType:"per_unit", rate:35,   unit:"sets",  unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_springs",         name:"Springs",                                    pricingType:"per_unit", rate:35,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_single",   name:"5\" Sill Single",                            pricingType:"per_unit", rate:60,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_s",   name:"5\" Gold Sill Single",                       pricingType:"per_unit", rate:100,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_double",   name:"5\" Sill Double",                            pricingType:"per_unit", rate:120,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_d",   name:"5\" Gold Sill Double",                       pricingType:"per_unit", rate:200,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_magnets",         name:"Magnets",                                    pricingType:"per_unit", rate:20,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_int_mag_single",  name:"Internal Magnet Single Door",                pricingType:"per_unit", rate:80,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_int_mag_double",  name:"Internal Magnet Double Door",                pricingType:"per_unit", rate:160,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_speed_reducer",   name:"Speed Reducer",                              pricingType:"per_unit", rate:90,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_s",    name:"Extra Parts Deco / Sq Sill etc (single)",    pricingType:"per_unit", rate:40,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_d",    name:"Extra Parts Deco / Sq Sill etc (double)",    pricingType:"per_unit", rate:80,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_s",     name:"Gold Extra Parts Deco / Sq Sill etc (single)",pricingType:"per_unit",rate:70,   unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_d",     name:"Gold Extra Parts Deco / Sq Sill etc (double)",pricingType:"per_unit",rate:140,  unit:"units", unitShort:"ea", placeholder:"1", group:"Parts" },
  ],
  // CHANGE 3: Skylight Plus MRA — field addons (Somfy RTS accessories only; transmitter/LED auto-included)
  "Skylight Plus MRA": [
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
  "Motor B Retractable Awning": [
    { id:"somfy_1ch_tx",      name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",      name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",   name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",   name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",    name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",    name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",  name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
  "Motor A Open Roll Retractable Awning": [
    { id:"somfy_1ch_tx",      name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",      name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",   name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",   name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",    name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",    name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",  name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
  "Motor B Open Roll Retractable Awning": [
    { id:"somfy_1ch_tx",      name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",      name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",   name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",   name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",    name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",    name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",  name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
  "Motor A QIP-Square box Retractable Awning": [
    { id:"somfy_1ch_tx",      name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",      name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",   name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",   name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",    name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",    name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",  name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
  "Motor B QIP-Square box Retractable Awning": [
    { id:"somfy_1ch_tx",      name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",      name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",   name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",   name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",    name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",    name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",  name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
};

function getFieldAddonsForProduct(productName) {
  return PRODUCT_FIELD_ADDONS[productName] || [];
}

function calcFieldAddonTotal(lineFieldValues, productName) {
  const defs = getFieldAddonsForProduct(productName);
  return defs.reduce((sum, def) => {
    const val = lineFieldValues?.[def.id];
    if (!val?.enabled) return sum;
    if (def.pricingType === "custom") return sum + (parseFloat(val.customPrice) || 0);
    return sum + def.rate * (parseFloat(val.qty) || 0);
  }, 0);
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
let _uid = 1;
const uid = () => `id_${_uid++}`;

function createLChannel() {
  return { id: uid(), loc: "Left", size: "1×1", customSize: "", lf: "", manualPrice: "", photo: null };
}

function createBuildout() {
  return {
    id: uid(), type: "Wood", woodSize: "2x4", aluminubeSize: "1.5×1.5",
    isCustomAlumitubeSize: false, customAlumitubeSize: "", dims: "", lf: "", customRate: "", photo: null,
  };
}

function createOpening(productName = "", areaDefaults = {}) {
  return {
    id: uid(), label: "", width: "", height: "",
    motorSide: areaDefaults.motorSide || "Left",
    motorId: getDefaultMotorId(productName) || "",
    fabricSelection: { brand: "", series: "", openness: "", color: "" },
    lChannels: [],
    buildouts: [],
    mountOverride: "", trackOverride: "",
    colorOverride: "", trackColorOverride: "", motorOverride: "",
    weightBarOverride: "", remoteOverride: "",
    customTrackColorPrice: "",
    customCassetteColorPrice: "",
    customWeightBarColorPrice: "",
    openingPhoto: null,
  };
}

function createArea(productName = "") {
  return {
    id: uid(), name: "", mountType: "", trackType: "",
    fabricSelection: { brand: "", series: "", openness: "", color: "" },
    cassetteColor: "", trackColor: "", motorType: "Somfy (default)",
    weightBar: "", remote: "",
    areaPhoto: null, openings: [createOpening(productName)],
  };
}

// CHANGE 3: Skylight Plus MRA default config
function createSkylightMRAConfig() {
  return {
    width: "",
    widthFt: "",
    widthIn: "",
    projection: "",
    fabricBrand: "",
    fabricType: "",
    fabricColor: "",
    quantity: 1,
  };
}

function calcStormRailCost(opening, effectiveTrackType) {
  if (effectiveTrackType !== "Storm Rail") return 0;
  const heightKey = toFeetKey(opening.height);
  if (!heightKey) return 0;
  return heightKey * STORM_RAIL_RATE;
}

function calcBuildoutCost(bo) {
  if (bo.type === "Wood") {
    const rate = WOOD_BUILDOUT_RATES[bo.woodSize] || 0;
    return (parseFloat(bo.lf) || 0) * rate;
  }
  if (bo.isCustomAlumitubeSize) return parseFloat(bo.customRate) || 0;
  return (parseFloat(bo.lf) || 0) * ALUMITUBE_DEFAULT_RATE;
}

function calcLChannelCost(lc) {
  if (lc.manualPrice !== "" && !isNaN(parseFloat(lc.manualPrice))) return parseFloat(lc.manualPrice);
  return (parseFloat(lc.lf) || 0) * L_CHANNEL_RATE;
}

function calcCustomColorCost(opening, effectiveTrackType, areaDefaults) {
  const cassetteColor   = opening.colorOverride      || areaDefaults?.cassetteColor || "";
  const trackColor      = opening.trackColorOverride || areaDefaults?.trackColor    || "";
  const weightBarColor  = opening.weightBarOverride  || areaDefaults?.weightBar     || "";
  let total = 0;
  if (cassetteColor.toLowerCase().includes("custom")) total += parseFloat(opening.customCassetteColorPrice) || 0;
  if (trackColor.toLowerCase().includes("custom"))    total += parseFloat(opening.customTrackColorPrice) || 0;
  if (weightBarColor.toLowerCase() === "custom")      total += parseFloat(opening.customWeightBarColorPrice) || 0;
  return total;
}

function calcMotorAdjustment(opening) {
  return getMotorPriceAdjustment(opening.motorId);
}

function calcOpeningStructural(opening, areaDefaults) {
  let total = 0;
  (opening.lChannels || []).forEach(lc => { total += calcLChannelCost(lc); });
  (opening.buildouts  || []).forEach(bo => { total += calcBuildoutCost(bo); });
  const effectiveTrackType = opening.trackOverride || areaDefaults?.trackType || "";
  total += calcStormRailCost(opening, effectiveTrackType);
  total += calcCustomColorCost(opening, effectiveTrackType, areaDefaults);
  total += calcMotorAdjustment(opening);
  return total;
}

function calcOpeningBasePrice(opening, productName) {
  if (!opening.width || !opening.height) return 0;
  const result = getMPSOpeningPrice(productName, opening.width, opening.height);
  return result.ok ? result.price : 0;
}

function calcMPSOpeningsTotal(areas, productName) {
  return areas.reduce((s, a) => s + a.openings.reduce((ss, o) => ss + calcOpeningBasePrice(o, productName), 0), 0);
}

function calcAreaStructuralOnly(area) {
  return area.openings.reduce((sum, o) => sum + calcOpeningStructural(o, area), 0);
}

function countTotalOpenings(areas) {
  return areas.reduce((sum, a) => sum + a.openings.length, 0);
}

// CHANGE 1: Wind sensor total calculators
function calcWindSensorTotal(windSensorSelections, totalOpenings) {
  let total = 0;
  if (windSensorSelections?.wired)    total += WIND_SENSOR_WIRED.price;     // global — always 1
  if (windSensorSelections?.wireless) total += WIND_SENSOR_WIRELESS.price * Math.max(1, totalOpenings); // per opening
  return total;
}

// CHANGE 3: Auto-assign transmitter based on total awning qty in order
function getAutoTransmitter(totalAwningQty) {
  if (totalAwningQty <= 2) return "5-Channel Somfy Transmitter";
  return "16-Channel Somfy Transmitter";
}

// ─────────────────────────────────────────────────────────────
// SESSION STORAGE PERSISTENCE
// ─────────────────────────────────────────────────────────────
const SESSION_KEY = "productSummaryState_v3"; // bumped version for new schema

function saveToSession(state) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch (e) {}
}
function loadFromSession() {
  try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

// ─────────────────────────────────────────────────────────────
// CAMERA MODAL
// ─────────────────────────────────────────────────────────────
function CameraModal({ onCapture, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready,      setReady]      = useState(false);
  const [error,      setError]      = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const startStream = useCallback(async (mode) => {
    stopStream(); setReady(false); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => setReady(true)).catch(() => setReady(true));
        };
      }
    } catch (err) {
      let msg = "Could not access camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
        msg = "Camera permission was denied. Please click the camera icon in your browser's address bar and allow access, then try again.";
      else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")
        msg = "No camera found on this device.";
      else if (err.name === "NotReadableError" || err.name === "TrackStartError")
        msg = "Camera is in use by another application. Please close it and try again.";
      setError(msg);
    }
  }, []);

  useEffect(() => { startStream(facingMode); return stopStream; }, []); // eslint-disable-line

  const flipCamera = () => { const next = facingMode === "user" ? "environment" : "user"; setFacingMode(next); startStream(next); };

  const capture = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopStream(); onCapture(canvas.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <div className="camera-modal-header">
          <span className="camera-modal-title">📸 Take Photo</span>
          <button type="button" className="camera-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="camera-viewfinder">
          {error ? (
            <div className="camera-error">
              <div className="camera-error-icon">⚠️</div>
              <p className="camera-error-msg">{error}</p>
              <button type="button" className="camera-retry-btn" onClick={() => startStream(facingMode)}>Try Again</button>
            </div>
          ) : (
            <>
              <video ref={videoRef} className={`camera-video ${facingMode === "user" ? "camera-video--mirror" : ""}`}
                autoPlay playsInline muted style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s" }} />
              {!ready && <div className="camera-loading"><div className="camera-spinner" /><p>Starting camera…</p></div>}
            </>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
        <div className="camera-modal-footer">
          <button type="button" className="camera-flip-btn" onClick={flipCamera} title="Switch camera">🔄 Flip</button>
          <button type="button" className="camera-capture-btn" onClick={capture} disabled={!ready || !!error} title="Take photo">
            <span className="camera-shutter-ring" /><span className="camera-shutter-dot" />
          </button>
          <button type="button" className="camera-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PHOTO UPLOAD
// ─────────────────────────────────────────────────────────────
function PhotoUpload({ label, value, onChange }) {
  const fileRef = useRef();
  const [showPicker, setShowPicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
    setShowPicker(false); e.target.value = "";
  };
  const handleCapture = (dataUrl) => { onChange(dataUrl); setShowCamera(false); };

  return (
    <div className="photo-upload-field">
      <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
      <button type="button" className="photo-btn" onClick={() => setShowPicker(true)}>
        {value ? "📷 Change Photo" : `📷 ${label}`}
      </button>
      {value && <span className="photo-uploaded">✓ Uploaded</span>}
      {value && <img src={value} alt="preview" className="photo-thumb" />}
      {showPicker && !showCamera && (
        <div className="photo-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="photo-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="photo-picker-title">Add Photo</div>
            <div className="photo-picker-options">
              <button type="button" className="photo-picker-option" onClick={() => { setShowPicker(false); setShowCamera(true); }}>
                <span className="photo-picker-icon">📸</span>
                <span className="photo-picker-option-label">Take Photo</span>
                <span className="photo-picker-option-sub">Use camera live</span>
              </button>
              <button type="button" className="photo-picker-option" onClick={() => { fileRef.current.click(); }}>
                <span className="photo-picker-icon">🖼️</span>
                <span className="photo-picker-option-label">Upload File</span>
                <span className="photo-picker-option-sub">Choose from device</span>
              </button>
            </div>
            <button type="button" className="photo-picker-cancel" onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showCamera && <CameraModal onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SELECT / FIELD / TOGGLE HELPERS
// ─────────────────────────────────────────────────────────────
function Sel({ label, value, options, onChange, placeholder, required }) {
  return (
    <div className="mps-field">
      <label className="mps-label">{label}{required && <span className="mps-req">*</span>}</label>
      <select className="mps-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, min, step, required }) {
  return (
    <div className="mps-field">
      <label className="mps-label">{label}{required && <span className="mps-req">*</span>}</label>
      <input className="mps-input" type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} step={step} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="mps-toggle-row">
      <span className="mps-label">{label}</span>
      <button type="button" className={`mps-toggle ${checked ? "mps-toggle-on" : ""}`} onClick={() => onChange(!checked)}>
        <span className="mps-toggle-knob" />
        <span className="mps-toggle-text">{checked ? "Yes" : "No"}</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MOTOR SELECTOR COMPONENT
// ─────────────────────────────────────────────────────────────
function MotorSelector({ motorId, productName, onChange }) {
  const compatibleMotors = getCompatibleMotors(productName);
  const defaultMotorId   = getDefaultMotorId(productName);
  const selectedMotor    = MOTOR_CATALOG.find(m => m.id === motorId);
  const isDefault        = motorId === defaultMotorId || (!motorId && !!defaultMotorId);
  const adjustment       = selectedMotor?.priceAdjustment || 0;

  return (
    <div className="motor-selector-field mps-field">
      <label className="mps-label">
        Motor
        {isDefault && <span className="motor-badge motor-badge--included">✓ Included in base price</span>}
        {!isDefault && adjustment < 0 && <span className="motor-badge motor-badge--credit">Credit: {fmt(adjustment)}</span>}
        {!isDefault && adjustment > 0 && <span className="motor-badge motor-badge--extra">+{fmt(adjustment)}</span>}
      </label>
      <select className="mps-select motor-select" value={motorId || defaultMotorId || ""} onChange={e => onChange(e.target.value)}>
        {compatibleMotors.map(motor => (
          <option key={motor.id} value={motor.id}>
            {motor.displayName}
            {motor.includedInBase ? " (included)" : ""}
            {motor.priceAdjustment < 0 ? ` (credit ${fmt(motor.priceAdjustment)})` : ""}
            {motor.priceAdjustment > 0 ? ` (+${fmt(motor.priceAdjustment)})` : ""}
          </option>
        ))}
      </select>
      {selectedMotor?.notes && <div className="motor-notes">{selectedMotor.notes}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FABRIC SELECTOR COMPONENT — Hierarchical cascade
// ─────────────────────────────────────────────────────────────
function FabricSelector({ fabricSelection = {}, onChange, label = "Fabric" }) {
  const { brand = "", series = "", openness = "", color = "" } = fabricSelection;
  const brands       = getFabricBrands();
  const seriesList   = getFabricSeries(brand);
  const seriesData   = getFabricSeriesData(brand, series);
  const hasOpenness  = seriesData?.hasOpenness || false;
  const opennessOpts = getFabricOpennessOptions(brand, series);
  const colorOpts    = getFabricColors(brand, series, openness);
  const fabricLabel  = buildFabricLabel(fabricSelection);

  const update = (field, value) => {
    const next = { ...fabricSelection, [field]: value };
    if (field === "brand")    { next.series = ""; next.openness = ""; next.color = ""; }
    if (field === "series")   { next.openness = ""; next.color = ""; }
    if (field === "openness") { next.color = ""; }
    onChange(next);
  };

  return (
    <div className="fabric-selector">
      <div className="fabric-selector-label">
        <span className="mps-label">{label}</span>
        {fabricLabel && <span className="fabric-label-badge">{fabricLabel}</span>}
      </div>
      <div className="fabric-cascade-grid">
        <div className="mps-field">
          <label className="mps-label fabric-step-label"><span className="fabric-step-num">1</span> Brand</label>
          <select className="mps-select" value={brand} onChange={e => update("brand", e.target.value)}>
            <option value="">Select Brand</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="mps-field">
          <label className="mps-label fabric-step-label"><span className="fabric-step-num">2</span> Series</label>
          <select className="mps-select" value={series} onChange={e => update("series", e.target.value)} disabled={!brand}>
            <option value="">{brand ? "Select Series" : "— select brand first —"}</option>
            {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {brand && series && hasOpenness && (
          <div className="mps-field">
            <label className="mps-label fabric-step-label"><span className="fabric-step-num">3</span> Openness %</label>
            <select className="mps-select" value={openness} onChange={e => update("openness", e.target.value)}>
              <option value="">Select Openness</option>
              {opennessOpts.map(o => <option key={o} value={o}>{o}%</option>)}
            </select>
          </div>
        )}
        {brand && series && (!hasOpenness || openness) && (
          <div className="mps-field">
            <label className="mps-label fabric-step-label">
              <span className="fabric-step-num">{hasOpenness ? "4" : "3"}</span> Color
            </label>
            <select className="mps-select" value={color} onChange={e => update("color", e.target.value)}>
              <option value="">Select Color</option>
              {colorOpts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE 3: SKYLIGHT MRA FABRIC SELECTOR — Brand → Type → Color
// ─────────────────────────────────────────────────────────────
function SkylightFabricSelector({ fabricBrand, fabricType, fabricColor, onChange }) {
  const brands    = SKYLIGHT_FABRIC_BRANDS;
  const types     = fabricBrand ? (SKYLIGHT_FABRIC_TYPES[fabricBrand] || []) : [];

  const update = (field, value) => {
    const next = { fabricBrand, fabricType, fabricColor, [field]: value };
    if (field === "fabricBrand") { next.fabricType = ""; next.fabricColor = ""; }
    if (field === "fabricType")  { next.fabricColor = ""; }
    onChange(next);
  };

  return (
    <div className="fabric-selector">
      <div className="fabric-selector-label">
        <span className="mps-label">Fabric</span>
        {fabricBrand && fabricType && (
          <span className="fabric-label-badge">
            {[fabricBrand, fabricType, fabricColor].filter(Boolean).join(" › ")}
          </span>
        )}
      </div>
      <div className="fabric-cascade-grid">
        <div className="mps-field">
          <label className="mps-label fabric-step-label"><span className="fabric-step-num">1</span> Fabric Brand</label>
          <select className="mps-select" value={fabricBrand} onChange={e => update("fabricBrand", e.target.value)}>
            <option value="">Select Brand</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="mps-field">
          <label className="mps-label fabric-step-label"><span className="fabric-step-num">2</span> Fabric Type</label>
          <select className="mps-select" value={fabricType} onChange={e => update("fabricType", e.target.value)} disabled={!fabricBrand}>
            <option value="">{fabricBrand ? "Select Type" : "— select brand first —"}</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {fabricBrand && fabricType && (
          <div className="mps-field">
            <label className="mps-label fabric-step-label"><span className="fabric-step-num">3</span> Fabric Color</label>
            <input
              className="mps-input"
              type="text"
              value={fabricColor}
              onChange={e => update("fabricColor", e.target.value)}
              placeholder="Enter fabric color / pattern name"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPENING PRICE BADGE
// ─────────────────────────────────────────────────────────────
function OpeningPriceBadge({ opening, productName }) {
  const { width, height } = opening;
  if (!width && !height) return null;
  const result = getMPSOpeningPrice(productName, width, height);
  if (!result.ok) return <div className="opening-price-badge opening-price-badge--error" title={result.message}>⚠ {result.message}</div>;
  return (
    <div className="opening-price-badge opening-price-badge--ok">
      <span className="opening-price-badge__label">Opening price:</span>
      <span className="opening-price-badge__value">{fmt(result.price)}</span>
      <span className="opening-price-badge__hint">(W={toFeetKey(width)}ft × H={toFeetKey(height)}ft)</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// L-CHANNEL ITEM EDITOR
// ─────────────────────────────────────────────────────────────
function LChannelItem({ lc, index, onChange, onRemove, showRemove }) {
  const set  = (field, val) => onChange({ ...lc, [field]: val });
  const cost = calcLChannelCost(lc);
  const isManualOverride = lc.manualPrice !== "" && !isNaN(parseFloat(lc.manualPrice));
  return (
    <div className="structural-item-card">
      <div className="structural-item-header">
        <span className="structural-item-label">L-Channel #{index + 1}</span>
        {showRemove && <button type="button" className="structural-item-remove" onClick={onRemove}>✕ Remove</button>}
      </div>
      <div className="structural-fields-grid">
        <Sel label="Location" value={lc.loc}  options={MPS_DEFAULTS.lChannelLocs}  onChange={v => set("loc", v)} />
        <Sel label="Size"     value={lc.size} options={MPS_DEFAULTS.lChannelSizes} onChange={v => set("size", v)} />
        {lc.size === "Custom" && <Field label="Custom Size" value={lc.customSize} onChange={v => set("customSize", v)} placeholder='e.g. 2"×3"' />}
        <Field label={`Linear Feet (× $${L_CHANNEL_RATE}/LF)`} type="number" value={lc.lf} onChange={v => set("lf", v)} placeholder="e.g. 8" min="0" step="0.5" />
        <Field label="Manual Price Override ($)" type="number" value={lc.manualPrice} onChange={v => set("manualPrice", v)} placeholder="Leave blank to use LF rate" min="0" />
      </div>
      {(lc.lf || isManualOverride) && (
        <div className="structural-calc">
          {isManualOverride
            ? <>L-Channel (manual override): <strong>{fmt(cost)}</strong></>
            : <>L-Channel: {lc.lf} LF × ${L_CHANNEL_RATE} = <strong>{fmt(cost)}</strong></>
          }
        </div>
      )}
      <PhotoUpload label="L-Channel Photo (optional)" value={lc.photo} onChange={v => set("photo", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BUILDOUT ITEM EDITOR
// ─────────────────────────────────────────────────────────────
function BuildoutItem({ bo, index, onChange, onRemove, showRemove }) {
  const set  = (field, val) => onChange({ ...bo, [field]: val });
  const cost = calcBuildoutCost(bo);
  const woodRate     = WOOD_BUILDOUT_RATES[bo.woodSize] || 0;
  const isAlumitube  = bo.type === "Alumitube";
  const isCustomAlumi = bo.isCustomAlumitubeSize;
  return (
    <div className="structural-item-card">
      <div className="structural-item-header">
        <span className="structural-item-label">Buildout #{index + 1}</span>
        {showRemove && <button type="button" className="structural-item-remove" onClick={onRemove}>✕ Remove</button>}
      </div>
      <div className="structural-fields-grid">
        <Sel label="Type" value={bo.type} options={MPS_DEFAULTS.buildoutTypes} onChange={v => set("type", v)} />
        {!isAlumitube && (
          <div className="mps-field">
            <label className="mps-label">Wood Size</label>
            <select className="mps-select" value={bo.woodSize} onChange={e => set("woodSize", e.target.value)}>
              {MPS_DEFAULTS.woodSizes.map(s => <option key={s} value={s}>{s} — ${WOOD_BUILDOUT_RATES[s]}/LF</option>)}
            </select>
          </div>
        )}
        {isAlumitube && (
          <div className="mps-field">
            <label className="mps-label">Alumitube Size</label>
            <div className="alumitube-size-row">
              <label className="alumitube-radio">
                <input type="radio" checked={!isCustomAlumi} onChange={() => set("isCustomAlumitubeSize", false)} />
                <span>1.5" × 1.5" (${ALUMITUBE_DEFAULT_RATE}/LF)</span>
              </label>
              <label className="alumitube-radio">
                <input type="radio" checked={isCustomAlumi} onChange={() => set("isCustomAlumitubeSize", true)} />
                <span>Custom Size</span>
              </label>
            </div>
          </div>
        )}
        {isAlumitube && isCustomAlumi && <Field label="Custom Alumitube Size" value={bo.customAlumitubeSize} onChange={v => set("customAlumitubeSize", v)} placeholder='e.g. 2"×2"' />}
        {(!isAlumitube || !isCustomAlumi) && (
          <Field
            label={isAlumitube ? `Linear Feet (× $${ALUMITUBE_DEFAULT_RATE}/LF)` : `Linear Feet (× $${woodRate}/LF for ${bo.woodSize})`}
            type="number" value={bo.lf} onChange={v => set("lf", v)} placeholder="e.g. 12" min="0" step="0.5"
          />
        )}
        {isAlumitube && isCustomAlumi && <Field label="Manual Price ($)" type="number" value={bo.customRate} onChange={v => set("customRate", v)} placeholder="Enter total price for custom alumitube" min="0" />}
        <Field label="Dimensions (optional)" value={bo.dims} onChange={v => set("dims", v)} placeholder='e.g. 2"×4"×96"' />
      </div>
      {(bo.lf || bo.customRate) && (
        <div className="structural-calc">
          {isAlumitube && isCustomAlumi
            ? <>Alumitube (custom size, manual price): <strong>{fmt(cost)}</strong></>
            : isAlumitube ? <>Alumitube: {bo.lf} LF × ${ALUMITUBE_DEFAULT_RATE} = <strong>{fmt(cost)}</strong></>
            : <>Wood ({bo.woodSize}): {bo.lf} LF × ${woodRate} = <strong>{fmt(cost)}</strong></>
          }
        </div>
      )}
      <PhotoUpload label="Buildout Photo (optional)" value={bo.photo} onChange={v => set("photo", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPENING EDITOR
// ─────────────────────────────────────────────────────────────
function OpeningEditor({ opening, index, areaDefaults, productName, onChange, onRemove, showRemove }) {
  const structural   = calcOpeningStructural(opening, areaDefaults);
  const openingPrice = calcOpeningBasePrice(opening, productName);
  const openingTotal = openingPrice + structural;
  const set = (field, val) => onChange({ ...opening, [field]: val });

  const effectiveMount      = opening.mountOverride      || areaDefaults.mountType      || "—";
  const effectiveTrack      = opening.trackOverride      || areaDefaults.trackType      || "—";
  const effectiveMotor      = opening.motorOverride      || areaDefaults.motorType      || "—";
  const effectiveWeightBar  = opening.weightBarOverride  || areaDefaults.weightBar      || "—";
  const effectiveCassette   = opening.colorOverride      || areaDefaults.cassetteColor  || "";
  const effectiveTrackColor = opening.trackColorOverride || areaDefaults.trackColor     || "";

  const effectiveFabric = (opening.fabricSelection?.brand)
    ? opening.fabricSelection
    : (areaDefaults.fabricSelection?.brand ? areaDefaults.fabricSelection : null);
  const effectiveFabricLabel = effectiveFabric ? buildFabricLabel(effectiveFabric) : "—";

  const stormRailCost     = calcStormRailCost(opening, effectiveTrack);
  const cassIsCustom      = effectiveCassette.toLowerCase().includes("custom");
  const effectiveMotorId  = opening.motorId || getDefaultMotorId(productName) || "";
  const motorObj          = MOTOR_CATALOG.find(m => m.id === effectiveMotorId);
  const motorAdj          = motorObj?.priceAdjustment || 0;

  // CHANGE 2: Track color visibility — hidden for Wire Guide
  const showTrackColor = effectiveTrack !== "Wire Guide";

  const addLChannel    = () => set("lChannels", [...(opening.lChannels || []), createLChannel()]);
  const updateLChannel = (id, updated) => set("lChannels", (opening.lChannels || []).map(lc => lc.id === id ? updated : lc));
  const removeLChannel = (id) => set("lChannels", (opening.lChannels || []).filter(lc => lc.id !== id));
  const addBuildout    = () => set("buildouts", [...(opening.buildouts || []), createBuildout()]);
  const updateBuildout = (id, updated) => set("buildouts", (opening.buildouts || []).map(bo => bo.id === id ? updated : bo));
  const removeBuildout = (id) => set("buildouts", (opening.buildouts || []).filter(bo => bo.id !== id));

  const lChannels = opening.lChannels || [];
  const buildouts = opening.buildouts || [];
  const lChannelTotal = lChannels.reduce((s, lc) => s + calcLChannelCost(lc), 0);
  const buildoutTotal = buildouts.reduce((s, bo) => s + calcBuildoutCost(bo), 0);

  return (
    <div className="opening-card">
      <div className="opening-header">
        <div className="opening-num">Opening {index + 1}</div>
        <div className="opening-label-wrap">
          <input className="opening-label-input" placeholder="Opening label (e.g. Left Bay)"
            value={opening.label} onChange={e => set("label", e.target.value)} />
        </div>
        {structural > 0 && <div className="opening-structural-badge">{fmt(structural)} structural</div>}
        {showRemove && (
          <button type="button" className="opening-remove ctrl-btn-danger" onClick={onRemove} title="Delete this opening">
            🗑 Delete Opening
          </button>
        )}
      </div>

      <div className="opening-grid-3">
        <Field label="Width (ft or inches)" type="number" value={opening.width} onChange={v => set("width", v)} placeholder='e.g. 10 (ft) or 120 (in)' min="0" required />
        <Field label="Height (ft or inches)" type="number" value={opening.height} onChange={v => set("height", v)} placeholder='e.g. 8 (ft) or 96 (in)' min="0" required />
        <Sel label="Motor Side" value={opening.motorSide} options={MPS_DEFAULTS.motorSides} onChange={v => set("motorSide", v)} required />
      </div>

      <OpeningPriceBadge opening={opening} productName={productName} />

      <div className="motor-selector-row">
        <MotorSelector motorId={effectiveMotorId} productName={productName} onChange={v => set("motorId", v)} />
        {motorAdj < 0 && (
          <div className="motor-adjustment-badge motor-adjustment-badge--credit">
            Motor credit applied: <strong>{fmt(motorAdj)}</strong> (deducted from total)
          </div>
        )}
        {motorAdj > 0 && (
          <div className="motor-adjustment-badge motor-adjustment-badge--extra">
            Motor upcharge: <strong>+{fmt(motorAdj)}</strong>
          </div>
        )}
      </div>

      {effectiveTrack === "Storm Rail" && (
        <div className="storm-rail-badge">
          ⚡ Storm Rail: {toFeetKey(opening.height) || "—"}ft height × ${STORM_RAIL_RATE}/LF = <strong>{fmt(stormRailCost)}</strong>
          {!opening.height && <span className="storm-rail-hint"> (enter height to calculate)</span>}
        </div>
      )}

      <details className="override-details" open>
        <summary className="override-summary">
          🧵 Fabric Selection
          <span className="override-hint">(Effective: <strong>{effectiveFabricLabel}</strong>)</span>
        </summary>
        <div className="override-resolved-info">Defaults to the Area fabric selection. Set here to override for this opening only.</div>
        <FabricSelector fabricSelection={opening.fabricSelection} onChange={v => set("fabricSelection", v)} label="Opening Fabric Override" />
      </details>

      <details className="override-details" open>
        <summary className="override-summary">
          ⚙ Opening Settings
          <span className="override-hint">(Mount: <strong>{effectiveMount}</strong> · Track: <strong>{effectiveTrack}</strong> · Motor: <strong>{effectiveMotor}</strong>)</span>
        </summary>
        <div className="override-resolved-info">These settings default to the Area values above. Change any field here to override for this opening only.</div>
        <div className="override-resolved-grid">

          {/* Mount Type */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Mount Type
              {opening.mountOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select className={`override-resolved-select ${opening.mountOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.mountOverride || ""} onChange={e => set("mountOverride", e.target.value)}>
              <option value="">— area default ({areaDefaults.mountType || "not set"}) —</option>
              {MPS_DEFAULTS.mountTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Track Type */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Track Type
              {opening.trackOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select className={`override-resolved-select ${opening.trackOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.trackOverride || ""} onChange={e => set("trackOverride", e.target.value)}>
              <option value="">— area default ({areaDefaults.trackType || "not set"}) —</option>
              {MPS_DEFAULTS.trackTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Motor Type (legacy) */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Motor Type (legacy)
              {opening.motorOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select className={`override-resolved-select ${opening.motorOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.motorOverride || ""} onChange={e => set("motorOverride", e.target.value)}>
              <option value="">— area default ({areaDefaults.motorType || "not set"}) —</option>
              {MPS_DEFAULTS.motorTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Cassette Color */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Cassette Color
              {opening.colorOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <input
              className={`override-resolved-input ${opening.colorOverride ? "override-resolved-input--set" : "override-resolved-input--default"}`}
              type="text" value={opening.colorOverride || ""}
              placeholder={`area default (${areaDefaults.cassetteColor || "not set"})`}
              onChange={e => set("colorOverride", e.target.value)}
            />
            {cassIsCustom && (
              <div className="custom-color-price-row">
                <span className="custom-color-price-label">Custom Cassette Color Price (based on width):</span>
                <input className="custom-color-price-input" type="number" min="0"
                  value={opening.customCassetteColorPrice || ""} placeholder="Enter $"
                  onChange={e => set("customCassetteColorPrice", e.target.value)} />
                {opening.customCassetteColorPrice && <span className="custom-color-price-value">{fmt(opening.customCassetteColorPrice)}</span>}
              </div>
            )}
          </div>

          {/* CHANGE 2: Track Color — hidden for Wire Guide */}
          {showTrackColor && (
            <div className="override-resolved-item">
              <label className="override-resolved-label">
                Track Color
                {opening.trackColorOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                  : <span className="override-resolved-source">area default</span>}
              </label>
              <input
                className={`override-resolved-input ${opening.trackColorOverride ? "override-resolved-input--set" : "override-resolved-input--default"}`}
                type="text" value={opening.trackColorOverride || ""}
                placeholder={`area default (${areaDefaults.trackColor || "not set"})`}
                onChange={e => set("trackColorOverride", e.target.value)}
              />
              {(opening.trackColorOverride || areaDefaults.trackColor || "").toLowerCase().includes("custom") && (
                <div className="custom-color-price-row">
                  <span className="custom-color-price-label">Custom Track Color Price (based on width):</span>
                  <input className="custom-color-price-input" type="number" min="0"
                    value={opening.customTrackColorPrice || ""} placeholder="Enter $"
                    onChange={e => set("customTrackColorPrice", e.target.value)} />
                  {opening.customTrackColorPrice && <span className="custom-color-price-value">{fmt(opening.customTrackColorPrice)}</span>}
                </div>
              )}
            </div>
          )}

          {/* CHANGE 2: Wire Guide notice when track color hidden */}
          {!showTrackColor && (
            <div className="override-resolved-item">
              <div className="wire-guide-notice">
                <span className="wire-guide-notice-icon">ℹ️</span>
                Track Color is not applicable for <strong>Wire Guide</strong> track type.
              </div>
            </div>
          )}

          {/* Weight Bar Color — shown for ALL track types */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Weight Bar Color
              {opening.weightBarOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select className={`override-resolved-select ${opening.weightBarOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.weightBarOverride || ""} onChange={e => set("weightBarOverride", e.target.value)}>
              <option value="">— area default ({areaDefaults.weightBar || "not set"}) —</option>
              {MPS_DEFAULTS.weightBarTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {(opening.weightBarOverride || areaDefaults.weightBar || "").toLowerCase() === "custom" && (
              <div className="custom-color-price-row">
                <span className="custom-color-price-label">Custom Weight Bar Price (based on width):</span>
                <input className="custom-color-price-input" type="number" min="0"
                  value={opening.customWeightBarColorPrice || ""} placeholder="Enter $"
                  onChange={e => set("customWeightBarColorPrice", e.target.value)} />
                {opening.customWeightBarColorPrice && <span className="custom-color-price-value">{fmt(opening.customWeightBarColorPrice)}</span>}
              </div>
            )}
          </div>

        </div>
      </details>

      {/* L-Channels */}
      <div className="structural-section">
        <div className="structural-section-header">
          <span className="mps-label">L-Channels</span>
          {lChannelTotal > 0 && <span className="structural-section-total">{fmt(lChannelTotal)} total</span>}
          <button type="button" className="structural-add-btn" onClick={addLChannel}>+ Add L-Channel</button>
        </div>
        {lChannels.length === 0 && <div className="structural-empty">No L-channels added. Click "Add L-Channel" if required.</div>}
        {lChannels.map((lc, idx) => (
          <LChannelItem key={lc.id} lc={lc} index={idx}
            onChange={updated => updateLChannel(lc.id, updated)}
            onRemove={() => removeLChannel(lc.id)} showRemove={true} />
        ))}
      </div>

      {/* Buildouts */}
      <div className="structural-section">
        <div className="structural-section-header">
          <span className="mps-label">Buildouts</span>
          {buildoutTotal > 0 && <span className="structural-section-total">{fmt(buildoutTotal)} total</span>}
          <button type="button" className="structural-add-btn" onClick={addBuildout}>+ Add Buildout</button>
        </div>
        {buildouts.length === 0 && <div className="structural-empty">No buildouts added. Click "Add Buildout" if required.</div>}
        {buildouts.map((bo, idx) => (
          <BuildoutItem key={bo.id} bo={bo} index={idx}
            onChange={updated => updateBuildout(bo.id, updated)}
            onRemove={() => removeBuildout(bo.id)} showRemove={true} />
        ))}
      </div>

      <div className="opening-photo-row">
        <PhotoUpload label="Opening Photo" value={opening.openingPhoto} onChange={v => set("openingPhoto", v)} />
      </div>

      {openingTotal > 0 && (
        <div className="opening-total">
          {openingPrice > 0 && structural > 0
            ? <>Opening Total: <strong>{fmt(openingTotal)}</strong> ({fmt(openingPrice)} product + {fmt(structural)} structural)</>
            : openingPrice > 0 ? <>Opening Total: <strong>{fmt(openingPrice)}</strong></>
            : <>Structural Adjustments: <strong>{fmt(structural)}</strong></>
          }
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AREA EDITOR
// ─────────────────────────────────────────────────────────────
function AreaEditor({ area, areaIndex, productName, onChange, onRemove, showRemove }) {
  const areaBaseTotal       = area.openings.reduce((s,o) => s + calcOpeningBasePrice(o, productName), 0);
  const areaStructuralTotal = calcAreaStructuralOnly(area);
  const areaGrandTotal      = areaBaseTotal + areaStructuralTotal;
  const setArea = (field, val) => onChange({ ...area, [field]: val });

  const setOpening = useCallback((openingId, updated) => {
    onChange({ ...area, openings: area.openings.map(o => o.id === openingId ? updated : o) });
  }, [area, onChange]);

  const addOpening    = () => onChange({ ...area, openings: [...area.openings, createOpening(productName, { motorSide: "Left" })] });
  const removeOpening = (id) => onChange({ ...area, openings: area.openings.filter(o => o.id !== id) });

  // CHANGE 2: effective track for this area — determines track color visibility at area level
  const areaEffectiveTrack = area.trackType || "";
  const showAreaTrackColor = areaEffectiveTrack !== "Wire Guide";

  return (
    <div className="area-card">
      <div className="area-header">
        <div className="area-header-left">
          <div className="area-badge">Area {areaIndex + 1}</div>
          <input className="area-name-input" placeholder="Area Name (e.g. Patio North)"
            value={area.name} onChange={e => setArea("name", e.target.value)} />
        </div>
        <div className="area-header-right">
          {areaGrandTotal > 0 && (
            <div className="area-structural-total">
              {areaBaseTotal > 0 && areaStructuralTotal > 0
                ? `${fmt(areaGrandTotal)} total (${fmt(areaBaseTotal)} product + ${fmt(areaStructuralTotal)} structural)`
                : areaBaseTotal > 0 ? `${fmt(areaBaseTotal)} product`
                : `+${fmt(areaStructuralTotal)} structural`
              }
            </div>
          )}
          {showRemove && (
            <button type="button" className="area-remove ctrl-btn-danger" onClick={onRemove} title="Delete this area">
              🗑 Delete Area
            </button>
          )}
        </div>
      </div>

      <div className="area-defaults">
        <div className="area-defaults-label">Area Defaults (auto-populated per opening — override per opening below)</div>
        <div className="area-defaults-grid">
          <div className="mps-field">
            <label className="mps-label">Product</label>
            <div className="mps-input mps-input--readonly">{productName}</div>
          </div>
          <Sel label="Mount Type"  value={area.mountType}  options={MPS_DEFAULTS.mountTypes}  onChange={v=>setArea("mountType",v)} />
          <Sel label="Track Type"  value={area.trackType}  options={MPS_DEFAULTS.trackTypes}  onChange={v=>setArea("trackType",v)} />
          <Field label="Cassette Color" value={area.cassetteColor} onChange={v=>setArea("cassetteColor",v)} placeholder="e.g. White or Custom" />

          {/* CHANGE 2: Track Color hidden for Wire Guide at area level */}
          {showAreaTrackColor ? (
            <Field label="Track Color" value={area.trackColor} onChange={v=>setArea("trackColor",v)} placeholder="e.g. Beige or Custom" />
          ) : (
            <div className="mps-field">
              <label className="mps-label">Track Color</label>
              <div className="wire-guide-notice-inline">N/A — Wire Guide selected</div>
            </div>
          )}

          <Sel label="Motor Type"  value={area.motorType}  options={MPS_DEFAULTS.motorTypes}  onChange={v=>setArea("motorType",v)} />
          {/* CHANGE 2: Weight Bar always shown for all track types */}
          <Sel label="Weight Bar Color" value={area.weightBar || ""} options={MPS_DEFAULTS.weightBarTypes} onChange={v=>setArea("weightBar",v)} placeholder="Select Weight Bar Color" />
        </div>

        <div className="area-fabric-section">
          <div className="area-defaults-label" style={{marginTop: "12px"}}>Area Default Fabric (openings inherit this unless overridden)</div>
          <FabricSelector
            fabricSelection={area.fabricSelection || { brand: "", series: "", openness: "", color: "" }}
            onChange={v => setArea("fabricSelection", v)}
            label="Area Fabric Default"
          />
        </div>

        <PhotoUpload label="Area Photo (wide shot)" value={area.areaPhoto} onChange={v=>setArea("areaPhoto",v)} />
      </div>

      <div className="openings-container">
        <div className="openings-heading">
          <span>Openings</span>
          <span className="openings-count">{area.openings.length}</span>
          {areaBaseTotal > 0 && <span className="openings-price-total">= {fmt(areaBaseTotal)} product price</span>}
        </div>
        {area.openings.map((opening, idx) => (
          <OpeningEditor key={opening.id} opening={opening} index={idx} areaDefaults={area}
            productName={productName}
            onChange={updated => setOpening(opening.id, updated)}
            onRemove={() => removeOpening(opening.id)}
            showRemove={area.openings.length > 1}
          />
        ))}
        <button type="button" className="add-opening-btn" onClick={addOpening}>+ Add Opening</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE 1 & 2: WIND SENSOR SECTION COMPONENT
// Renders available wind sensors with correct per-opening / global logic
// productName determines which sensors are available
// ─────────────────────────────────────────────────────────────
function WindSensorSection({ productName, windSensorSelections, onWindSensorChange, totalOpenings }) {
  const availableSensors = getAvailableWindSensors(productName);
  const totalCost = calcWindSensorTotal(windSensorSelections, totalOpenings);

  const toggle = (sensorType) => {
    onWindSensorChange({ ...windSensorSelections, [sensorType]: !windSensorSelections?.[sensorType] });
  };

  return (
    <div className="wind-sensor-section">
      <div className="wind-sensor-section-title">
        <span className="ps-addons-icon">💨</span> Wind Sensors
        {totalCost > 0 && <span className="ps-addons-running-total">+{fmt(totalCost)} selected</span>}
      </div>

      {availableSensors.map(sensor => {
        const isWired    = sensor.id === WIND_SENSOR_WIRED.id;
        const isWireless = sensor.id === WIND_SENSOR_WIRELESS.id;
        const sensorKey  = isWired ? "wired" : "wireless";
        const isChecked  = !!windSensorSelections?.[sensorKey];
        const qty        = isWireless ? Math.max(1, totalOpenings) : 1;
        const linePrice  = sensor.price * qty;

        return (
          <label key={sensor.id} className={`ps-addon-item wind-sensor-item ${isChecked ? "ps-addon-checked" : ""}`}>
            <input type="checkbox" className="ps-addon-checkbox" checked={isChecked} onChange={() => toggle(sensorKey)} />
            <div className="ps-addon-content">
              <span className="ps-addon-name">{sensor.name}</span>
              <span className="wind-sensor-type-badge wind-sensor-type-badge--{sensorKey}">
                {isWired ? "🔌 Wired — Global (shared)" : "📡 Wireless — Per Opening"}
              </span>
              <span className="ps-addon-price">
                {isWireless && totalOpenings > 1
                  ? <>{fmt(sensor.price)} × {qty} openings = <strong>{fmt(linePrice)}</strong></>
                  : fmt(linePrice)
                }
              </span>
              <span className="wind-sensor-desc">{sensor.description}</span>
            </div>
            {isChecked && <span className="ps-addon-check-mark">✓</span>}
          </label>
        );
      })}

      {availableSensors.length === 1 && availableSensors[0].id === WIND_SENSOR_WIRED.id && (
        <div className="wind-sensor-cassette-note">
          <span className="wind-sensor-cassette-note-icon">ℹ️</span>
          Only the <strong>Wired Wind Sensor (Eolis RTS 24V)</strong> is compatible with cassette products.
          The wireless Eolis 3D sensor is not available for this configuration.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNATURE PAD COMPONENT
// ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos   = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (value) {
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
      img.src = value; setIsEmpty(false);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height); setIsEmpty(true);
    }
  }, [value]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault(); isDrawing.current = true;
    const canvas = canvasRef.current; lastPos.current = getPos(e, canvas);
    const ctx = canvas.getContext("2d"); ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
  };

  const draw = (e) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d"); const pos = getPos(e, canvas);
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastPos.current = pos; setIsEmpty(false);
  };

  const endDraw = () => {
    if (!isDrawing.current) return; isDrawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clearSig = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onChange(null); setIsEmpty(true);
  };

  return (
    <div className="signature-pad-wrapper">
      <div className="signature-pad-header">
        <span className="signature-pad-label">✍️ Customer Signature</span>
        {!isEmpty && <button type="button" className="signature-clear-btn" onClick={clearSig}>Clear</button>}
      </div>
      <div className="signature-canvas-container">
        <canvas ref={canvasRef} width={600} height={160}
          className={`signature-canvas ${isEmpty ? "signature-canvas--empty" : "signature-canvas--signed"}`}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {isEmpty && <div className="signature-placeholder">Sign here</div>}
      </div>
      <p className="signature-pad-hint">Draw your signature above using mouse or touch</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MPS PRODUCT CARD
// ─────────────────────────────────────────────────────────────
function MPSProductCard({
  line, index, snapshot, mpsData, onMPSChange,
  addonSelections, onAddonToggle,
  windSensorSelections, onWindSensorChange,
  productNotes, onProductNoteChange,
}) {
  const qty   = parseInt(line.quantity, 10) || 1;
  const areas = mpsData[line.id] || [];
  const setAreas   = (a) => onMPSChange(line.id, a);
  const addArea    = () => setAreas([...areas, createArea(line.product)]);
  const updateArea = (id, u) => setAreas(areas.map(a => a.id === id ? u : a));
  const removeArea = (id) => setAreas(areas.filter(a => a.id !== id));

  const openingsProductTotal = calcMPSOpeningsTotal(areas, line.product);
  const structuralTotal      = areas.reduce((s,a) => s + calcAreaStructuralOnly(a), 0);
  const selected             = addonSelections[line.id] || {};
  const totalOpenings        = countTotalOpenings(areas);
  const autoRemoteName       = getAutoRemote(totalOpenings > 0 ? totalOpenings : 1);

  const simpleAddonTotal = MPS_SIMPLE_ADDONS.reduce((s, a) => selected[a.id] ? s + a.price * qty : s, 0);

  // CHANGE 1: wind sensor total for this line
  const windTotal = calcWindSensorTotal(windSensorSelections[line.id], totalOpenings);

  const enriched              = snapshot.productLines.find(l => l.id === line.id);
  const appBaseTotal          = enriched?.pricing?.lineSubtotal || 0;
  const effectiveProductTotal = openingsProductTotal > 0 ? openingsProductTotal : appBaseTotal;
  const grandLineTotal        = effectiveProductTotal + structuralTotal + simpleAddonTotal + windTotal;
  const hasUnpriced = areas.some(a => a.openings.some(o => (o.width || o.height) && !getMPSOpeningPrice(line.product, o.width, o.height).ok));

  const handleReset = () => {
    if (window.confirm("Reset all areas, openings, and add-ons for this product? This cannot be undone.")) {
      onMPSChange(line.id, []);
      onAddonToggle(line.id, "__RESET__");
      onWindSensorChange(line.id, {});
    }
  };

  const defaultMotorId = getDefaultMotorId(line.product);
  const defaultMotor   = MOTOR_CATALOG.find(m => m.id === defaultMotorId);

  return (
    <div className="ps-product-card mps-product-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">{line.product}</div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>

      <div className="quote-tool-controls">
        <span className="quote-tool-controls-label">🛠 Quote Tool Controls</span>
        <button type="button" className="ctrl-btn ctrl-btn-reset" onClick={handleReset} title="Reset all areas and openings for this product">
          ↺ Reset Quote Tool
        </button>
      </div>

      {defaultMotor && (
        <div className="motor-info-banner">
          <span className="motor-info-icon">⚡</span>
          <div className="motor-info-content">
            <span className="motor-info-title">Default Motor: <strong>{defaultMotor.displayName}</strong></span>
            <span className="motor-info-sub">{defaultMotor.notes} — Override per opening below if needed</span>
          </div>
        </div>
      )}

      <div className="ps-detail-grid">
        {[
          {label:"Product Name", value:line.product},
          {label:"Category",     value:line.category},
          {label:"Base Size",    value:`${line.width||"—"} × ${line.height||"—"}`},
          {label:"Quantity",     value:line.quantity},
          {label:"Operation",    value:line.operation, capitalize:true}
        ].map(({label,value,capitalize}) => (
          <div className="ps-detail-item" key={label}>
            <span className="ps-detail-label">{label}</span>
            <span className="ps-detail-value" style={capitalize?{textTransform:"capitalize"}:{}}>{value}</span>
          </div>
        ))}
      </div>

      <div className="product-note-section">
        <label className="mps-label">📝 Product Notes</label>
        <textarea className="product-note-textarea"
          placeholder="Add any important notes about this product (e.g. special instructions, site conditions, client preferences)…"
          value={productNotes || ""} onChange={e => onProductNoteChange(line.id, e.target.value)} rows={3} />
      </div>

      {enriched?.pricing?.priceNote && <div className="ps-price-note">💡 Reference (from intake form): {enriched.pricing.priceNote}</div>}
      {hasUnpriced && <div className="ps-price-note ps-price-note--warn">⚠ Some openings have dimensions that don't match the price matrix.</div>}

      {totalOpenings > 0 && (
        <div className="auto-remote-badge">
          <span className="auto-remote-icon">🎛</span>
          <span className="auto-remote-text">
            Recommended Remote: <strong>{autoRemoteName}</strong> ({totalOpenings} opening{totalOpenings !== 1 ? "s" : ""}) — <em>included, no extra charge</em>
          </span>
        </div>
      )}

      <div className="mps-builder">
        <div className="mps-builder-header">
          <div className="mps-builder-title">
            <span className="mps-builder-icon">🗂</span> Area &amp; Opening Configuration
            <span className="mps-builder-hint">— Enter width &amp; height per opening to auto-price from matrix</span>
          </div>
          <div className="mps-totals-row">
            {openingsProductTotal > 0 && <div className="mps-structural-total mps-product-from-openings">Openings product total: <strong>{fmt(openingsProductTotal)}</strong></div>}
            {structuralTotal      > 0 && <div className="mps-structural-total">Structural: <strong>{fmt(structuralTotal)}</strong></div>}
          </div>
        </div>
        {areas.length === 0
          ? <div className="mps-empty-state"><p>No areas configured yet. Add an area to specify openings.</p></div>
          : areas.map((area, idx) => (
              <AreaEditor key={area.id} area={area} areaIndex={idx} productName={line.product}
                onChange={u => updateArea(area.id, u)}
                onRemove={() => removeArea(area.id)}
                showRemove={areas.length > 1}
              />
            ))
        }
        <button type="button" className="add-area-btn" onClick={addArea}>+ Add Area</button>
      </div>

      {/* CHANGE 1 & 2: Wind Sensor Section with corrected product-aware logic */}
      <WindSensorSection
        productName={line.product}
        windSensorSelections={windSensorSelections[line.id] || {}}
        onWindSensorChange={(updated) => onWindSensorChange(line.id, updated)}
        totalOpenings={totalOpenings}
      />

      <div className="mps-simple-addons">
        <div className="mps-simple-addons-title">
          <span className="ps-addons-icon">✦</span> Accessories &amp; Add-ons
          {simpleAddonTotal > 0 && <span className="ps-addons-running-total">+{fmt(simpleAddonTotal)} selected</span>}
        </div>
        <div className="ps-addons-grid">
          {MPS_SIMPLE_ADDONS.map(addon => {
            const isChecked = !!selected[addon.id];
            return (
              <label key={addon.id} className={`ps-addon-item ${isChecked ? "ps-addon-checked" : ""}`}>
                <input type="checkbox" className="ps-addon-checkbox" checked={isChecked} onChange={() => onAddonToggle(line.id, addon.id)} />
                <div className="ps-addon-content">
                  <span className="ps-addon-name">{addon.name}</span>
                  <span className="ps-addon-price">+{fmt(addon.price)}{qty > 1 && <span className="ps-addon-per-unit"> × {qty} = {fmt(addon.price*qty)}</span>}</span>
                </div>
                {isChecked && <span className="ps-addon-check-mark">✓</span>}
              </label>
            );
          })}
        </div>
      </div>

      <div className="mps-line-total">
        {openingsProductTotal > 0 ? <span>Openings Price: {fmt(openingsProductTotal)}</span> : <span>Base Price (from form): {fmt(appBaseTotal)}</span>}
        {simpleAddonTotal > 0 && <span>+ Add-ons: {fmt(simpleAddonTotal)}</span>}
        {windTotal        > 0 && <span>+ Wind Sensor(s): {fmt(windTotal)}</span>}
        {structuralTotal  > 0 && <span>+ Structural: {fmt(structuralTotal)}</span>}
        {totalOpenings > 0 && <span className="mps-remote-info-line">Remote included: {autoRemoteName}</span>}
        <span className="mps-line-grand">Line Total: {fmt(grandLineTotal)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE 3: SKYLIGHT PLUS MRA CARD
// Renamed from "Motor B Retractable Awning"
// Locked projection dropdown, feet+inches width, fabric fields,
// auto-transmitter, auto-LED, no user-selectable transmitter/LED checkboxes
// ─────────────────────────────────────────────────────────────
function SkylightMRACard({
  line, index, snapshot,
  skylightConfig, onSkylightConfigChange,
  fieldAddonValues, onFieldAddonChange,
  productNotes, onProductNoteChange,
  totalAwningQty,
}) {
  const cfg = skylightConfig[line.id] || createSkylightMRAConfig();
  const setConfig = (updates) => onSkylightConfigChange(line.id, { ...cfg, ...updates });

  const qty = parseInt(line.quantity, 10) || 1;

  // CHANGE 3: Auto-assigned transmitter based on total awning qty in order
  const autoTransmitter = getAutoTransmitter(totalAwningQty);

  // Field addons for Skylight Plus MRA (Somfy RTS, brackets, etc.)
  const fieldAddonDefs = getFieldAddonsForProduct("Skylight Plus MRA");
  const fieldTotal     = calcFieldAddonTotal(fieldAddonValues, "Skylight Plus MRA");

  const enriched  = snapshot.productLines.find(l => l.id === line.id);
  const baseTotal = enriched?.pricing?.lineSubtotal || 0;
  const grandLineTotal = baseTotal + fieldTotal;

  return (
    <div className="ps-product-card skylight-mra-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">
          Skylight Plus MRA
          <span className="skylight-mra-badge">Motorized Retractable Awning</span>
        </div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>

      {/* Auto-included items banner */}
      <div className="skylight-included-banner">
        <div className="skylight-included-title">✅ Standard Included Items (Auto-Assigned)</div>
        <div className="skylight-included-grid">
          <div className="skylight-included-item">
            <span className="skylight-included-icon">🎛</span>
            <div className="skylight-included-content">
              <span className="skylight-included-name">Transmitter</span>
              <span className="skylight-included-value">{autoTransmitter}</span>
              <span className="skylight-included-hint">
                Auto-assigned based on {totalAwningQty} total awning{totalAwningQty !== 1 ? "s" : ""} in order
                {totalAwningQty <= 2 ? " (1–2 units → 5-channel)" : " (3–7 units → 16-channel)"}
              </span>
            </div>
          </div>
          <div className="skylight-included-item">
            <span className="skylight-included-icon">💡</span>
            <div className="skylight-included-content">
              <span className="skylight-included-name">LED Lighting</span>
              <span className="skylight-included-value">Built-in LED — Included</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="ps-detail-grid">
        <div className="ps-detail-item"><span className="ps-detail-label">Product</span><span className="ps-detail-value">Skylight Plus MRA</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Category</span><span className="ps-detail-value">{line.category}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Quantity</span><span className="ps-detail-value">{line.quantity}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Operation</span><span className="ps-detail-value" style={{textTransform:"capitalize"}}>{line.operation}</span></div>
      </div>

      <div className="skylight-config-section">
        <div className="skylight-config-title">📐 Awning Configuration</div>
        <div className="skylight-config-grid">

          {/* CHANGE 3: Projection — locked dropdown, no free text */}
          <div className="mps-field">
            <label className="mps-label">
              Projection <span className="mps-req">*</span>
              <span className="skylight-field-hint">— select exact projection size</span>
            </label>
            <select
              className="mps-select skylight-projection-select"
              value={cfg.projection}
              onChange={e => setConfig({ projection: e.target.value })}
            >
              <option value="">Select Projection</option>
              {SKYLIGHT_MRA_PROJECTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {cfg.projection && (
              <div className="skylight-projection-note">
                ✓ Projection locked to <strong>{cfg.projection}</strong> — pricing tier confirmed
              </div>
            )}
          </div>

          {/* CHANGE 3: Width — feet + inches format, same as MPS */}
          <div className="mps-field skylight-width-field">
            <label className="mps-label">
              Width <span className="mps-req">*</span>
              <span className="skylight-field-hint">— enter feet and inches</span>
            </label>
            <div className="skylight-width-inputs">
              <div className="skylight-width-input-wrap">
                <input
                  className="mps-input skylight-dim-input"
                  type="number"
                  value={cfg.widthFt}
                  onChange={e => setConfig({ widthFt: e.target.value })}
                  placeholder="0"
                  min="0"
                />
                <span className="skylight-dim-unit">ft</span>
              </div>
              <div className="skylight-width-input-wrap">
                <input
                  className="mps-input skylight-dim-input"
                  type="number"
                  value={cfg.widthIn}
                  onChange={e => setConfig({ widthIn: e.target.value })}
                  placeholder="0"
                  min="0"
                  max="11"
                />
                <span className="skylight-dim-unit">in</span>
              </div>
            </div>
            {(cfg.widthFt || cfg.widthIn) && (
              <div className="skylight-width-display">
                Width: <strong>{cfg.widthFt || 0}' {cfg.widthIn || 0}"</strong>
              </div>
            )}
          </div>
        </div>

        {/* CHANGE 3: Fabric selection */}
        <div className="skylight-fabric-section">
          <div className="skylight-config-title" style={{marginTop:"16px"}}>🧵 Fabric Selection</div>
          <SkylightFabricSelector
            fabricBrand={cfg.fabricBrand}
            fabricType={cfg.fabricType}
            fabricColor={cfg.fabricColor}
            onChange={({ fabricBrand, fabricType, fabricColor }) =>
              setConfig({ fabricBrand, fabricType, fabricColor })
            }
          />
        </div>
      </div>

      <div className="product-note-section">
        <label className="mps-label">📝 Product Notes</label>
        <textarea className="product-note-textarea"
          placeholder="Add any important notes about this awning (e.g. mounting location, special instructions, site conditions)…"
          value={productNotes || ""} onChange={e => onProductNoteChange(line.id, e.target.value)} rows={3} />
      </div>

      {enriched?.pricing?.priceNote && <div className="ps-price-note">💡 {enriched.pricing.priceNote}</div>}

      {/* Field Add-ons (Somfy RTS accessories, brackets — transmitter/LED excluded) */}
      {fieldAddonDefs.length > 0 && (
        <div className="ps-addons-section field-addons-section">
          <div className="ps-addons-title">
            <span className="ps-addons-icon">◆</span> Optional Accessories
            {fieldTotal > 0 && <span className="ps-addons-running-total">+{fmt(fieldTotal)} selected</span>}
          </div>
          <div className="field-addons-grid">
            {(() => {
              const groupMap = {};
              fieldAddonDefs.forEach(def => { const g = def.group||"Add-ons"; if (!groupMap[g]) groupMap[g]=[]; groupMap[g].push(def); });
              const groupOrder = [...new Set(fieldAddonDefs.map(d=>d.group||"Add-ons"))];
              return groupOrder.map(groupLabel => (
                <div key={groupLabel} className="field-addon-group">
                  <div className="field-addon-group-header">{groupLabel}</div>
                  {groupMap[groupLabel].map(def => {
                    const val = fieldAddonValues?.[def.id] || {};
                    const enabled = !!val.enabled;
                    const qtyVal = val.qty || "";
                    const customPrice = val.customPrice || "";
                    const isCustom = def.pricingType === "custom";
                    const lineAmt = enabled ? (isCustom ? (parseFloat(customPrice)||0) : def.rate*(parseFloat(qtyVal)||0)) : 0;
                    return (
                      <div key={def.id} className={`field-addon-row ${enabled?"field-addon-active":""}`}>
                        <label className="field-addon-check-label">
                          <input type="checkbox" className="ps-addon-checkbox" checked={enabled}
                            onChange={() => onFieldAddonChange(line.id, def.id, {...val, enabled: !enabled})} />
                          <span className="field-addon-name">{def.name}</span>
                        </label>
                        <div className="field-addon-right">
                          {!isCustom && <div className="field-addon-rate">{fmt(def.rate)} / {def.unitShort}</div>}
                          {enabled && (
                            <div className="field-addon-input-wrap">
                              {isCustom ? (
                                <><span className="field-addon-unit-label">$</span>
                                  <input type="number" className="field-addon-qty-input" value={customPrice} min="0" step="1" placeholder={def.placeholder}
                                    onChange={e => onFieldAddonChange(line.id, def.id, {...val, enabled:true, customPrice:e.target.value})} />
                                  {lineAmt > 0 && <span className="field-addon-line-total">{fmt(lineAmt)}</span>}
                                </>
                              ) : (
                                <><input type="number" className="field-addon-qty-input" value={qtyVal} min="0" step="1" placeholder={def.placeholder}
                                    onChange={e => onFieldAddonChange(line.id, def.id, {...val, enabled:true, qty:e.target.value})} />
                                  <span className="field-addon-unit-label">{def.unit}</span>
                                  {lineAmt > 0 && <span className="field-addon-line-total">{fmt(lineAmt)}</span>}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      <div className="mps-line-total">
        <span>Base Price (from form): {fmt(baseTotal)}</span>
        {fieldTotal > 0 && <span>+ Accessories: {fmt(fieldTotal)}</span>}
        <span className="mps-line-grand">Line Total: {fmt(grandLineTotal)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STANDARD PRODUCT CARD (unchanged)
// ─────────────────────────────────────────────────────────────
function StandardProductCard({ line, index, snapshot, addonSelections, onAddonToggle, fieldAddonValues, onFieldAddonChange, productNotes, onProductNoteChange }) {
  const enriched  = snapshot.productLines.find(l => l.id === line.id);
  const baseTotal = enriched?.pricing?.lineSubtotal || 0;
  const priceNote = enriched?.pricing?.priceNote    || '';
  const qty       = parseInt(line.quantity, 10) || 1;
  const availableAddons   = getAddonsForProduct(line.product);
  const selected          = addonSelections[line.id] || {};
  const summaryAddonTotal = availableAddons.reduce((s, a) => selected[a.id] ? s + a.price * qty : s, 0);
  const fieldAddonDefs    = getFieldAddonsForProduct(line.product);
  const fieldTotal        = calcFieldAddonTotal(fieldAddonValues, line.product);
  const grandLineTotal    = baseTotal + summaryAddonTotal + fieldTotal;

  const details = [
    { label:"Category",       value: line.category          },
    { label:"Product Name",   value: line.product           },
    { label:"Width",          value: line.width     || "—"  },
    { label:"Height / Proj.", value: line.height    || "—"  },
    { label:"Quantity",       value: line.quantity          },
    line.mount  && { label:"Mount Type", value: line.mount  },
    line.fabric && { label:"Fabric",     value: line.fabric },
    line.color  && { label:"Color",      value: line.color  },
    { label:"Operation", value: line.operation, capitalize: true },
  ].filter(Boolean);

  return (
    <div className="ps-product-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">{line.product}</div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>
      <div className="ps-detail-grid">
        {details.map(({ label, value, capitalize }) => (
          <div className="ps-detail-item" key={label}>
            <span className="ps-detail-label">{label}</span>
            <span className="ps-detail-value" style={capitalize?{textTransform:"capitalize"}:{}}>{value}</span>
          </div>
        ))}
      </div>

      <div className="product-note-section">
        <label className="mps-label">📝 Product Notes</label>
        <textarea className="product-note-textarea" placeholder="Add any important notes about this product…"
          value={productNotes || ""} onChange={e => onProductNoteChange(line.id, e.target.value)} rows={3} />
      </div>

      {priceNote && <div className="ps-price-note">💡 {priceNote}</div>}

      {availableAddons.length > 0 && (
        <div className="ps-addons-section">
          <div className="ps-addons-title">
            <span className="ps-addons-icon">✦</span> Available Add-ons
            {summaryAddonTotal > 0 && <span className="ps-addons-running-total">+{fmt(summaryAddonTotal)} selected</span>}
          </div>
          <div className="ps-addons-grid">
            {availableAddons.map(addon => {
              const isChecked = !!selected[addon.id];
              return (
                <label key={addon.id} className={`ps-addon-item ${isChecked?"ps-addon-checked":""}`}>
                  <input type="checkbox" className="ps-addon-checkbox" checked={isChecked} onChange={() => onAddonToggle(line.id, addon.id)} />
                  <div className="ps-addon-content">
                    <span className="ps-addon-name">{addon.name}</span>
                    <span className="ps-addon-price">+{fmt(addon.price)}{qty>1&&<span className="ps-addon-per-unit"> × {qty} = {fmt(addon.price*qty)}</span>}</span>
                  </div>
                  {isChecked && <span className="ps-addon-check-mark">✓</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {fieldAddonDefs.length > 0 && (
        <div className="ps-addons-section field-addons-section">
          <div className="ps-addons-title">
            <span className="ps-addons-icon">&#x25C6;</span> Upgrades &amp; Add-ons
            {fieldTotal > 0 && <span className="ps-addons-running-total">+{fmt(fieldTotal)} selected</span>}
          </div>
          <div className="field-addons-grid">
            {(() => {
              const groupMap = {};
              fieldAddonDefs.forEach(def => { const g = def.group||"Add-ons"; if (!groupMap[g]) groupMap[g]=[]; groupMap[g].push(def); });
              const groupOrder = [...new Set(fieldAddonDefs.map(d=>d.group||"Add-ons"))];
              return groupOrder.map(groupLabel => (
                <div key={groupLabel} className="field-addon-group">
                  <div className="field-addon-group-header">{groupLabel}</div>
                  {groupMap[groupLabel].map(def => {
                    const val = fieldAddonValues?.[def.id] || {};
                    const enabled = !!val.enabled;
                    const qtyVal = val.qty || "";
                    const customPrice = val.customPrice || "";
                    const isCustom = def.pricingType === "custom";
                    const lineAmt = enabled ? (isCustom ? (parseFloat(customPrice)||0) : def.rate*(parseFloat(qtyVal)||0)) : 0;
                    return (
                      <div key={def.id} className={`field-addon-row ${enabled?"field-addon-active":""}`}>
                        <label className="field-addon-check-label">
                          <input type="checkbox" className="ps-addon-checkbox" checked={enabled}
                            onChange={() => onFieldAddonChange(line.id, def.id, {...val, enabled: !enabled})} />
                          <span className="field-addon-name">{def.name}</span>
                        </label>
                        <div className="field-addon-right">
                          {!isCustom && <div className="field-addon-rate">{fmt(def.rate)} / {def.unitShort}</div>}
                          {enabled && (
                            <div className="field-addon-input-wrap">
                              {isCustom ? (
                                <><span className="field-addon-unit-label">$</span>
                                  <input type="number" className="field-addon-qty-input" value={customPrice} min="0" step="1" placeholder={def.placeholder}
                                    onChange={e => onFieldAddonChange(line.id, def.id, {...val, enabled:true, customPrice:e.target.value})} />
                                  {lineAmt > 0 && <span className="field-addon-line-total">{fmt(lineAmt)}</span>}
                                </>
                              ) : (
                                <><input type="number" className="field-addon-qty-input" value={qtyVal} min="0" step={def.pricingType==="per_lf"?"0.5":"1"} placeholder={def.placeholder}
                                    onChange={e => onFieldAddonChange(line.id, def.id, {...val, enabled:true, qty:e.target.value})} />
                                  <span className="field-addon-unit-label">{def.unit}</span>
                                  {lineAmt > 0 && <span className="field-addon-line-total">{fmt(lineAmt)}</span>}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {line.notes && <div className="ps-product-notes"><span className="ps-detail-label">Notes — </span>{line.notes}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function ProductSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const snapshot = location.state?.snapshot;

  const [addonSelections,   setAddonSelections]   = useState(() => loadFromSession()?.addonSelections   || {});
  const [mpsData,           setMpsData]           = useState(() => loadFromSession()?.mpsData           || {});
  const [fieldAddonValues,  setFieldAddonValues]  = useState(() => loadFromSession()?.fieldAddonValues  || {});
  const [productNotes,      setProductNotes]      = useState(() => loadFromSession()?.productNotes      || {});
  const [signature,         setSignature]         = useState(() => loadFromSession()?.signature         || null);
  // CHANGE 1: wind sensor selections — per line { wired: bool, wireless: bool }
  const [windSensorSelections, setWindSensorSelections] = useState(() => loadFromSession()?.windSensorSelections || {});
  // CHANGE 3: Skylight MRA config — per line { width, widthFt, widthIn, projection, fabricBrand, fabricType, fabricColor }
  const [skylightConfig, setSkylightConfig] = useState(() => loadFromSession()?.skylightConfig || {});

  useEffect(() => {
    saveToSession({ addonSelections, mpsData, fieldAddonValues, productNotes, signature, windSensorSelections, skylightConfig });
  }, [addonSelections, mpsData, fieldAddonValues, productNotes, signature, windSensorSelections, skylightConfig]);

  const handleProductNoteChange = (lineId, note) => setProductNotes(prev => ({ ...prev, [lineId]: note }));

  const handleFieldAddonChange = (lineId, addonId, val) =>
    setFieldAddonValues(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), [addonId]: val}}));

  const handleAddonToggle = (lineId, addonId) => {
    if (addonId === "__RESET__") { setAddonSelections(prev => ({ ...prev, [lineId]: {} })); return; }
    setAddonSelections(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), [addonId]: !(prev[lineId]?.[addonId])}}));
  };

  const handleMPSChange = (lineId, areas) => setMpsData(prev => ({...prev, [lineId]: areas}));

  // CHANGE 1: Wind sensor handler
  const handleWindSensorChange = (lineId, selections) =>
    setWindSensorSelections(prev => ({ ...prev, [lineId]: selections }));

  // CHANGE 3: Skylight config handler
  const handleSkylightConfigChange = (lineId, cfg) =>
    setSkylightConfig(prev => ({ ...prev, [lineId]: cfg }));

  const handleGlobalReset = () => {
    if (window.confirm("Reset ALL areas, openings, add-ons, and notes for the entire quote? This cannot be undone.")) {
      setAddonSelections({});
      setMpsData({});
      setFieldAddonValues({});
      setProductNotes({});
      setSignature(null);
      setWindSensorSelections({});
      setSkylightConfig({});
    }
  };

  if (!snapshot) {
    return (
      <div className="ps-page">
        <header className="ps-header"><div className="ps-header-glow"/><div className="ps-header-content"><h1>Product Add on's</h1><p>No order data found.</p></div></header>
        <div className="ps-body"><button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button></div>
      </div>
    );
  }

  const { customer, productLines, discount, orderNotes, lastUpdated } = snapshot;
  const configuredLines = productLines.filter(l => l.category && l.product);

  // CHANGE 3: Count total awning quantity across all awning-type lines for transmitter auto-assignment
  const totalAwningQty = configuredLines
    .filter(l => AWNING_PRODUCTS.includes(l.product) || l.product === "Skylight Plus MRA")
    .reduce((sum, l) => sum + (parseInt(l.quantity, 10) || 1), 0);

  const { subtotalWithAddons, summaryAddonGrandTotal, mpsStructuralGrand, mpsOpeningsProductGrand, windSensorGrand } = useMemo(() => {
    if (!snapshot) return { subtotalWithAddons:0, summaryAddonGrandTotal:0, mpsStructuralGrand:0, mpsOpeningsProductGrand:0, windSensorGrand:0 };
    const configured = snapshot.productLines.filter(l => l.category && l.product);
    let addonGrand=0, structuralGrand=0, openingsGrand=0, appBaseMPSGrand=0, windGrand=0;

    configured.forEach(line => {
      if (MPS_PRODUCTS.includes(line.product)) {
        const areas = mpsData[line.id] || [];
        const openingsTotal = calcMPSOpeningsTotal(areas, line.product);
        structuralGrand += areas.reduce((s,a) => s + calcAreaStructuralOnly(a), 0);
        const qty = parseInt(line.quantity,10)||1;
        const sel = addonSelections[line.id]||{};
        MPS_SIMPLE_ADDONS.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        // CHANGE 1: wind sensor totals
        const totalOpenings = countTotalOpenings(areas);
        windGrand += calcWindSensorTotal(windSensorSelections[line.id], totalOpenings);
        if (openingsTotal > 0) openingsGrand += openingsTotal;
        else { const e = snapshot.productLines.find(l2=>l2.id===line.id); appBaseMPSGrand += e?.pricing?.lineSubtotal||0; }
      } else if (line.product !== "Skylight Plus MRA") {
        const qty = parseInt(line.quantity,10)||1;
        const addons = getAddonsForProduct(line.product);
        const sel = addonSelections[line.id]||{};
        addons.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        addonGrand += calcFieldAddonTotal(fieldAddonValues[line.id], line.product);
      }
      // Skylight MRA: field addons included in base calc inside SkylightMRACard
    });

    const nonMPSOriginal = (snapshot.pricingSummary?.subtotal||0) -
      snapshot.productLines.filter(l=>l.category&&l.product&&MPS_PRODUCTS.includes(l.product))
        .reduce((s,l)=>{ const e=snapshot.productLines.find(l2=>l2.id===l.id); return s+(e?.pricing?.lineSubtotal||0); },0);

    return {
      summaryAddonGrandTotal:  addonGrand,
      mpsStructuralGrand:      structuralGrand,
      mpsOpeningsProductGrand: openingsGrand,
      windSensorGrand:         windGrand,
      subtotalWithAddons: nonMPSOriginal + openingsGrand + appBaseMPSGrand + addonGrand + structuralGrand + windGrand,
    };
  }, [snapshot, addonSelections, mpsData, fieldAddonValues, windSensorSelections]);

  const discountPercent = snapshot?.pricingSummary?.discountPercent || 0;
  const discountAmount  = subtotalWithAddons * (discountPercent / 100);
  const grandTotal      = subtotalWithAddons - discountAmount;

  return (
    <div className="ps-page">
      <header className="ps-header">
        <div className="ps-header-glow"/>
        <div className="ps-header-content">
          <h1>Product Add on's</h1>
          <p>Review your order, configure areas &amp; openings, and select add-ons</p>
        </div>
      </header>

      <div className="ps-body">
        <div className="ps-nav-row">
          <button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button>
          <div className="ps-nav-row-right">
            <span className="ps-last-updated">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
            <button className="ps-btn ctrl-btn-reset ctrl-btn-global-reset" onClick={handleGlobalReset} title="Reset entire quote tool">
              ↺ Reset Quote Tool
            </button>
          </div>
        </div>

        <section className="ps-card">
          <div className="ps-card-heading"><span className="ps-card-icon">👤</span><h2>Customer Information</h2></div>
          <div className="ps-customer-grid">
            {[{label:"Full Name",value:customer.name},{label:"Email Address",value:customer.email},{label:"Phone",value:customer.phone},{label:"Installation Address",value:customer.address}]
              .map(({label,value}) => (
                <div className="ps-customer-item" key={label}>
                  <span className="ps-detail-label">{label}</span>
                  <span className="ps-detail-value">{value||"—"}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="ps-card">
          <div className="ps-card-heading"><span className="ps-card-icon">📦</span><h2>Products <span className="ps-badge">{configuredLines.length}</span></h2></div>
          {configuredLines.length === 0 ? <p className="ps-empty">No products configured yet.</p> : (
            <div className="ps-products-list">
              {configuredLines.map((line, idx) => {
                // CHANGE 3: Route "Skylight Plus MRA" (and legacy "Motor B Retractable Awning") to SkylightMRACard
                const isSkylightMRA = line.product === "Skylight Plus MRA" || line.product === "Motor B Retractable Awning";

                if (isSkylightMRA) {
                  return (
                    <SkylightMRACard
                      key={line.id}
                      line={{ ...line, product: "Skylight Plus MRA" }} // normalize name
                      index={idx}
                      snapshot={snapshot}
                      skylightConfig={skylightConfig}
                      onSkylightConfigChange={handleSkylightConfigChange}
                      fieldAddonValues={fieldAddonValues[line.id] || {}}
                      onFieldAddonChange={handleFieldAddonChange}
                      productNotes={productNotes[line.id]}
                      onProductNoteChange={handleProductNoteChange}
                      totalAwningQty={totalAwningQty}
                    />
                  );
                }

                if (MPS_PRODUCTS.includes(line.product)) {
                  return (
                    <MPSProductCard
                      key={line.id}
                      line={line}
                      index={idx}
                      snapshot={snapshot}
                      mpsData={mpsData}
                      onMPSChange={handleMPSChange}
                      addonSelections={addonSelections}
                      onAddonToggle={handleAddonToggle}
                      windSensorSelections={windSensorSelections}
                      onWindSensorChange={handleWindSensorChange}
                      productNotes={productNotes[line.id]}
                      onProductNoteChange={handleProductNoteChange}
                    />
                  );
                }

                return (
                  <StandardProductCard
                    key={line.id}
                    line={line}
                    index={idx}
                    snapshot={snapshot}
                    addonSelections={addonSelections}
                    onAddonToggle={handleAddonToggle}
                    fieldAddonValues={fieldAddonValues[line.id]||{}}
                    onFieldAddonChange={handleFieldAddonChange}
                    productNotes={productNotes[line.id]}
                    onProductNoteChange={handleProductNoteChange}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="ps-card ps-pricing-card">
          <div className="ps-card-heading"><span className="ps-card-icon">💰</span><h2>Pricing Summary</h2></div>
          <div className="ps-pricing-table">
            <div className="ps-pricing-row"><span>Product Subtotal</span><span>{fmt(snapshot.pricingSummary?.subtotal)}</span></div>
            {mpsOpeningsProductGrand > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>MPS Opening-Based Pricing (replaces base)</span><span className="ps-addon-highlight">{fmt(mpsOpeningsProductGrand)}</span></div>}
            {summaryAddonGrandTotal  > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Selected Add-ons</span><span className="ps-addon-highlight">+{fmt(summaryAddonGrandTotal)}</span></div>}
            {windSensorGrand         > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Wind Sensor(s)</span><span className="ps-addon-highlight">+{fmt(windSensorGrand)}</span></div>}
            {mpsStructuralGrand      > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Structural Adjustments (L-Channel / Buildout / Storm Rail / Custom Color)</span><span className="ps-addon-highlight">+{fmt(mpsStructuralGrand)}</span></div>}
            <div className="ps-pricing-row ps-subtotal-addons-row"><span>Subtotal (incl. all adjustments)</span><span>{fmt(subtotalWithAddons)}</span></div>
            <div className="ps-pricing-row"><span>Discount ({discountPercent}%)</span><span className="ps-discount-value">−{fmt(discountAmount)}</span></div>
            {discount?.percent > 20 && <div className="ps-pricing-row ps-manager-row"><span>Manager Approval</span><span>{discount.managerName||"—"}</span></div>}
            <div className="ps-pricing-row ps-total-row"><span>Total</span><span>{fmt(grandTotal)}</span></div>
          </div>
        </section>

        {orderNotes && (
          <section className="ps-card">
            <div className="ps-card-heading"><span className="ps-card-icon">📝</span><h2>Order Notes</h2></div>
            <p className="ps-notes-text">{orderNotes}</p>
          </section>
        )}

        <section className="ps-card ps-signature-card">
          <div className="ps-card-heading"><span className="ps-card-icon">✍️</span><h2>Customer Signature</h2></div>
          <p className="ps-signature-desc">
            By signing below, the customer confirms they have reviewed and agree to the order details and pricing above.
          </p>
          <SignaturePad value={signature} onChange={setSignature} />
          {!signature && <p className="ps-signature-required">⚠ Signature required before submitting</p>}
        </section>

        <div className="ps-actions">
          <button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button>
          <button
            className={`ps-btn ps-btn-primary ${!signature ? "ps-btn-disabled" : ""}`}
            onClick={() => {
              if (!signature) { alert("Please provide a customer signature before submitting."); return; }
              alert("Submitting order...");
            }}
            title={!signature ? "Signature required" : "Submit order"}
          >
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}