import React, { useState, useMemo, useRef, useCallback } from 'react';
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
};

const L_CHANNEL_RATE  = 12;  // $ per linear foot
const BUILDOUT_RATE   = 18;  // $ per linear foot

// Simple checkbox add-ons shared by all 3 MPS products
const MPS_SIMPLE_ADDONS = [
  { id: "remote_1ch",   name: "1 Channel Somfy Remote",      price: 125 },
  { id: "remote_5ch",   name: "5 Channel Somfy Remote",      price: 320 },
  { id: "wind_sensor",  name: "Wind Sensor (Shaker or Whirly)", price: 290 },
  { id: "tahoma",       name: "Somfy Tahoma",                price: 420 },
];

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

// ─────────────────────────────────────────────────────────────
// STANDARD (non-MPS) PRODUCT ADD-ONS
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
    { id:"remote",          name:"Remote Control",         price:75  },
    { id:"smart_home",      name:"Smart Home Integration", price:150 },
    { id:"fabric_upgrade",  name:"Premium Fabric Upgrade", price:125 },
    { id:"valance",         name:"Decorative Valance",     price:100 },
  ],
  "Vista View Double Housing Units": [
    { id:"remote",          name:"Remote Control",         price:75  },
    { id:"smart_home",      name:"Smart Home Integration", price:150 },
    { id:"fabric_upgrade",  name:"Premium Fabric Upgrade", price:125 },
    { id:"valance",         name:"Decorative Valance",     price:100 },
  ],
  "Single Horizon View Retractable Screens": [
    { id:"remote",          name:"Remote Control",         price:75  },
    { id:"smart_home",      name:"Smart Home Integration", price:150 },
    { id:"fabric_upgrade",  name:"Premium Fabric Upgrade", price:125 },
    { id:"wind_sensor",     name:"Wind Sensor",            price:195 },
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
    { id:"wind_sensor",     name:"Wind Sensor",            price:195 },
    { id:"smart_home",      name:"Smart Home Integration", price:150 },
    { id:"remote",          name:"Additional Remote",      price:75  },
    { id:"fabric_upgrade",  name:"Premium Fabric Upgrade", price:125 },
  ],
  "Motor B Open Roll Retractable Awning": [
    { id:"wind_sensor",     name:"Wind Sensor",            price:195 },
    { id:"led_lighting",    name:"LED Lighting Kit",       price:350 },
    { id:"smart_home",      name:"Smart Home Integration", price:150 },
    { id:"remote",          name:"Additional Remote",      price:75  },
    { id:"fabric_upgrade",  name:"Premium Fabric Upgrade", price:125 },
    { id:"pitch_kit",       name:"Adjustable Pitch Kit",   price:110 },
  ],
  default: [
    { id:"motorization",    name:"Motorization",           price:250 },
    { id:"remote",          name:"Remote Control",         price:75  },
    { id:"smart_home",      name:"Smart Home Integration", price:150 },
    { id:"valance",         name:"Decorative Valance",     price:100 },
    { id:"cordless",        name:"Cordless Lift",          price:50  },
    { id:"fabric_upgrade",  name:"Premium Fabric Upgrade", price:125 },
  ],
};

function getAddonsForProduct(productName) {
  return PRODUCT_ADDONS[productName] || PRODUCT_ADDONS["default"];
}

// Field-based add-ons: price is calculated from a user-entered quantity
// pricingType: "per_lf" (linear feet) or "per_unit" (count)
const PRODUCT_FIELD_ADDONS = {
  "Motorized Louvered Roof Pergolas": [
    { id:"led_strip",       name:"Built-in LED Strip Lights (dimmable)", pricingType:"per_lf",   rate:60,   unit:"linear feet", unitShort:"LF", placeholder:"e.g. 20" },
    { id:"bromic_heater",   name:"Bromic 220V Heaters",                  pricingType:"per_unit", rate:2500, unit:"units",        unitShort:"ea", placeholder:"e.g. 2"  },
    { id:"ceiling_fan",     name:"Ceiling Fan",                          pricingType:"per_unit", rate:1000, unit:"units",        unitShort:"ea", placeholder:"e.g. 1"  },
    { id:"utility_beam",    name:"Utility Beam",                         pricingType:"per_unit", rate:1000, unit:"units",        unitShort:"ea", placeholder:"e.g. 1"  },
    { id:"cement_footings", name:'24" x 24" Cement Footings',            pricingType:"per_unit", rate:1000, unit:"units",        unitShort:"ea", placeholder:"e.g. 4"  },
  ],

  // ── Clearview Screen Doors & Oversized Doors shared addons ──
  "Clearview Retractable Screen Doors": [
    // UPGRADES (per door unless noted)
    { id:"pet_solar_mesh",       name:"Pet or Solar Mesh (per door, 42\" max)",          pricingType:"per_unit", rate:95,   unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_short",   name:"External Pin Lock Short",                         pricingType:"per_unit", rate:45,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_long",    name:"External Pin Lock Long",                          pricingType:"per_unit", rate:65,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_measure", name:"Internal Pin Lock (@ measure)",                   pricingType:"per_unit", rate:125,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_after",   name:"Internal Pin Lock (after measure)",               pricingType:"per_unit", rate:250,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"diecast_handles",      name:"Diecast Handles (per door)",                      pricingType:"per_unit", rate:60,   unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"pet_guard",            name:"Pet Guard (per door)",                            pricingType:"per_unit", rate:125,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"cleaning_kit",         name:"Cleaning Kit",                                    pricingType:"per_unit", rate:25,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"silicone_spray",       name:"Silicone Spray Only",                             pricingType:"per_unit", rate:15,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_single", name:"Custom Powder Single",                            pricingType:"per_unit", rate:500,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_double", name:"Custom Powder Double",                            pricingType:"per_unit", rate:900,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_single",   name:"Custom Wood Grain Single",                        pricingType:"per_unit", rate:1000, unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_double",   name:"Custom Wood Grain Double",                        pricingType:"per_unit", rate:1800, unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_threshold",     name:"Custom Threshold Cuts ($150–$300)",               pricingType:"custom",   rate:0,    unit:"units",  unitShort:"ea",  placeholder:"Enter price", group:"Upgrades" },
    { id:"buildout_stationary",  name:"Build Out on Stationary Door ($100–$200)",        pricingType:"custom",   rate:0,    unit:"units",  unitShort:"ea",  placeholder:"Enter price", group:"Upgrades" },
    // RESCREENS (per door)
    { id:"rescreen_std",         name:"Standard Mesh (48\" max)",                       pricingType:"per_unit", rate:225,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_solar_pet",   name:"Solar/Pet Mesh (42\" max)",                      pricingType:"per_unit", rate:275,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_single_dbl",  name:"Single Over Double (68\" max)",                  pricingType:"per_unit", rate:250,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_phantom",     name:"Phantom / Eclipse / Mirage / Wizard / Aira",     pricingType:"per_unit", rate:275,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_stowaway",    name:"Stowaway (Stowaway Mesh)",                        pricingType:"per_unit", rate:275,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_casper",      name:"Casper / Genius / Brisa / ODL",                  pricingType:"custom",   rate:0,    unit:"units",  unitShort:"ea",  placeholder:"Cannot rescreen", group:"Rescreens" },
    // SERVICE CALLS (after 90-day)
    { id:"service_call",         name:"Service Call",                                    pricingType:"per_unit", rate:99,   unit:"calls",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"service_extra_door",   name:"Service Extra Doors (per door)",                  pricingType:"per_unit", rate:45,   unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"uninstall_single",     name:"Uninstall Single Door",                           pricingType:"per_unit", rate:175,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"uninstall_double",     name:"Uninstall Double Door",                           pricingType:"per_unit", rate:300,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"reinstall_single",     name:"Reinstall Single Door",                           pricingType:"per_unit", rate:175,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"reinstall_double",     name:"Reinstall Double Door",                           pricingType:"per_unit", rate:300,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    // PARTS (additional charges to service fee)
    { id:"part_housing",         name:"Housing",                                         pricingType:"per_unit", rate:125,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_pull_bar",        name:"Pull Bar",                                        pricingType:"per_unit", rate:105,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_roller_tube",     name:"Roller Tube",                                     pricingType:"per_unit", rate:50,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_end_caps",        name:"End Caps / Housing Caps / Handles (per set)",     pricingType:"per_unit", rate:35,   unit:"sets",   unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_springs",         name:"Springs",                                         pricingType:"per_unit", rate:35,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_single",   name:"5\" Sill Single",                                pricingType:"per_unit", rate:60,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_s",   name:"5\" Gold Sill Single",                           pricingType:"per_unit", rate:100,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_double",   name:"5\" Sill Double",                                pricingType:"per_unit", rate:120,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_d",   name:"5\" Gold Sill Double",                           pricingType:"per_unit", rate:200,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_magnets",         name:"Magnets",                                         pricingType:"per_unit", rate:20,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_int_mag_single",  name:"Internal Magnet Single Door",                     pricingType:"per_unit", rate:80,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_int_mag_double",  name:"Internal Magnet Double Door",                     pricingType:"per_unit", rate:160,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_speed_reducer",   name:"Speed Reducer",                                   pricingType:"per_unit", rate:90,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_s",    name:"Extra Parts Deco / Sq Sill etc (single)",         pricingType:"per_unit", rate:40,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_d",    name:"Extra Parts Deco / Sq Sill etc (double)",         pricingType:"per_unit", rate:80,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_s",     name:"Gold Extra Parts Deco / Sq Sill etc (single)",    pricingType:"per_unit", rate:70,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_d",     name:"Gold Extra Parts Deco / Sq Sill etc (double)",    pricingType:"per_unit", rate:140,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
  ],
  "Clearview Oversized Doors": [
    // UPGRADES
    { id:"pet_solar_mesh",       name:"Pet or Solar Mesh (per door, 42\" max)",          pricingType:"per_unit", rate:95,   unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_short",   name:"External Pin Lock Short",                         pricingType:"per_unit", rate:45,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"ext_pin_lock_long",    name:"External Pin Lock Long",                          pricingType:"per_unit", rate:65,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_measure", name:"Internal Pin Lock (@ measure)",                   pricingType:"per_unit", rate:125,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"int_pin_lock_after",   name:"Internal Pin Lock (after measure)",               pricingType:"per_unit", rate:250,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"diecast_handles",      name:"Diecast Handles (per door)",                      pricingType:"per_unit", rate:60,   unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"pet_guard",            name:"Pet Guard (per door)",                            pricingType:"per_unit", rate:125,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"cleaning_kit",         name:"Cleaning Kit",                                    pricingType:"per_unit", rate:25,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"silicone_spray",       name:"Silicone Spray Only",                             pricingType:"per_unit", rate:15,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_single", name:"Custom Powder Single",                            pricingType:"per_unit", rate:500,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_powder_double", name:"Custom Powder Double",                            pricingType:"per_unit", rate:900,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_single",   name:"Custom Wood Grain Single",                        pricingType:"per_unit", rate:1000, unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_wood_double",   name:"Custom Wood Grain Double",                        pricingType:"per_unit", rate:1800, unit:"units",  unitShort:"ea",  placeholder:"1", group:"Upgrades" },
    { id:"custom_threshold",     name:"Custom Threshold Cuts ($150–$300)",               pricingType:"custom",   rate:0,    unit:"units",  unitShort:"ea",  placeholder:"Enter price", group:"Upgrades" },
    { id:"buildout_stationary",  name:"Build Out on Stationary Door ($100–$200)",        pricingType:"custom",   rate:0,    unit:"units",  unitShort:"ea",  placeholder:"Enter price", group:"Upgrades" },
    // RESCREENS
    { id:"rescreen_std",         name:"Standard Mesh (48\" max)",                       pricingType:"per_unit", rate:225,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_solar_pet",   name:"Solar/Pet Mesh (42\" max)",                      pricingType:"per_unit", rate:275,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_single_dbl",  name:"Single Over Double (68\" max)",                  pricingType:"per_unit", rate:250,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_phantom",     name:"Phantom / Eclipse / Mirage / Wizard / Aira",     pricingType:"per_unit", rate:275,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_stowaway",    name:"Stowaway (Stowaway Mesh)",                        pricingType:"per_unit", rate:275,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Rescreens" },
    { id:"rescreen_casper",      name:"Casper / Genius / Brisa / ODL",                  pricingType:"custom",   rate:0,    unit:"units",  unitShort:"ea",  placeholder:"Cannot rescreen", group:"Rescreens" },
    // SERVICE CALLS
    { id:"service_call",         name:"Service Call",                                    pricingType:"per_unit", rate:99,   unit:"calls",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"service_extra_door",   name:"Service Extra Doors (per door)",                  pricingType:"per_unit", rate:45,   unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"uninstall_single",     name:"Uninstall Single Door",                           pricingType:"per_unit", rate:175,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"uninstall_double",     name:"Uninstall Double Door",                           pricingType:"per_unit", rate:300,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"reinstall_single",     name:"Reinstall Single Door",                           pricingType:"per_unit", rate:175,  unit:"doors",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    { id:"reinstall_double",     name:"Reinstall Double Door",                           pricingType:"per_unit", rate:300,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Service Calls" },
    // PARTS
    { id:"part_housing",         name:"Housing",                                         pricingType:"per_unit", rate:125,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_pull_bar",        name:"Pull Bar",                                        pricingType:"per_unit", rate:105,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_roller_tube",     name:"Roller Tube",                                     pricingType:"per_unit", rate:50,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_end_caps",        name:"End Caps / Housing Caps / Handles (per set)",     pricingType:"per_unit", rate:35,   unit:"sets",   unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_springs",         name:"Springs",                                         pricingType:"per_unit", rate:35,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_single",   name:"5\" Sill Single",                                pricingType:"per_unit", rate:60,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_s",   name:"5\" Gold Sill Single",                           pricingType:"per_unit", rate:100,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_double",   name:"5\" Sill Double",                                pricingType:"per_unit", rate:120,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_sill_5_gold_d",   name:"5\" Gold Sill Double",                           pricingType:"per_unit", rate:200,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_magnets",         name:"Magnets",                                         pricingType:"per_unit", rate:20,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_int_mag_single",  name:"Internal Magnet Single Door",                     pricingType:"per_unit", rate:80,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_int_mag_double",  name:"Internal Magnet Double Door",                     pricingType:"per_unit", rate:160,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_speed_reducer",   name:"Speed Reducer",                                   pricingType:"per_unit", rate:90,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_s",    name:"Extra Parts Deco / Sq Sill etc (single)",         pricingType:"per_unit", rate:40,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_extra_deco_d",    name:"Extra Parts Deco / Sq Sill etc (double)",         pricingType:"per_unit", rate:80,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_s",     name:"Gold Extra Parts Deco / Sq Sill etc (single)",    pricingType:"per_unit", rate:70,   unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
    { id:"part_gold_deco_d",     name:"Gold Extra Parts Deco / Sq Sill etc (double)",    pricingType:"per_unit", rate:140,  unit:"units",  unitShort:"ea",  placeholder:"1", group:"Parts" },
  ],

  // ── Motor B Retractable Awning ──────────────────────────
  "Motor B Retractable Awning": [
    // SOMFY RTS
    { id:"somfy_1ch_tx",        name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",        name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",     name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",     name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",      name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",      name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor",   name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",      name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",    name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    // POWER CABLE OPTIONS
    { id:"power_cord_24ft",     name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    // ROOF MOUNT BRACKETS (Brown Only)
    { id:"bracket_12in",        name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",        name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",        name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],

  "Motor A Open Roll Retractable Awning": [
    // SOMFY RTS
    { id:"somfy_1ch_tx",        name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",        name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",     name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",     name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",      name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",      name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor",   name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",      name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",    name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    // POWER CABLE OPTIONS
    { id:"power_cord_24ft",     name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    // ROOF MOUNT BRACKETS (Brown Only)
    { id:"bracket_12in",        name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",        name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",        name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],

  "Motor B Open Roll Retractable Awning": [
    // SOMFY RTS
    { id:"somfy_1ch_tx",        name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",        name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",     name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",     name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",      name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",      name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor",   name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",      name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",    name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    // POWER CABLE OPTIONS
    { id:"power_cord_24ft",     name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    // ROOF MOUNT BRACKETS (Brown Only)
    { id:"bracket_12in",        name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",        name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",        name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],

  "Motor A QIP-Square box Retractable Awning": [
    // SOMFY RTS
    { id:"somfy_1ch_tx",        name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",        name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",     name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",     name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",      name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",      name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor",   name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",      name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",    name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    // POWER CABLE OPTIONS
    { id:"power_cord_24ft",     name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    // ROOF MOUNT BRACKETS (Brown Only)
    { id:"bracket_12in",        name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",        name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",        name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],

  "Motor B QIP-Square box Retractable Awning": [
    // SOMFY RTS
    { id:"somfy_1ch_tx",        name:"1 Channel Transmitter",               pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_tx",        name:"5 Channel Transmitter",               pricingType:"per_unit", rate:250, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_patio",     name:"1 Channel Patio Transmitter",         pricingType:"per_unit", rate:200, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_patio",     name:"5 Channel Patio Transmitter",         pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_1ch_wall",      name:"1 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:300, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_5ch_wall",      name:"5 Ch. Transmitter - Wireless Wall",   pricingType:"per_unit", rate:400, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_wind_sensor",   name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",      name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_16ch_telis",    name:"16 Channel Telis RTS",                pricingType:"per_unit", rate:500, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    // POWER CABLE OPTIONS
    { id:"power_cord_24ft",     name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    // ROOF MOUNT BRACKETS (Brown Only)
    { id:"bracket_12in",        name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",        name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",        name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
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
    if (def.pricingType === "custom") {
      // user enters a custom dollar amount directly
      return sum + (parseFloat(val.customPrice) || 0);
    }
    const q = parseFloat(val.qty) || 0;
    return sum + def.rate * q;
  }, 0);
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
let _uid = 1;
const uid = () => `id_${_uid++}`;

function createOpening(areaDefaults = {}) {
  return {
    id:           uid(),
    label:        "",
    width:        "",
    height:       "",
    motorSide:    areaDefaults.motorSide    || "Left",
    // structural
    lChannelRequired: false,
    lChannelLoc:  "Left",
    lChannelSize: "1×1",
    lChannelLF:   "",
    lChannelCustomSize: "",
    buildoutRequired: false,
    buildoutType: "Wood",
    buildoutDims: "",
    buildoutLF:   "",
    buildoutPrice:"",
    // overrides (if user wants to differ from area)
    mountOverride:  "",
    trackOverride:  "",
    fabricOverride: "",
    colorOverride:  "",
    motorOverride:  "",
    // photos (stored as object URL for display)
    openingPhoto:    null,
    lChannelPhoto:   null,
    buildoutPhoto:   null,
  };
}

function createArea() {
  return {
    id:           uid(),
    name:         "",
    mountType:    "",
    trackType:    "",
    fabricType:   "",
    cassetteColor:"",
    trackColor:   "",
    motorType:    "Somfy (default)",
    areaPhoto:    null,
    openings:     [createOpening()],
  };
}

function calcOpeningStructural(opening) {
  let total = 0;
  if (opening.lChannelRequired) {
    const lf = parseFloat(opening.lChannelLF) || 0;
    total += lf * L_CHANNEL_RATE;
  }
  if (opening.buildoutRequired) {
    const overridePrice = parseFloat(opening.buildoutPrice);
    if (!isNaN(overridePrice) && overridePrice > 0) {
      total += overridePrice;
    } else {
      const lf = parseFloat(opening.buildoutLF) || 0;
      total += lf * BUILDOUT_RATE;
    }
  }
  return total;
}

function calcAreaTotal(area) {
  return area.openings.reduce((sum, o) => sum + calcOpeningStructural(o), 0);
}

// ─────────────────────────────────────────────────────────────
// PHOTO UPLOAD BUTTON
// ─────────────────────────────────────────────────────────────
function PhotoUpload({ label, value, onChange }) {
  const ref = useRef();
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  };
  return (
    <div className="photo-upload-field">
      <input type="file" accept="image/*" ref={ref} style={{display:"none"}} onChange={handleChange} />
      <button type="button" className="photo-btn" onClick={() => ref.current.click()}>
        {value ? "📷 Change Photo" : `📷 ${label}`}
      </button>
      {value && <span className="photo-uploaded">✓ Uploaded</span>}
      {value && (
        <img src={value} alt="preview" className="photo-thumb" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SELECT HELPER
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

function Field({ label, type="text", value, onChange, placeholder, min, step, required }) {
  return (
    <div className="mps-field">
      <label className="mps-label">{label}{required && <span className="mps-req">*</span>}</label>
      <input
        className="mps-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="mps-toggle-row">
      <span className="mps-label">{label}</span>
      <button
        type="button"
        className={`mps-toggle ${checked ? "mps-toggle-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="mps-toggle-knob" />
        <span className="mps-toggle-text">{checked ? "Yes" : "No"}</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPENING EDITOR
// ─────────────────────────────────────────────────────────────
function OpeningEditor({ opening, index, areaDefaults, onChange, onRemove, showRemove }) {
  const structural = calcOpeningStructural(opening);

  const set = (field, val) => onChange({ ...opening, [field]: val });

  const effectiveMount  = opening.mountOverride  || areaDefaults.mountType;
  const effectiveTrack  = opening.trackOverride  || areaDefaults.trackType;
  const effectiveFabric = opening.fabricOverride || areaDefaults.fabricType;
  const effectiveMotor  = opening.motorOverride  || areaDefaults.motorType;

  return (
    <div className="opening-card">
      <div className="opening-header">
        <div className="opening-num">Opening {index + 1}</div>
        <div className="opening-label-wrap">
          <input
            className="opening-label-input"
            placeholder="Opening label (e.g. Left Bay)"
            value={opening.label}
            onChange={e => set("label", e.target.value)}
          />
        </div>
        {structural > 0 && (
          <div className="opening-structural-badge">{fmt(structural)} structural</div>
        )}
        {showRemove && (
          <button type="button" className="opening-remove" onClick={onRemove}>✕</button>
        )}
      </div>

      {/* ── Dimensions + Motor Side ── */}
      <div className="opening-grid-3">
        <Field
          label="Width"
          type="number"
          value={opening.width}
          onChange={v => set("width", v)}
          placeholder='e.g. 120"'
          min="0"
          required
        />
        <Field
          label="Height"
          type="number"
          value={opening.height}
          onChange={v => set("height", v)}
          placeholder='e.g. 84"'
          min="0"
          required
        />
        <Sel
          label="Motor Side"
          value={opening.motorSide}
          options={MPS_DEFAULTS.motorSides}
          onChange={v => set("motorSide", v)}
          required
        />
      </div>

      {/* ── Per-opening overrides ── */}
      <details className="override-details">
        <summary className="override-summary">
          ⚙ Override area defaults for this opening
          <span className="override-hint">
            (Mount: {effectiveMount || "—"} · Track: {effectiveTrack || "—"} · Fabric: {effectiveFabric || "—"} · Motor: {effectiveMotor || "—"})
          </span>
        </summary>
        <div className="override-grid">
          <Sel label="Mount Override"  value={opening.mountOverride}  options={MPS_DEFAULTS.mountTypes}  onChange={v=>set("mountOverride",v)}  placeholder="Use area default" />
          <Sel label="Track Override"  value={opening.trackOverride}  options={MPS_DEFAULTS.trackTypes}  onChange={v=>set("trackOverride",v)}  placeholder="Use area default" />
          <Sel label="Fabric Override" value={opening.fabricOverride} options={MPS_DEFAULTS.fabricTypes} onChange={v=>set("fabricOverride",v)} placeholder="Use area default" />
          <Sel label="Motor Override"  value={opening.motorOverride}  options={MPS_DEFAULTS.motorTypes}  onChange={v=>set("motorOverride",v)}  placeholder="Use area default" />
          <Field label="Cassette Color Override" value={opening.colorOverride} onChange={v=>set("colorOverride",v)} placeholder="Use area default" />
        </div>
      </details>

      {/* ── L-Channel ── */}
      <div className="structural-section">
        <Toggle
          label="L-Channel Required?"
          checked={opening.lChannelRequired}
          onChange={v => set("lChannelRequired", v)}
        />
        {opening.lChannelRequired && (
          <div className="structural-fields">
            <div className="structural-fields-grid">
              <Sel label="Location" value={opening.lChannelLoc}  options={MPS_DEFAULTS.lChannelLocs}  onChange={v=>set("lChannelLoc",v)} />
              <Sel label="Size"     value={opening.lChannelSize} options={MPS_DEFAULTS.lChannelSizes} onChange={v=>set("lChannelSize",v)} />
              {opening.lChannelSize === "Custom" && (
                <Field label="Custom Size" value={opening.lChannelCustomSize} onChange={v=>set("lChannelCustomSize",v)} placeholder='e.g. 2"×3"' />
              )}
              <Field
                label={`Linear Feet (× $${L_CHANNEL_RATE}/LF)`}
                type="number"
                value={opening.lChannelLF}
                onChange={v=>set("lChannelLF",v)}
                placeholder="e.g. 8"
                min="0"
                step="0.5"
              />
            </div>
            {opening.lChannelLF && (
              <div className="structural-calc">
                L-Channel: {opening.lChannelLF} LF × ${L_CHANNEL_RATE} = <strong>{fmt(parseFloat(opening.lChannelLF)*L_CHANNEL_RATE)}</strong>
              </div>
            )}
            <PhotoUpload
              label="L-Channel Photo (optional)"
              value={opening.lChannelPhoto}
              onChange={v=>set("lChannelPhoto",v)}
            />
          </div>
        )}
      </div>

      {/* ── Buildout ── */}
      <div className="structural-section">
        <Toggle
          label="Buildout Required?"
          checked={opening.buildoutRequired}
          onChange={v => set("buildoutRequired", v)}
        />
        {opening.buildoutRequired && (
          <div className="structural-fields">
            <div className="structural-fields-grid">
              <Sel label="Type" value={opening.buildoutType} options={MPS_DEFAULTS.buildoutTypes} onChange={v=>set("buildoutType",v)} />
              <Field label="Dimensions" value={opening.buildoutDims} onChange={v=>set("buildoutDims",v)} placeholder='e.g. 2"×4"×96"' />
              <Field
                label={`Linear Feet (× $${BUILDOUT_RATE}/LF)`}
                type="number"
                value={opening.buildoutLF}
                onChange={v=>set("buildoutLF",v)}
                placeholder="e.g. 12"
                min="0"
                step="0.5"
              />
              <Field
                label="Override Price ($)"
                type="number"
                value={opening.buildoutPrice}
                onChange={v=>set("buildoutPrice",v)}
                placeholder="Leave blank to use LF rate"
                min="0"
              />
            </div>
            {(opening.buildoutLF || opening.buildoutPrice) && (
              <div className="structural-calc">
                {opening.buildoutPrice
                  ? <>Buildout (override): <strong>{fmt(opening.buildoutPrice)}</strong></>
                  : <>Buildout: {opening.buildoutLF} LF × ${BUILDOUT_RATE} = <strong>{fmt(parseFloat(opening.buildoutLF)*BUILDOUT_RATE)}</strong></>
                }
              </div>
            )}
            <PhotoUpload
              label="Buildout Photo (optional)"
              value={opening.buildoutPhoto}
              onChange={v=>set("buildoutPhoto",v)}
            />
          </div>
        )}
      </div>

      {/* ── Opening photo ── */}
      <div className="opening-photo-row">
        <PhotoUpload
          label="Opening Photo"
          value={opening.openingPhoto}
          onChange={v=>set("openingPhoto",v)}
        />
      </div>

      {/* ── Per-opening total ── */}
      {structural > 0 && (
        <div className="opening-total">
          Structural Adjustments Total: <strong>{fmt(structural)}</strong>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AREA EDITOR  (one MPS product line = one or more areas)
// ─────────────────────────────────────────────────────────────
function AreaEditor({ area, areaIndex, onChange, onRemove, showRemove }) {
  const areaTotal = calcAreaTotal(area);

  const setArea = (field, val) => onChange({ ...area, [field]: val });

  const setOpening = useCallback((openingId, updatedOpening) => {
    onChange({
      ...area,
      openings: area.openings.map(o => o.id === openingId ? updatedOpening : o),
    });
  }, [area, onChange]);

  const addOpening = () => {
    onChange({
      ...area,
      openings: [...area.openings, createOpening({
        motorSide: "Left",
      })],
    });
  };

  const removeOpening = (id) => {
    onChange({ ...area, openings: area.openings.filter(o => o.id !== id) });
  };

  return (
    <div className="area-card">
      {/* ── Area header ── */}
      <div className="area-header">
        <div className="area-header-left">
          <div className="area-badge">Area {areaIndex + 1}</div>
          <input
            className="area-name-input"
            placeholder="Area Name (e.g. Patio North)"
            value={area.name}
            onChange={e => setArea("name", e.target.value)}
          />
        </div>
        <div className="area-header-right">
          {areaTotal > 0 && <div className="area-structural-total">+{fmt(areaTotal)} structural</div>}
          {showRemove && (
            <button type="button" className="area-remove" onClick={onRemove}>Remove Area</button>
          )}
        </div>
      </div>

      {/* ── Area-level defaults ── */}
      <div className="area-defaults">
        <div className="area-defaults-label">Area Defaults (auto-populated per opening)</div>
        <div className="area-defaults-grid">
          <Sel label="Product"     value={area.product}    options={[]}         onChange={()=>{}}           placeholder="Inherited from line" />
          <Sel label="Mount Type"  value={area.mountType}  options={MPS_DEFAULTS.mountTypes}  onChange={v=>setArea("mountType",v)} />
          <Sel label="Track Type"  value={area.trackType}  options={MPS_DEFAULTS.trackTypes}  onChange={v=>setArea("trackType",v)} />
          <Sel label="Fabric Type" value={area.fabricType} options={MPS_DEFAULTS.fabricTypes} onChange={v=>setArea("fabricType",v)} />
          <Field label="Cassette Color" value={area.cassetteColor} onChange={v=>setArea("cassetteColor",v)} placeholder="e.g. White" />
          <Field label="Track Color"    value={area.trackColor}    onChange={v=>setArea("trackColor",v)}    placeholder="e.g. Beige" />
          <Sel label="Motor Type"  value={area.motorType}  options={MPS_DEFAULTS.motorTypes}  onChange={v=>setArea("motorType",v)} />
        </div>
        <PhotoUpload
          label="Area Photo (wide shot)"
          value={area.areaPhoto}
          onChange={v=>setArea("areaPhoto",v)}
        />
      </div>

      {/* ── Openings ── */}
      <div className="openings-container">
        <div className="openings-heading">
          <span>Openings</span>
          <span className="openings-count">{area.openings.length}</span>
        </div>

        {area.openings.map((opening, idx) => (
          <OpeningEditor
            key={opening.id}
            opening={opening}
            index={idx}
            areaDefaults={area}
            onChange={updated => setOpening(opening.id, updated)}
            onRemove={() => removeOpening(opening.id)}
            showRemove={area.openings.length > 1}
          />
        ))}

        <button type="button" className="add-opening-btn" onClick={addOpening}>
          + Add Opening
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MPS PRODUCT CARD  (wraps area editor + per-area totals)
// ─────────────────────────────────────────────────────────────
function MPSProductCard({ line, index, snapshot, mpsData, onMPSChange, addonSelections, onAddonToggle }) {
  const enriched  = snapshot.productLines.find(l => l.id === line.id);
  const baseTotal = enriched?.pricing?.lineSubtotal || 0;
  const qty       = parseInt(line.quantity, 10) || 1;

  const areas = mpsData[line.id] || [];

  const setAreas = (newAreas) => onMPSChange(line.id, newAreas);

  const addArea = () => setAreas([...areas, createArea()]);

  const updateArea = (areaId, updated) =>
    setAreas(areas.map(a => a.id === areaId ? updated : a));

  const removeArea = (areaId) =>
    setAreas(areas.filter(a => a.id !== areaId));

  const structuralTotal = areas.reduce((sum, a) => sum + calcAreaTotal(a), 0);

  const selected = addonSelections[line.id] || {};
  const simpleAddonTotal = MPS_SIMPLE_ADDONS.reduce((sum, addon) =>
    selected[addon.id] ? sum + addon.price * qty : sum, 0);

  const grandLineTotal  = baseTotal + structuralTotal + simpleAddonTotal;

  return (
    <div className="ps-product-card mps-product-card">
      {/* ── Header ── */}
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">{line.product}</div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>

      {/* ── Base details ── */}
      <div className="ps-detail-grid">
        {[
          { label:"Category",      value: line.category },
          { label:"Base Size",     value: `${line.width||"—"} × ${line.height||"—"}` },
          { label:"Quantity",      value: line.quantity },
          { label:"Operation",     value: line.operation, capitalize: true },
        ].map(({ label, value, capitalize }) => (
          <div className="ps-detail-item" key={label}>
            <span className="ps-detail-label">{label}</span>
            <span className="ps-detail-value" style={capitalize?{textTransform:"capitalize"}:{}}>{value}</span>
          </div>
        ))}
      </div>

      {enriched?.pricing?.priceNote && (
        <div className="ps-price-note">💡 {enriched.pricing.priceNote}</div>
      )}

      {/* ── MPS Area/Opening builder ── */}
      <div className="mps-builder">
        <div className="mps-builder-header">
          <div className="mps-builder-title">
            <span className="mps-builder-icon">🗂</span>
            Area & Opening Configuration
          </div>
          {structuralTotal > 0 && (
            <div className="mps-structural-total">
              Structural Add-ons: <strong>{fmt(structuralTotal)}</strong>
            </div>
          )}
        </div>

        {areas.length === 0 ? (
          <div className="mps-empty-state">
            <p>No areas configured yet. Add an area to specify openings, structural adjustments, and product details.</p>
          </div>
        ) : (
          areas.map((area, idx) => (
            <AreaEditor
              key={area.id}
              area={area}
              areaIndex={idx}
              onChange={updated => updateArea(area.id, updated)}
              onRemove={() => removeArea(area.id)}
              showRemove={areas.length > 1}
            />
          ))
        )}

        <button type="button" className="add-area-btn" onClick={addArea}>
          + Add Area
        </button>
      </div>

      {/* ── Simple checkbox add-ons ── */}
      <div className="mps-simple-addons">
        <div className="mps-simple-addons-title">
          <span className="ps-addons-icon">✦</span>
          Accessories &amp; Add-ons
          {simpleAddonTotal > 0 && (
            <span className="ps-addons-running-total">+{fmt(simpleAddonTotal)} selected</span>
          )}
        </div>
        <div className="ps-addons-grid">
          {MPS_SIMPLE_ADDONS.map(addon => {
            const isChecked = !!selected[addon.id];
            return (
              <label key={addon.id} className={`ps-addon-item ${isChecked ? "ps-addon-checked" : ""}`}>
                <input
                  type="checkbox"
                  className="ps-addon-checkbox"
                  checked={isChecked}
                  onChange={() => onAddonToggle(line.id, addon.id)}
                />
                <div className="ps-addon-content">
                  <span className="ps-addon-name">{addon.name}</span>
                  <span className="ps-addon-price">
                    +{fmt(addon.price)}
                    {qty > 1 && <span className="ps-addon-per-unit"> × {qty} = {fmt(addon.price * qty)}</span>}
                  </span>
                </div>
                {isChecked && <span className="ps-addon-check-mark">✓</span>}
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Line total ── */}
      <div className="mps-line-total">
        <span>Base Price: {fmt(baseTotal)}</span>
        {simpleAddonTotal > 0 && <span>+ Add-ons: {fmt(simpleAddonTotal)}</span>}
        {structuralTotal > 0 && <span>+ Structural: {fmt(structuralTotal)}</span>}
        <span className="mps-line-grand">Line Total: {fmt(grandLineTotal)}</span>
      </div>
    </div>
  );
}


// STANDARD PRODUCT CARD  (unchanged logic, existing style)
// ─────────────────────────────────────────────────────────────
function StandardProductCard({ line, index, snapshot, addonSelections, onAddonToggle, fieldAddonValues, onFieldAddonChange }) {
  const enriched  = snapshot.productLines.find(l => l.id === line.id);
  const baseTotal = enriched?.pricing?.lineSubtotal || 0;
  const priceNote = enriched?.pricing?.priceNote    || '';
  const qty       = parseInt(line.quantity, 10) || 1;

  const availableAddons = getAddonsForProduct(line.product);
  const selected        = addonSelections[line.id] || {};

  const summaryAddonTotal = availableAddons.reduce((sum, addon) =>
    selected[addon.id] ? sum + addon.price * qty : sum, 0);

  const fieldAddonDefs  = getFieldAddonsForProduct(line.product);
  const fieldTotal      = calcFieldAddonTotal(fieldAddonValues, line.product);
  const grandLineTotal  = baseTotal + summaryAddonTotal + fieldTotal;

  const details = [
    { label:"Category",      value: line.category           },
    { label:"Width",         value: line.width      || "—"  },
    { label:"Height / Proj.",value: line.height     || "—"  },
    { label:"Quantity",      value: line.quantity           },
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

      {priceNote && <div className="ps-price-note">💡 {priceNote}</div>}

      {availableAddons.length > 0 && (
      <div className="ps-addons-section">
        <div className="ps-addons-title">
          <span className="ps-addons-icon">✦</span>
          Available Add-ons
          {summaryAddonTotal > 0 && (
            <span className="ps-addons-running-total">+{fmt(summaryAddonTotal)} selected</span>
          )}
        </div>
        <div className="ps-addons-grid">
          {availableAddons.map(addon => {
            const isChecked = !!selected[addon.id];
            return (
              <label key={addon.id} className={`ps-addon-item ${isChecked?"ps-addon-checked":""}`}>
                <input
                  type="checkbox"
                  className="ps-addon-checkbox"
                  checked={isChecked}
                  onChange={() => onAddonToggle(line.id, addon.id)}
                />
                <div className="ps-addon-content">
                  <span className="ps-addon-name">{addon.name}</span>
                  <span className="ps-addon-price">
                    +{fmt(addon.price)}
                    {qty > 1 && <span className="ps-addon-per-unit"> × {qty} = {fmt(addon.price*qty)}</span>}
                  </span>
                </div>
                {isChecked && <span className="ps-addon-check-mark">✓</span>}
              </label>
            );
          })}
        </div>
      </div>
      )}

      {/* Field-based add-ons (e.g. per LF or per unit) */}
      {fieldAddonDefs.length > 0 && (
        <div className="ps-addons-section field-addons-section">
          <div className="ps-addons-title">
            <span className="ps-addons-icon">&#x25C6;</span>
            Upgrades &amp; Add-ons
            {fieldTotal > 0 && (
              <span className="ps-addons-running-total">+{fmt(fieldTotal)} selected</span>
            )}
          </div>
          <div className="field-addons-grid">
            {(() => {
              // Group addons by their group label
              const groups = [];
              const seen = {};
              fieldAddonDefs.forEach(def => {
                const g = def.group || "Add-ons";
                if (!seen[g]) { seen[g] = true; groups.push({ label: g, items: [] }); }
                groups[groups.length - 1].items.push(def);
              });
              // Fix: group items correctly
              const groupMap = {};
              fieldAddonDefs.forEach(def => {
                const g = def.group || "Add-ons";
                if (!groupMap[g]) groupMap[g] = [];
                groupMap[g].push(def);
              });
              const groupOrder = [...new Set(fieldAddonDefs.map(d => d.group || "Add-ons"))];
              return groupOrder.map(groupLabel => (
                <div key={groupLabel} className="field-addon-group">
                  <div className="field-addon-group-header">{groupLabel}</div>
                  {groupMap[groupLabel].map(def => {
                    const val        = fieldAddonValues?.[def.id] || {};
                    const enabled    = !!val.enabled;
                    const qtyVal     = val.qty || "";
                    const customPrice= val.customPrice || "";
                    const isCustom   = def.pricingType === "custom";
                    const lineAmt    = enabled
                      ? isCustom ? (parseFloat(customPrice) || 0) : def.rate * (parseFloat(qtyVal) || 0)
                      : 0;
                    return (
                      <div key={def.id} className={`field-addon-row ${enabled ? "field-addon-active" : ""}`}>
                        <label className="field-addon-check-label">
                          <input
                            type="checkbox"
                            className="ps-addon-checkbox"
                            checked={enabled}
                            onChange={() => onFieldAddonChange(line.id, def.id, { ...val, enabled: !enabled })}
                          />
                          <span className="field-addon-name">{def.name}</span>
                        </label>
                        <div className="field-addon-right">
                          {!isCustom && (
                            <div className="field-addon-rate">{fmt(def.rate)} / {def.unitShort}</div>
                          )}
                          {enabled && (
                            <div className="field-addon-input-wrap">
                              {isCustom ? (
                                <>
                                  <span className="field-addon-unit-label">$</span>
                                  <input
                                    type="number"
                                    className="field-addon-qty-input"
                                    value={customPrice}
                                    min="0"
                                    step="1"
                                    placeholder={def.placeholder}
                                    onChange={e => onFieldAddonChange(line.id, def.id, { ...val, enabled: true, customPrice: e.target.value })}
                                  />
                                  {lineAmt > 0 && <span className="field-addon-line-total">{fmt(lineAmt)}</span>}
                                </>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    className="field-addon-qty-input"
                                    value={qtyVal}
                                    min="0"
                                    step={def.pricingType === "per_lf" ? "0.5" : "1"}
                                    placeholder={def.placeholder}
                                    onChange={e => onFieldAddonChange(line.id, def.id, { ...val, enabled: true, qty: e.target.value })}
                                  />
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

      {line.notes && (
        <div className="ps-product-notes">
          <span className="ps-detail-label">Notes — </span>{line.notes}
        </div>
      )}
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

  // Standard add-on selections: { [lineId]: { [addonId]: boolean } }
  const [addonSelections, setAddonSelections] = useState({});

  // MPS area data: { [lineId]: Area[] }
  const [mpsData, setMpsData] = useState({});

  // Field addon values: { [lineId]: { [addonId]: { enabled: bool, qty: string } } }
  const [fieldAddonValues, setFieldAddonValues] = useState({});

  const handleFieldAddonChange = (lineId, addonId, val) => {
    setFieldAddonValues(prev => ({
      ...prev,
      [lineId]: { ...(prev[lineId] || {}), [addonId]: val },
    }));
  };

  const handleAddonToggle = (lineId, addonId) => {
    setAddonSelections(prev => ({
      ...prev,
      [lineId]: { ...(prev[lineId]||{}), [addonId]: !(prev[lineId]?.[addonId]) },
    }));
  };

  const handleMPSChange = (lineId, areas) => {
    setMpsData(prev => ({ ...prev, [lineId]: areas }));
  };

  // ── Grand total calculation ──────────────────────────────
  const { subtotalWithAddons, summaryAddonGrandTotal, mpsStructuralGrand } = useMemo(() => {
    if (!snapshot) return { subtotalWithAddons:0, summaryAddonGrandTotal:0, mpsStructuralGrand:0 };

    const configuredLines = snapshot.productLines.filter(l => l.category && l.product);
    let addonGrand     = 0;
    let structuralGrand= 0;

    configuredLines.forEach(line => {
      if (MPS_PRODUCTS.includes(line.product)) {
        const areas = mpsData[line.id] || [];
        structuralGrand += areas.reduce((s,a)=>s+calcAreaTotal(a),0);
        // also count simple addons for MPS
        const qty  = parseInt(line.quantity,10)||1;
        const sel  = addonSelections[line.id]||{};
        MPS_SIMPLE_ADDONS.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
      } else {
        const qty    = parseInt(line.quantity,10)||1;
        const addons = getAddonsForProduct(line.product);
        const sel    = addonSelections[line.id]||{};
        addons.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        // field-based addons (per LF / per unit)
        addonGrand += calcFieldAddonTotal(fieldAddonValues[line.id], line.product);
      }
    });

    const base = snapshot.pricingSummary?.subtotal || 0;
    return {
      summaryAddonGrandTotal: addonGrand,
      mpsStructuralGrand:     structuralGrand,
      subtotalWithAddons:     base + addonGrand + structuralGrand,
    };
  }, [snapshot, addonSelections, mpsData, fieldAddonValues]);

  const discountPercent = snapshot?.pricingSummary?.discountPercent || 0;
  const discountAmount  = subtotalWithAddons * (discountPercent / 100);
  const grandTotal      = subtotalWithAddons - discountAmount;

  if (!snapshot) {
    return (
      <div className="ps-page">
        <header className="ps-header">
          <div className="ps-header-glow" />
          <div className="ps-header-content"><h1>Order Summary</h1><p>No order data found.</p></div>
        </header>
        <div className="ps-body">
          <button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button>
        </div>
      </div>
    );
  }

  const { customer, productLines, discount, orderNotes, lastUpdated } = snapshot;
  const configuredLines = productLines.filter(l => l.category && l.product);

  return (
    <div className="ps-page">
      <header className="ps-header">
        <div className="ps-header-glow" />
        <div className="ps-header-content">
          <h1>Order Summary</h1>
          <p>Review your order, configure areas & openings, and select add-ons</p>
        </div>
      </header>

      <div className="ps-body">
        <div className="ps-nav-row">
          <button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button>
          <span className="ps-last-updated">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
        </div>

        {/* Customer */}
        <section className="ps-card">
          <div className="ps-card-heading">
            <span className="ps-card-icon">👤</span>
            <h2>Customer Information</h2>
          </div>
          <div className="ps-customer-grid">
            {[
              { label:"Full Name",            value:customer.name    },
              { label:"Email Address",        value:customer.email   },
              { label:"Phone",                value:customer.phone   },
              { label:"Installation Address", value:customer.address },
            ].map(({label,value})=>(
              <div className="ps-customer-item" key={label}>
                <span className="ps-detail-label">{label}</span>
                <span className="ps-detail-value">{value||"—"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="ps-card">
          <div className="ps-card-heading">
            <span className="ps-card-icon">📦</span>
            <h2>Products <span className="ps-badge">{configuredLines.length}</span></h2>
          </div>
          {configuredLines.length === 0 ? (
            <p className="ps-empty">No products configured yet.</p>
          ) : (
            <div className="ps-products-list">
              {configuredLines.map((line, idx) =>
                MPS_PRODUCTS.includes(line.product) ? (
                  <MPSProductCard
                    key={line.id}
                    line={line}
                    index={idx}
                    snapshot={snapshot}
                    mpsData={mpsData}
                    onMPSChange={handleMPSChange}
                    addonSelections={addonSelections}
                    onAddonToggle={handleAddonToggle}
                  />
                ) : (
                  <StandardProductCard
                    key={line.id}
                    line={line}
                    index={idx}
                    snapshot={snapshot}
                    addonSelections={addonSelections}
                    onAddonToggle={handleAddonToggle}
                    fieldAddonValues={fieldAddonValues[line.id] || {}}
                    onFieldAddonChange={handleFieldAddonChange}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* Pricing */}
        <section className="ps-card ps-pricing-card">
          <div className="ps-card-heading">
            <span className="ps-card-icon">💰</span>
            <h2>Pricing Summary</h2>
          </div>
          <div className="ps-pricing-table">
            <div className="ps-pricing-row">
              <span>Product Subtotal</span>
              <span>{fmt(snapshot.pricingSummary?.subtotal)}</span>
            </div>
            {summaryAddonGrandTotal > 0 && (
              <div className="ps-pricing-row ps-addon-total-row">
                <span>Selected Add-ons</span>
                <span className="ps-addon-highlight">+{fmt(summaryAddonGrandTotal)}</span>
              </div>
            )}
            {mpsStructuralGrand > 0 && (
              <div className="ps-pricing-row ps-addon-total-row">
                <span>Structural Adjustments (L-Channel / Buildout)</span>
                <span className="ps-addon-highlight">+{fmt(mpsStructuralGrand)}</span>
              </div>
            )}
            <div className="ps-pricing-row ps-subtotal-addons-row">
              <span>Subtotal (incl. all adjustments)</span>
              <span>{fmt(subtotalWithAddons)}</span>
            </div>
            <div className="ps-pricing-row">
              <span>Discount ({discountPercent}%)</span>
              <span className="ps-discount-value">−{fmt(discountAmount)}</span>
            </div>
            {discount?.percent > 20 && (
              <div className="ps-pricing-row ps-manager-row">
                <span>Manager Approval</span>
                <span>{discount.managerName||"—"}</span>
              </div>
            )}
            <div className="ps-pricing-row ps-total-row">
              <span>Total</span>
              <span>{fmt(grandTotal)}</span>
            </div>
          </div>
        </section>

        {orderNotes && (
          <section className="ps-card">
            <div className="ps-card-heading">
              <span className="ps-card-icon">📝</span>
              <h2>Order Notes</h2>
            </div>
            <p className="ps-notes-text">{orderNotes}</p>
          </section>
        )}

        {/* Actions */}
        <div className="ps-actions">
          <button className="ps-btn ps-btn-back" onClick={()=>navigate("/")}>← Back to Form</button>
          <button className="ps-btn ps-btn-primary" onClick={()=>alert("📄 Generating proposal...")}>📄 Generate Proposal</button>
          <button className="ps-btn ps-btn-secondary" onClick={()=>alert(`💳 Processing payment of ${fmt(grandTotal)}...`)}>💳 Collect Payment</button>
          <button className="ps-btn ps-btn-outline" onClick={()=>{
            const finalSnapshot={...snapshot, mpsAreas:mpsData, summaryAddons:addonSelections, finalTotal:grandTotal};
            console.log("📤 GHL Export:",finalSnapshot);
            alert("📤 Exported to GHL!");
          }}>📤 Export to GHL</button>
        </div>
      </div>
    </div>
  );
}