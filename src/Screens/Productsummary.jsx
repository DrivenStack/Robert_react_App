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

const MPS_DEFAULTS = {
  mountTypes:   ["Surface", "Inside"],
  trackTypes:   ["Zipper", "Wire Guide"],
  fabricTypes:  ["Light Filtering", "Solar Screen", "Blackout", "Privacy", "Clear View"],
  motorTypes:   ["Somfy (default)", "Somfy RTS", "Somfy WireFree", "Custom"],
  lChannelSizes:["1×1", "1×2", "Custom"],
  lChannelLocs: ["Left", "Right", "Top", "Bottom"],
  buildoutTypes:["Wood", "Aluminum Tube"],
  motorSides:   ["Left", "Right"],
  // CHANGE 4: renamed from weightBarTypes to reflect correct label "Weight Bar"
  weightBarTypes: ["Standard", "Upgraded", "None"],
  remoteTypes:  ["1 Channel Somfy Remote", "5 Channel Somfy Remote", "16 Channel Somfy Remote"],
};

const L_CHANNEL_RATE  = 12;
const BUILDOUT_RATE   = 18;

// Remote pricing based on opening count
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

const MPS_SIMPLE_ADDONS = [
  { id: "remote_1ch",   name: "1 Channel Somfy Remote",         price: 125 },
  { id: "remote_5ch",   name: "5 Channel Somfy Remote",         price: 180 },
  { id: "wind_sensor",  name: "Wind Sensor (Shaker or Whirly)", price: 290 },
  { id: "tahoma",       name: "Somfy Tahoma",                   price: 420 },
  { id: "remote_16ch",  name: "16 Channel Somfy Remote",        price: 320 },
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
  "Motor B Retractable Awning": [],
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
  return { id: uid(), loc: "Left", size: "1×1", customSize: "", lf: "", photo: null };
}

function createBuildout() {
  return { id: uid(), type: "Wood", dims: "", lf: "", price: "", photo: null };
}

function createOpening(areaDefaults = {}) {
  return {
    id: uid(), label: "", width: "", height: "",
    motorSide: areaDefaults.motorSide || "Left",
    lChannels: [],
    buildouts: [],
    mountOverride: "", trackOverride: "", fabricOverride: "",
    colorOverride: "", trackColorOverride: "", motorOverride: "",
    weightBarOverride: "", remoteOverride: "",
    openingPhoto: null,
  };
}

function createArea() {
  return {
    id: uid(), name: "", mountType: "", trackType: "", fabricType: "",
    cassetteColor: "", trackColor: "", motorType: "Somfy (default)",
    weightBar: "", remote: "",
    areaPhoto: null, openings: [createOpening()],
  };
}

function calcOpeningStructural(opening) {
  let total = 0;
  (opening.lChannels || []).forEach(lc => {
    total += (parseFloat(lc.lf) || 0) * L_CHANNEL_RATE;
  });
  (opening.buildouts || []).forEach(bo => {
    const op = parseFloat(bo.price);
    total += (!isNaN(op) && op > 0) ? op : (parseFloat(bo.lf) || 0) * BUILDOUT_RATE;
  });
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
  return area.openings.reduce((sum, o) => sum + calcOpeningStructural(o), 0);
}

function countTotalOpenings(areas) {
  return areas.reduce((sum, a) => sum + a.openings.length, 0);
}

// ─────────────────────────────────────────────────────────────
// CHANGE 2: SESSION STORAGE PERSISTENCE KEY
// ─────────────────────────────────────────────────────────────
const SESSION_KEY = "productSummaryState_v1";

function saveToSession(state) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore storage errors
  }
}

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startStream = useCallback(async (mode) => {
    stopStream();
    setReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
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

  useEffect(() => {
    startStream(facingMode);
    return stopStream;
  }, []); // eslint-disable-line

  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startStream(next);
  };

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    onCapture(dataUrl);
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
              {!ready && (
                <div className="camera-loading">
                  <div className="camera-spinner" />
                  <p>Starting camera…</p>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
        <div className="camera-modal-footer">
          <button type="button" className="camera-flip-btn" onClick={flipCamera} title="Switch camera">🔄 Flip</button>
          <button type="button" className="camera-capture-btn" onClick={capture} disabled={!ready || !!error} title="Take photo">
            <span className="camera-shutter-ring" />
            <span className="camera-shutter-dot" />
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
    setShowPicker(false);
    e.target.value = "";
  };

  const handleCapture = (dataUrl) => {
    onChange(dataUrl);
    setShowCamera(false);
  };

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
      {showCamera && (
        <CameraModal onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}
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
// CHANGE 5: L-CHANNEL ITEM EDITOR — now includes photo upload
// ─────────────────────────────────────────────────────────────
function LChannelItem({ lc, index, onChange, onRemove, showRemove }) {
  const set = (field, val) => onChange({ ...lc, [field]: val });
  const cost = (parseFloat(lc.lf) || 0) * L_CHANNEL_RATE;
  return (
    <div className="structural-item-card">
      <div className="structural-item-header">
        <span className="structural-item-label">L-Channel #{index + 1}</span>
        {showRemove && (
          <button type="button" className="structural-item-remove" onClick={onRemove}>✕ Remove</button>
        )}
      </div>
      <div className="structural-fields-grid">
        <Sel label="Location" value={lc.loc}  options={MPS_DEFAULTS.lChannelLocs}  onChange={v => set("loc", v)} />
        <Sel label="Size"     value={lc.size} options={MPS_DEFAULTS.lChannelSizes} onChange={v => set("size", v)} />
        {lc.size === "Custom" && <Field label="Custom Size" value={lc.customSize} onChange={v => set("customSize", v)} placeholder='e.g. 2"×3"' />}
        <Field label={`Linear Feet (× $${L_CHANNEL_RATE}/LF)`} type="number" value={lc.lf} onChange={v => set("lf", v)} placeholder="e.g. 8" min="0" step="0.5" />
      </div>
      {lc.lf && <div className="structural-calc">L-Channel: {lc.lf} LF × ${L_CHANNEL_RATE} = <strong>{fmt(cost)}</strong></div>}
      {/* CHANGE 5: Photo upload for L-channel */}
      <PhotoUpload label="L-Channel Photo (optional)" value={lc.photo} onChange={v => set("photo", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BUILDOUT ITEM EDITOR
// ─────────────────────────────────────────────────────────────
function BuildoutItem({ bo, index, onChange, onRemove, showRemove }) {
  const set = (field, val) => onChange({ ...bo, [field]: val });
  const cost = bo.price
    ? (parseFloat(bo.price) || 0)
    : (parseFloat(bo.lf) || 0) * BUILDOUT_RATE;
  return (
    <div className="structural-item-card">
      <div className="structural-item-header">
        <span className="structural-item-label">Buildout #{index + 1}</span>
        {showRemove && (
          <button type="button" className="structural-item-remove" onClick={onRemove}>✕ Remove</button>
        )}
      </div>
      <div className="structural-fields-grid">
        <Sel label="Type" value={bo.type} options={MPS_DEFAULTS.buildoutTypes} onChange={v => set("type", v)} />
        <Field label="Dimensions" value={bo.dims} onChange={v => set("dims", v)} placeholder='e.g. 2"×4"×96"' />
        <Field label={`Linear Feet (× $${BUILDOUT_RATE}/LF)`} type="number" value={bo.lf} onChange={v => set("lf", v)} placeholder="e.g. 12" min="0" step="0.5" />
        <Field label="Override Price ($)" type="number" value={bo.price} onChange={v => set("price", v)} placeholder="Leave blank to use LF rate" min="0" />
      </div>
      {(bo.lf || bo.price) && (
        <div className="structural-calc">
          {bo.price
            ? <>Buildout (override): <strong>{fmt(bo.price)}</strong></>
            : <>Buildout: {bo.lf} LF × ${BUILDOUT_RATE} = <strong>{fmt(cost)}</strong></>
          }
        </div>
      )}
      <PhotoUpload label="Buildout Photo (optional)" value={bo.photo} onChange={v => set("photo", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE 6: OPENING EDITOR — Effective Settings replaces
//           the duplicate dropdown block. Opening-level fields
//           removed; one clean "Effective Settings" panel that
//           shows area defaults and lets the user override
//           per-opening without any duplicate selects.
// ─────────────────────────────────────────────────────────────
function OpeningEditor({ opening, index, areaDefaults, productName, onChange, onRemove, showRemove }) {
  const structural   = calcOpeningStructural(opening);
  const openingPrice = calcOpeningBasePrice(opening, productName);
  const openingTotal = openingPrice + structural;
  const set = (field, val) => onChange({ ...opening, [field]: val });

  // L-channel helpers
  const addLChannel    = () => set("lChannels", [...(opening.lChannels || []), createLChannel()]);
  const updateLChannel = (id, updated) => set("lChannels", (opening.lChannels || []).map(lc => lc.id === id ? updated : lc));
  const removeLChannel = (id) => set("lChannels", (opening.lChannels || []).filter(lc => lc.id !== id));

  // Buildout helpers
  const addBuildout    = () => set("buildouts", [...(opening.buildouts || []), createBuildout()]);
  const updateBuildout = (id, updated) => set("buildouts", (opening.buildouts || []).map(bo => bo.id === id ? updated : bo));
  const removeBuildout = (id) => set("buildouts", (opening.buildouts || []).filter(bo => bo.id !== id));

  const lChannels = opening.lChannels || [];
  const buildouts = opening.buildouts || [];
  const lChannelTotal = lChannels.reduce((s, lc) => s + (parseFloat(lc.lf) || 0) * L_CHANNEL_RATE, 0);
  const buildoutTotal = buildouts.reduce((s, bo) => {
    const op = parseFloat(bo.price);
    return s + ((!isNaN(op) && op > 0) ? op : (parseFloat(bo.lf) || 0) * BUILDOUT_RATE);
  }, 0);

  // CHANGE 6: resolve effective values for display in summary chip
  const effectiveMount  = opening.mountOverride  || areaDefaults.mountType  || "—";
  const effectiveTrack  = opening.trackOverride  || areaDefaults.trackType  || "—";
  const effectiveFabric = opening.fabricOverride || areaDefaults.fabricType || "—";
  const effectiveMotor  = opening.motorOverride  || areaDefaults.motorType  || "—";

  return (
    <div className="opening-card">
      <div className="opening-header">
        <div className="opening-num">Opening {index + 1}</div>
        <div className="opening-label-wrap">
          <input className="opening-label-input" placeholder="Opening label (e.g. Left Bay)"
            value={opening.label} onChange={e => set("label", e.target.value)} />
        </div>
        {structural > 0 && <div className="opening-structural-badge">{fmt(structural)} structural</div>}
        {showRemove && <button type="button" className="opening-remove" onClick={onRemove}>✕</button>}
      </div>

      {/* Dimensions + Motor Side */}
      <div className="opening-grid-3">
        <Field label="Width (ft or inches)" type="number" value={opening.width} onChange={v => set("width", v)} placeholder='e.g. 10 (ft) or 120 (in)' min="0" required />
        <Field label="Height (ft or inches)" type="number" value={opening.height} onChange={v => set("height", v)} placeholder='e.g. 8 (ft) or 96 (in)' min="0" required />
        <Sel label="Motor Side" value={opening.motorSide} options={MPS_DEFAULTS.motorSides} onChange={v => set("motorSide", v)} required />
      </div>

      <OpeningPriceBadge opening={opening} productName={productName} />

      {/* CHANGE 6: Single unified "Opening Settings" panel.
          Each field shows the resolved (area default) value and the user
          can override it here. No duplicate selects anywhere else. */}
      <details className="override-details" open>
        <summary className="override-summary">
          ⚙ Opening Settings
          <span className="override-hint">
            (Mount: <strong>{effectiveMount}</strong> · Track: <strong>{effectiveTrack}</strong> · Fabric: <strong>{effectiveFabric}</strong> · Motor: <strong>{effectiveMotor}</strong>)
          </span>
        </summary>
        <div className="override-resolved-info">
          These settings default to the Area values above. Change any field here to override for this opening only. Clear back to "— area default —" to revert.
        </div>
        <div className="override-resolved-grid">

          {/* Mount Type */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Mount Type
              {opening.mountOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select
              className={`override-resolved-select ${opening.mountOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.mountOverride || ""}
              onChange={e => set("mountOverride", e.target.value)}
            >
              <option value="">— area default ({areaDefaults.mountType || "not set"}) —</option>
              {MPS_DEFAULTS.mountTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Track Type */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Track Type
              {opening.trackOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select
              className={`override-resolved-select ${opening.trackOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.trackOverride || ""}
              onChange={e => set("trackOverride", e.target.value)}
            >
              <option value="">— area default ({areaDefaults.trackType || "not set"}) —</option>
              {MPS_DEFAULTS.trackTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Fabric Type */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Fabric Type
              {opening.fabricOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select
              className={`override-resolved-select ${opening.fabricOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.fabricOverride || ""}
              onChange={e => set("fabricOverride", e.target.value)}
            >
              <option value="">— area default ({areaDefaults.fabricType || "not set"}) —</option>
              {MPS_DEFAULTS.fabricTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Motor Type */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Motor Type
              {opening.motorOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select
              className={`override-resolved-select ${opening.motorOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.motorOverride || ""}
              onChange={e => set("motorOverride", e.target.value)}
            >
              <option value="">— area default ({areaDefaults.motorType || "not set"}) —</option>
              {MPS_DEFAULTS.motorTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Cassette Color */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Cassette Color
              {opening.colorOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <input
              className={`override-resolved-input ${opening.colorOverride ? "override-resolved-input--set" : "override-resolved-input--default"}`}
              type="text"
              value={opening.colorOverride || ""}
              placeholder={`area default (${areaDefaults.cassetteColor || "not set"})`}
              onChange={e => set("colorOverride", e.target.value)}
            />
          </div>

          {/* Track Color */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Track Color
              {opening.trackColorOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <input
              className={`override-resolved-input ${opening.trackColorOverride ? "override-resolved-input--set" : "override-resolved-input--default"}`}
              type="text"
              value={opening.trackColorOverride || ""}
              placeholder={`area default (${areaDefaults.trackColor || "not set"})`}
              onChange={e => set("trackColorOverride", e.target.value)}
            />
          </div>

          {/* CHANGE 4: label is "Weight Bar" (not "Weight Bar Color") */}
          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Weight Bar
              {opening.weightBarOverride
                ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select
              className={`override-resolved-select ${opening.weightBarOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.weightBarOverride || ""}
              onChange={e => set("weightBarOverride", e.target.value)}
            >
              <option value="">— area default ({areaDefaults.weightBar || "not set"}) —</option>
              {MPS_DEFAULTS.weightBarTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

        </div>
      </details>

      {/* Multiple L-Channels */}
      <div className="structural-section">
        <div className="structural-section-header">
          <span className="mps-label">L-Channels</span>
          {lChannelTotal > 0 && <span className="structural-section-total">{fmt(lChannelTotal)} total</span>}
          <button type="button" className="structural-add-btn" onClick={addLChannel}>+ Add L-Channel</button>
        </div>
        {lChannels.length === 0 && (
          <div className="structural-empty">No L-channels added. Click "Add L-Channel" if required.</div>
        )}
        {lChannels.map((lc, idx) => (
          <LChannelItem
            key={lc.id}
            lc={lc}
            index={idx}
            onChange={updated => updateLChannel(lc.id, updated)}
            onRemove={() => removeLChannel(lc.id)}
            showRemove={true}
          />
        ))}
      </div>

      {/* Multiple Buildouts */}
      <div className="structural-section">
        <div className="structural-section-header">
          <span className="mps-label">Buildouts</span>
          {buildoutTotal > 0 && <span className="structural-section-total">{fmt(buildoutTotal)} total</span>}
          <button type="button" className="structural-add-btn" onClick={addBuildout}>+ Add Buildout</button>
        </div>
        {buildouts.length === 0 && (
          <div className="structural-empty">No buildouts added. Click "Add Buildout" if required.</div>
        )}
        {buildouts.map((bo, idx) => (
          <BuildoutItem
            key={bo.id}
            bo={bo}
            index={idx}
            onChange={updated => updateBuildout(bo.id, updated)}
            onRemove={() => removeBuildout(bo.id)}
            showRemove={true}
          />
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

  const addOpening    = () => onChange({ ...area, openings: [...area.openings, createOpening({ motorSide: "Left" })] });
  const removeOpening = (id) => onChange({ ...area, openings: area.openings.filter(o => o.id !== id) });

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
          {showRemove && <button type="button" className="area-remove" onClick={onRemove}>Remove Area</button>}
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
          <Sel label="Fabric Type" value={area.fabricType} options={MPS_DEFAULTS.fabricTypes} onChange={v=>setArea("fabricType",v)} />
          <Field label="Cassette Color" value={area.cassetteColor} onChange={v=>setArea("cassetteColor",v)} placeholder="e.g. White" />
          <Field label="Track Color"    value={area.trackColor}    onChange={v=>setArea("trackColor",v)}    placeholder="e.g. Beige" />
          <Sel label="Motor Type"  value={area.motorType}  options={MPS_DEFAULTS.motorTypes}  onChange={v=>setArea("motorType",v)} />
          {/* CHANGE 4: correct label "Weight Bar" */}
          <Sel label="Weight Bar"  value={area.weightBar || ""} options={MPS_DEFAULTS.weightBarTypes} onChange={v=>setArea("weightBar",v)} placeholder="Select Weight Bar" />
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
// CHANGE 1: SIGNATURE PAD COMPONENT
// ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos   = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Draw saved signature from data URL when value prop is provided
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
      setIsEmpty(false);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  }, [value]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    lastPos.current = getPos(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  };

  const endDraw = (e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    onChange(canvas.toDataURL("image/png"));
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
    setIsEmpty(true);
  };

  return (
    <div className="signature-pad-wrapper">
      <div className="signature-pad-header">
        <span className="signature-pad-label">✍️ Customer Signature</span>
        {!isEmpty && (
          <button type="button" className="signature-clear-btn" onClick={clearSig}>
            Clear
          </button>
        )}
      </div>
      <div className="signature-canvas-container">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className={`signature-canvas ${isEmpty ? "signature-canvas--empty" : "signature-canvas--signed"}`}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && (
          <div className="signature-placeholder">Sign here</div>
        )}
      </div>
      <p className="signature-pad-hint">Draw your signature above using mouse or touch</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MPS PRODUCT CARD
// ─────────────────────────────────────────────────────────────
function MPSProductCard({ line, index, snapshot, mpsData, onMPSChange, addonSelections, onAddonToggle, productNotes, onProductNoteChange }) {
  const qty   = parseInt(line.quantity, 10) || 1;
  const areas = mpsData[line.id] || [];
  const setAreas   = (a) => onMPSChange(line.id, a);
  const addArea    = () => setAreas([...areas, createArea()]);
  const updateArea = (id, u) => setAreas(areas.map(a => a.id === id ? u : a));
  const removeArea = (id) => setAreas(areas.filter(a => a.id !== id));

  const openingsProductTotal = calcMPSOpeningsTotal(areas, line.product);
  const structuralTotal      = areas.reduce((s,a) => s + calcAreaStructuralOnly(a), 0);
  const selected             = addonSelections[line.id] || {};

  // CHANGE 3: auto-remote shown but NOT added to price
  const totalOpenings  = countTotalOpenings(areas);
  const autoRemoteName = getAutoRemote(totalOpenings > 0 ? totalOpenings : 1);

  const simpleAddonTotal      = MPS_SIMPLE_ADDONS.reduce((s, a) => selected[a.id] ? s + a.price * qty : s, 0);
  const enriched              = snapshot.productLines.find(l => l.id === line.id);
  const appBaseTotal          = enriched?.pricing?.lineSubtotal || 0;
  const effectiveProductTotal = openingsProductTotal > 0 ? openingsProductTotal : appBaseTotal;
  // CHANGE 3: remote price removed from grand total
  const grandLineTotal        = effectiveProductTotal + structuralTotal + simpleAddonTotal;
  const hasUnpriced = areas.some(a => a.openings.some(o => (o.width || o.height) && !getMPSOpeningPrice(line.product, o.width, o.height).ok));

  return (
    <div className="ps-product-card mps-product-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">{line.product}</div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>
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
        <textarea
          className="product-note-textarea"
          placeholder="Add any important notes about this product (e.g. special instructions, site conditions, client preferences)…"
          value={productNotes || ""}
          onChange={e => onProductNoteChange(line.id, e.target.value)}
          rows={3}
        />
      </div>

      {enriched?.pricing?.priceNote && <div className="ps-price-note">💡 Reference (from intake form): {enriched.pricing.priceNote}</div>}
      {hasUnpriced && <div className="ps-price-note ps-price-note--warn">⚠ Some openings have dimensions that don't match the price matrix.</div>}

      {/* CHANGE 3: Show remote name only, no price impact */}
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
                onChange={u => updateArea(area.id, u)} onRemove={() => removeArea(area.id)} showRemove={areas.length > 1} />
            ))
        }
        <button type="button" className="add-area-btn" onClick={addArea}>+ Add Area</button>
      </div>

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
        {structuralTotal  > 0 && <span>+ Structural: {fmt(structuralTotal)}</span>}
        {/* CHANGE 3: show remote as info only, no price in line total */}
        {totalOpenings > 0 && <span className="mps-remote-info-line">Remote included: {autoRemoteName}</span>}
        <span className="mps-line-grand">Line Total: {fmt(grandLineTotal)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STANDARD PRODUCT CARD
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
        <textarea
          className="product-note-textarea"
          placeholder="Add any important notes about this product…"
          value={productNotes || ""}
          onChange={e => onProductNoteChange(line.id, e.target.value)}
          rows={3}
        />
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
                          <input type="checkbox" className="ps-addon-checkbox" checked={enabled} onChange={() => onFieldAddonChange(line.id, def.id, {...val, enabled: !enabled})} />
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

  // CHANGE 2: Initialise state from sessionStorage so back-navigation preserves data
  const [addonSelections,  setAddonSelections]  = useState(() => loadFromSession()?.addonSelections  || {});
  const [mpsData,          setMpsData]          = useState(() => loadFromSession()?.mpsData          || {});
  const [fieldAddonValues, setFieldAddonValues] = useState(() => loadFromSession()?.fieldAddonValues || {});
  const [productNotes,     setProductNotes]     = useState(() => loadFromSession()?.productNotes     || {});
  // CHANGE 1: signature state
  const [signature,        setSignature]        = useState(() => loadFromSession()?.signature        || null);

  // CHANGE 2: Persist all mutable state to sessionStorage on every change
  useEffect(() => {
    saveToSession({ addonSelections, mpsData, fieldAddonValues, productNotes, signature });
  }, [addonSelections, mpsData, fieldAddonValues, productNotes, signature]);

  const handleProductNoteChange = (lineId, note) =>
    setProductNotes(prev => ({ ...prev, [lineId]: note }));
  const handleFieldAddonChange = (lineId, addonId, val) =>
    setFieldAddonValues(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), [addonId]: val}}));
  const handleAddonToggle = (lineId, addonId) =>
    setAddonSelections(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), [addonId]: !(prev[lineId]?.[addonId])}}));
  const handleMPSChange = (lineId, areas) =>
    setMpsData(prev => ({...prev, [lineId]: areas}));

  const { subtotalWithAddons, summaryAddonGrandTotal, mpsStructuralGrand, mpsOpeningsProductGrand } = useMemo(() => {
    if (!snapshot) return { subtotalWithAddons:0, summaryAddonGrandTotal:0, mpsStructuralGrand:0, mpsOpeningsProductGrand:0 };
    const configuredLines = snapshot.productLines.filter(l => l.category && l.product);
    let addonGrand=0, structuralGrand=0, openingsGrand=0, appBaseMPSGrand=0;

    configuredLines.forEach(line => {
      if (MPS_PRODUCTS.includes(line.product)) {
        const areas = mpsData[line.id] || [];
        const openingsTotal = calcMPSOpeningsTotal(areas, line.product);
        structuralGrand += areas.reduce((s,a) => s + calcAreaStructuralOnly(a), 0);
        const qty = parseInt(line.quantity,10)||1;
        const sel = addonSelections[line.id]||{};
        MPS_SIMPLE_ADDONS.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        // CHANGE 3: remote is NOT added to grand total
        if (openingsTotal > 0) openingsGrand += openingsTotal;
        else { const e = snapshot.productLines.find(l2=>l2.id===line.id); appBaseMPSGrand += e?.pricing?.lineSubtotal||0; }
      } else {
        const qty = parseInt(line.quantity,10)||1;
        const addons = getAddonsForProduct(line.product);
        const sel = addonSelections[line.id]||{};
        addons.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        addonGrand += calcFieldAddonTotal(fieldAddonValues[line.id], line.product);
      }
    });

    const nonMPSOriginal = (snapshot.pricingSummary?.subtotal||0) -
      snapshot.productLines.filter(l=>l.category&&l.product&&MPS_PRODUCTS.includes(l.product))
        .reduce((s,l)=>{ const e=snapshot.productLines.find(l2=>l2.id===l.id); return s+(e?.pricing?.lineSubtotal||0); },0);

    return {
      summaryAddonGrandTotal:  addonGrand,
      mpsStructuralGrand:      structuralGrand,
      mpsOpeningsProductGrand: openingsGrand,
      // CHANGE 3: no mpsRemoteGrand
      subtotalWithAddons: nonMPSOriginal + openingsGrand + appBaseMPSGrand + addonGrand + structuralGrand,
    };
  }, [snapshot, addonSelections, mpsData, fieldAddonValues]);

  const discountPercent = snapshot?.pricingSummary?.discountPercent || 0;
  const discountAmount  = subtotalWithAddons * (discountPercent / 100);
  const grandTotal      = subtotalWithAddons - discountAmount;

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
          <span className="ps-last-updated">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
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
              {configuredLines.map((line, idx) =>
                MPS_PRODUCTS.includes(line.product) ? (
                  <MPSProductCard key={line.id} line={line} index={idx} snapshot={snapshot}
                    mpsData={mpsData} onMPSChange={handleMPSChange}
                    addonSelections={addonSelections} onAddonToggle={handleAddonToggle}
                    productNotes={productNotes[line.id]} onProductNoteChange={handleProductNoteChange} />
                ) : (
                  <StandardProductCard key={line.id} line={line} index={idx} snapshot={snapshot}
                    addonSelections={addonSelections} onAddonToggle={handleAddonToggle}
                    fieldAddonValues={fieldAddonValues[line.id]||{}} onFieldAddonChange={handleFieldAddonChange}
                    productNotes={productNotes[line.id]} onProductNoteChange={handleProductNoteChange} />
                )
              )}
            </div>
          )}
        </section>

        <section className="ps-card ps-pricing-card">
          <div className="ps-card-heading"><span className="ps-card-icon">💰</span><h2>Pricing Summary</h2></div>
          <div className="ps-pricing-table">
            <div className="ps-pricing-row"><span>Product Subtotal</span><span>{fmt(snapshot.pricingSummary?.subtotal)}</span></div>
            {mpsOpeningsProductGrand > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>MPS Opening-Based Pricing (replaces base)</span><span className="ps-addon-highlight">{fmt(mpsOpeningsProductGrand)}</span></div>}
            {summaryAddonGrandTotal  > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Selected Add-ons</span><span className="ps-addon-highlight">+{fmt(summaryAddonGrandTotal)}</span></div>}
            {mpsStructuralGrand      > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Structural Adjustments (L-Channel / Buildout)</span><span className="ps-addon-highlight">+{fmt(mpsStructuralGrand)}</span></div>}
            {/* CHANGE 3: remote line removed from pricing summary */}
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

        {/* CHANGE 1: Signature section before submit */}
        <section className="ps-card ps-signature-card">
          <div className="ps-card-heading"><span className="ps-card-icon">✍️</span><h2>Customer Signature</h2></div>
          <p className="ps-signature-desc">
            By signing below, the customer confirms they have reviewed and agree to the order details and pricing above.
          </p>
          <SignaturePad value={signature} onChange={setSignature} />
          {!signature && (
            <p className="ps-signature-required">⚠ Signature required before submitting</p>
          )}
        </section>

        <div className="ps-actions">
          <button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button>
          <button
            className={`ps-btn ps-btn-primary ${!signature ? "ps-btn-disabled" : ""}`}
            onClick={() => {
              if (!signature) {
                alert("Please provide a customer signature before submitting.");
                return;
              }
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