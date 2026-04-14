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

const AWNING_PRODUCTS = [
  "Skylight Plus MRA",
  "Skyline Motorized Retractable Awning",
  "Open Roll Motorized Retractable Awning",
  "Motor A QIP-Square box Retractable Awning",
  "Motor B QIP-Square box Retractable Awning",
  "Motor A Open Roll Retractable Awning",
  "Motor B Open Roll Retractable Awning",
];

const MRA_PROJECTION_OPTIONS = [
  "4'11\"",
  "6'6\"",
  "8'2\"",
  "9'10\"",
  "11'2\"",
  "13'1\"",
];

// ─────────────────────────────────────────────────────────────
// CHANGE 1: L-CHANNEL SIZE OPTIONS + TIERED PRICING
// $25/LF: 1x1, 1.5x1.5, 1x2
// $30/LF: 1x3, 4" Flat Stock
// ─────────────────────────────────────────────────────────────
const L_CHANNEL_SIZES = [
  { label: "1x1",          rate: 25 },
  { label: "1.5x1.5",      rate: 25 },
  { label: "1x2",          rate: 25 },
  { label: "1x3",          rate: 30 },
  { label: '4" Flat Stock', rate: 30 },
  { label: "Custom",        rate: null },
];

function getLChannelRate(size) {
  const found = L_CHANNEL_SIZES.find(s => s.label === size);
  return found?.rate ?? 25;
}

// ─────────────────────────────────────────────────────────────
// MRA PRICING MATRICES
// ─────────────────────────────────────────────────────────────
const SKYLIGHT_MRA_PRICE_DATA = {
  "4'11\"": { 13:4550,14:4745,15:4940,16:5135,17:5330,18:5525,19:5720,20:5915 },
  "6'6\"":  { 13:5060,14:5280,15:5500,16:5720,17:5940,18:6160,19:6380,20:6600 },
  "8'2\"":  { 13:5720,14:5975,15:6230,16:6485,17:6740,18:6995,19:7250,20:7505 },
  "9'10\"": { 13:6270,14:6555,15:6840,16:7125,17:7410,18:7695,19:7980,20:8265 },
  "11'2\"": { 13:6820,14:7150,15:7480,16:7810,17:8140,18:8470,19:8800,20:9130 },
  "13'1\"": { 13:7590,14:7975,15:8360,16:8745,17:9130,18:9515,19:9900,20:10285 },
};

const SKYLINE_MRA_PRICE_DATA = {
  "4'11\"": { 7:2860,8:3025,9:3190,10:3355,11:3520,12:3685,13:4550,14:4745,15:4940,16:5135,17:5330,18:5525,19:5720,20:5915 },
  "6'6\"":  { 7:3190,8:3380,9:3570,10:3760,11:3950,12:4140,13:5060,14:5280,15:5500,16:5720,17:5940,18:6160,19:6380,20:6600 },
  "8'2\"":  { 7:3575,8:3795,9:4015,10:4235,11:4455,12:4675,13:5720,14:5975,15:6230,16:6485,17:6740,18:6995,19:7250,20:7505 },
  "9'10\"": { 7:3960,8:4180,9:4400,10:4620,11:4840,12:5060,13:6270,14:6555,15:6840,16:7125,17:7410,18:7695,19:7980,20:8265 },
  "11'2\"": { 7:4345,8:4565,9:4785,10:5005,11:5225,12:5445,13:6820,14:7150,15:7480,16:7810,17:8140,18:8470,19:8800,20:9130 },
  "13'1\"": { 7:4840,8:5115,9:5390,10:5665,11:5940,12:6215,13:7590,14:7975,15:8360,16:8745,17:9130,18:9515,19:9900,20:10285 },
};

const OPEN_ROLL_MRA_PRICE_DATA = {
  "4'11\"": { 7:2310,8:2445,9:2580,10:2715,11:2850,12:2985,13:3685,14:3850,15:4015,16:4180,17:4345,18:4510,19:4675,20:4840 },
  "6'6\"":  { 7:2585,8:2740,9:2895,10:3050,11:3205,12:3360,13:4125,14:4315,15:4505,16:4695,17:4885,18:5075,19:5265,20:5455 },
  "8'2\"":  { 7:2915,8:3090,9:3265,10:3440,11:3615,12:3790,13:4675,14:4895,15:5115,16:5335,17:5555,18:5775,19:5995,20:6215 },
  "9'10\"": { 7:3245,8:3420,9:3595,10:3770,11:3945,12:4120,13:5170,14:5390,15:5610,16:5830,17:6050,18:6270,19:6490,20:6710 },
  "11'2\"": { 7:3575,8:3750,9:3925,10:4100,11:4275,12:4450,13:5610,14:5830,15:6050,16:6270,17:6490,18:6710,19:6930,20:7150 },
  "13'1\"": { 7:3960,8:4180,9:4400,10:4620,11:4840,12:5060,13:6215,14:6490,15:6765,16:7040,17:7315,18:7590,19:7865,20:8140 },
};

function getMRAPrice(productName, projection, widthFt) {
  let matrix;
  if (productName === "Skylight Plus MRA" || productName === "Motor B Retractable Awning") {
    matrix = SKYLIGHT_MRA_PRICE_DATA;
  } else if (productName === "Skyline Motorized Retractable Awning") {
    matrix = SKYLINE_MRA_PRICE_DATA;
  } else if (productName === "Open Roll Motorized Retractable Awning") {
    matrix = OPEN_ROLL_MRA_PRICE_DATA;
  } else {
    return { ok: false, price: 0, message: "Unknown MRA product." };
  }
  if (!projection) return { ok: false, price: 0, message: "Select a projection." };
  const row = matrix[projection];
  if (!row) return { ok: false, price: 0, message: `No pricing for projection ${projection}.` };
  const wKey = parseInt(widthFt, 10);
  if (!wKey || isNaN(wKey)) return { ok: false, price: 0, message: "Enter a valid width." };
  const price = row[wKey] ?? null;
  if (price == null) {
    const keys = Object.keys(row).map(Number).sort((a,b)=>a-b);
    return { ok: false, price: 0, message: `No price for width ${wKey}ft at projection ${projection}. Valid widths: ${keys[0]}–${keys[keys.length-1]}ft.` };
  }
  return { ok: true, price: Number(price), message: `Matrix price: ${fmt(price)} (Width=${wKey}ft × Projection=${projection})` };
}

// ─────────────────────────────────────────────────────────────
// SUNBRELLA FABRIC DATA — awnings only
// ─────────────────────────────────────────────────────────────
const SUNBRELLA_FABRICS = [{"brand":"Sunbrella","style_number":"4631-0000","color_name":"Burgundy"},{"brand":"Sunbrella","style_number":"4630-0000","color_name":"Cadet Grey"},{"brand":"Sunbrella","style_number":"4675-0000","color_name":"Capri"},{"brand":"Sunbrella","style_number":"4646-0000","color_name":"Captain Navy"},{"brand":"Sunbrella","style_number":"4644-0000","color_name":"Charcoal Grey"},{"brand":"Sunbrella","style_number":"4607-0000","color_name":"Charcoal Tweed"},{"brand":"Sunbrella","style_number":"14609-0000","color_name":"Cloud"},{"brand":"Sunbrella","style_number":"4676-0000","color_name":"Cocoa"},{"brand":"Sunbrella","style_number":"4662-0000","color_name":"Crest Ash"},{"brand":"Sunbrella","style_number":"4660-0000","color_name":"Crest Birch"},{"brand":"Sunbrella","style_number":"4606-0000","color_name":"Dubonnet Tweed"},{"brand":"Sunbrella","style_number":"4600-0000","color_name":"Erin Green"},{"brand":"Sunbrella","style_number":"4671-0000","color_name":"Fern"},{"brand":"Sunbrella","style_number":"4637-0000","color_name":"Forest Green"},{"brand":"Sunbrella","style_number":"4672-0000","color_name":"Heather Beige"},{"brand":"Sunbrella","style_number":"4605-0000","color_name":"Hemlock Tweed"},{"brand":"Sunbrella","style_number":"14613-0000","color_name":"Hogan Admiral"},{"brand":"Sunbrella","style_number":"14612-0000","color_name":"Hogan Arctic"},{"brand":"Sunbrella","style_number":"14616-0000","color_name":"Hogan Carob"},{"brand":"Sunbrella","style_number":"14617-0000","color_name":"Hogan Flame"},{"brand":"Sunbrella","style_number":"14611-0000","color_name":"Hogan Marina"},{"brand":"Sunbrella","style_number":"14615-0000","color_name":"Hogan Sparrow"},{"brand":"Sunbrella","style_number":"14614-0000","color_name":"Hogan Walnut"},{"brand":"Sunbrella","style_number":"4632-0000","color_name":"Ivy"},{"brand":"Sunbrella","style_number":"4603-0000","color_name":"Jockey Red"},{"brand":"Sunbrella","style_number":"4633-0000","color_name":"Linen"},{"brand":"Sunbrella","style_number":"4654-0000","color_name":"Linen Tweed"},{"brand":"Sunbrella","style_number":"4666-0000","color_name":"Logo Red"},{"brand":"Sunbrella","style_number":"4678-0000","color_name":"Marine Blue"},{"brand":"Sunbrella","style_number":"4652-0000","color_name":"Mediterranean Blue"},{"brand":"Sunbrella","style_number":"4653-0000","color_name":"Mediterranean Blue Tweed"},{"brand":"Sunbrella","style_number":"4616-0000","color_name":"Mocha Tweed"},{"brand":"Sunbrella","style_number":"4604-0000","color_name":"Natural"},{"brand":"Sunbrella","style_number":"4626-0000","color_name":"Navy"},{"brand":"Sunbrella","style_number":"4679-0000","color_name":"Ocean Blue"},{"brand":"Sunbrella","style_number":"4609-0000","color_name":"Orange"},{"brand":"Sunbrella","style_number":"4642-0000","color_name":"Oyster"},{"brand":"Sunbrella","style_number":"4601-0000","color_name":"Pacific Blue"},{"brand":"Sunbrella","style_number":"4683-0000","color_name":"Parchment"},{"brand":"Sunbrella","style_number":"4617-0000","color_name":"Royal Blue Tweed"},{"brand":"Sunbrella","style_number":"4641-0000","color_name":"Sapphire Blue"},{"brand":"Sunbrella","style_number":"4664-0000","color_name":"Sea"},{"brand":"Sunbrella","style_number":"4897-0000","color_name":"Silica Charcoal"},{"brand":"Sunbrella","style_number":"4859-0000","color_name":"Silica Dune"},{"brand":"Sunbrella","style_number":"4833-0000","color_name":"Silica Gravel"},{"brand":"Sunbrella","style_number":"4860-0000","color_name":"Silica Sesame"},{"brand":"Sunbrella","style_number":"4612-0000","color_name":"Aruba"},{"brand":"Sunbrella","style_number":"4688-0000","color_name":"Aruba"},{"brand":"Sunbrella","style_number":"4620-0000","color_name":"Beige"},{"brand":"Sunbrella","style_number":"4608-0000","color_name":"Black"},{"brand":"Sunbrella","style_number":"6023-0000","color_name":"Aquamarine"},{"brand":"Sunbrella","style_number":"6012-0000","color_name":"Aruba"},{"brand":"Sunbrella","style_number":"6020-0000","color_name":"Beige"},{"brand":"Sunbrella","style_number":"6008-0000","color_name":"Black"},{"brand":"Sunbrella","style_number":"4862-0000","color_name":"Silica Silver"},{"brand":"Sunbrella","style_number":"4861-0000","color_name":"Silica Stone"},{"brand":"Sunbrella","style_number":"4651-0000","color_name":"Silver"},{"brand":"Sunbrella","style_number":"4624-0000","color_name":"Sky Blue"},{"brand":"Sunbrella","style_number":"4684-0000","color_name":"Slate"},{"brand":"Sunbrella","style_number":"4615-0000","color_name":"Smoke"},{"brand":"Sunbrella","style_number":"4636-0000","color_name":"Storm"},{"brand":"Sunbrella","style_number":"4602-0000","color_name":"Sunflower Yellow"},{"brand":"Sunbrella","style_number":"4648-0000","color_name":"Taupe"},{"brand":"Sunbrella","style_number":"4622-0000","color_name":"Terracotta"},{"brand":"Sunbrella","style_number":"4628-0000","color_name":"Toast"},{"brand":"Sunbrella","style_number":"14618-0000","color_name":"Toast Tweed"},{"brand":"Sunbrella","style_number":"4696-0000","color_name":"Tresco Birch"},{"brand":"Sunbrella","style_number":"4695-0000","color_name":"Tresco Linen"},{"brand":"Sunbrella","style_number":"4621-0000","color_name":"True Brown"},{"brand":"Sunbrella","style_number":"4610-0000","color_name":"Turquoise"},{"brand":"Sunbrella","style_number":"4677-0000","color_name":"Tuscan"},{"brand":"Sunbrella","style_number":"4618-0000","color_name":"Walnut Brown Tweed"},{"brand":"Sunbrella","style_number":"4634-0000","color_name":"White"},{"brand":"Sunbrella","style_number":"6095-0000","color_name":"Tresco Linen"},{"brand":"Sunbrella","style_number":"6021-0000","color_name":"True Brown"},{"brand":"Sunbrella","style_number":"6010-0000","color_name":"Turquoise"},{"brand":"Sunbrella","style_number":"6077-0000","color_name":"Tuscan"},{"brand":"Sunbrella","style_number":"6018-0000","color_name":"Walnut Brown Tweed"},{"brand":"Sunbrella","style_number":"6034-0000","color_name":"White"},{"brand":"Sunbrella","style_number":"6031-0000","color_name":"Burgundy"},{"brand":"Sunbrella","style_number":"6030-0000","color_name":"Cadet Grey"},{"brand":"Sunbrella","style_number":"6075-0000","color_name":"Capri"},{"brand":"Sunbrella","style_number":"6046-0000","color_name":"Captain Navy"},{"brand":"Sunbrella","style_number":"6044-0000","color_name":"Charcoal Grey"},{"brand":"Sunbrella","style_number":"6007-0000","color_name":"Charcoal Tweed"},{"brand":"Sunbrella","style_number":"6064-0000","color_name":"Cloud"},{"brand":"Sunbrella","style_number":"6076-0000","color_name":"Cocoa"},{"brand":"Sunbrella","style_number":"6065-0000","color_name":"Concord"},{"brand":"Sunbrella","style_number":"6006-0000","color_name":"Dubonnet Tweed"},{"brand":"Sunbrella","style_number":"6000-0000","color_name":"Erin Green"},{"brand":"Sunbrella","style_number":"6071-0000","color_name":"Fern"},{"brand":"Sunbrella","style_number":"6037-0000","color_name":"Forest Green"},{"brand":"Sunbrella","style_number":"6072-0000","color_name":"Heather Beige"},{"brand":"Sunbrella","style_number":"6005-0000","color_name":"Hemlock Tweed"},{"brand":"Sunbrella","style_number":"6032-0000","color_name":"Ivy"},{"brand":"Sunbrella","style_number":"6003-0000","color_name":"Jockey Red"},{"brand":"Sunbrella","style_number":"6033-0000","color_name":"Linen"},{"brand":"Sunbrella","style_number":"6054-0000","color_name":"Linen Tweed"},{"brand":"Sunbrella","style_number":"6066-0000","color_name":"Logo Red"},{"brand":"Sunbrella","style_number":"6078-0000","color_name":"Marine Blue"},{"brand":"Sunbrella","style_number":"6052-0000","color_name":"Mediterranean Blue"},{"brand":"Sunbrella","style_number":"6053-0000","color_name":"Mediterranean Blue Tweed"},{"brand":"Sunbrella","style_number":"6036-0000","color_name":"Midnight"},{"brand":"Sunbrella","style_number":"6004-0000","color_name":"Natural"},{"brand":"Sunbrella","style_number":"6026-0000","color_name":"Navy"},{"brand":"Sunbrella","style_number":"6079-0000","color_name":"Ocean Blue"},{"brand":"Sunbrella","style_number":"6009-0000","color_name":"Orange"},{"brand":"Sunbrella","style_number":"6042-0000","color_name":"Oyster"},{"brand":"Sunbrella","style_number":"6001-0000","color_name":"Pacific Blue"},{"brand":"Sunbrella","style_number":"6083-0000","color_name":"Parchment"},{"brand":"Sunbrella","style_number":"6043-0000","color_name":"Persian Green"},{"brand":"Sunbrella","style_number":"6017-0000","color_name":"Royal Blue Tweed"},{"brand":"Sunbrella","style_number":"6041-0000","color_name":"Sapphire Blue"},{"brand":"Sunbrella","style_number":"6059-0000","color_name":"Silica Dune"},{"brand":"Sunbrella","style_number":"6063-0000","color_name":"Silica Gravel"},{"brand":"Sunbrella","style_number":"6062-0000","color_name":"Silica Silver"},{"brand":"Sunbrella","style_number":"6061-0000","color_name":"Silica Stone"},{"brand":"Sunbrella","style_number":"6051-0000","color_name":"Silver"},{"brand":"Sunbrella","style_number":"6024-0000","color_name":"Sky Blue"},{"brand":"Sunbrella","style_number":"6084-0000","color_name":"Slate"},{"brand":"Sunbrella","style_number":"6015-0000","color_name":"Smoke"},{"brand":"Sunbrella","style_number":"6002-0000","color_name":"Sunflower Yellow"},{"brand":"Sunbrella","style_number":"6048-0000","color_name":"Taupe"},{"brand":"Sunbrella","style_number":"6022-0000","color_name":"Terracotta"},{"brand":"Sunbrella","style_number":"6028-0000","color_name":"Toast"},{"brand":"Sunbrella","style_number":"2389-0060","color_name":"Toast Tweed"},{"brand":"Sunbrella","style_number":"6096-0000","color_name":"Tresco Birch"},{"brand":"Sunbrella","style_number":"80008-0000","color_name":"Black"},{"brand":"Sunbrella","style_number":"80030-0000","color_name":"Cadet Grey"},{"brand":"Sunbrella","style_number":"80046-0000","color_name":"Captain Navy"},{"brand":"Sunbrella","style_number":"80001-0000","color_name":"Pacific Blue"},{"brand":"Sunbrella","style_number":"80028-0000","color_name":"Toast"},{"brand":"Sunbrella","style_number":"4888-0000","color_name":"Clinton Granite"},{"brand":"Sunbrella","style_number":"4856-0000","color_name":"Colonnade Juniper"},{"brand":"Sunbrella","style_number":"4857-0000","color_name":"Colonnade Redwood"},{"brand":"Sunbrella","style_number":"4835-0000","color_name":"Cooper Ash"},{"brand":"Sunbrella","style_number":"4988-0000","color_name":"Cooper Black"},{"brand":"Sunbrella","style_number":"4987-0000","color_name":"Cooper Navy"},{"brand":"Sunbrella","style_number":"4813-0000","color_name":"Eastland Redwood"},{"brand":"Sunbrella","style_number":"4994-0000","color_name":"Eastridge Cocoa"},{"brand":"Sunbrella","style_number":"4709-0000","color_name":"Equate Cashmere"},{"brand":"Sunbrella","style_number":"4766-0000","color_name":"Era Ash"},{"brand":"Sunbrella","style_number":"4959-0000","color_name":"Fern / Heather Beige Blockstripe"},{"brand":"Sunbrella","style_number":"4955-0000","color_name":"Fern Classic"},{"brand":"Sunbrella","style_number":"4932-0000","color_name":"Forest / Beige / Natural / Sage Fancy"},{"brand":"Sunbrella","style_number":"4790-0000","color_name":"Forest Green Fancy"},{"brand":"Sunbrella","style_number":"4949-0000","color_name":"Forest Vintage Bar Stripe"},{"brand":"Sunbrella","style_number":"4777-0000","color_name":"Grey / Beige Chip Fancy"},{"brand":"Sunbrella","style_number":"4799-0000","color_name":"Grey / Black / White"},{"brand":"Sunbrella","style_number":"4989-0000","color_name":"Hatteras Raven"},{"brand":"Sunbrella","style_number":"4985-0000","color_name":"Havelock Brick"},{"brand":"Sunbrella","style_number":"4954-0000","color_name":"Heather Beige Classic"},{"brand":"Sunbrella","style_number":"4751-0000","color_name":"Hemlock Tweed Fancy"},{"brand":"Sunbrella","style_number":"4969-0000","color_name":"Henna / Fern Vintage"},{"brand":"Sunbrella","style_number":"4868-0000","color_name":"Kiawah Spa"},{"brand":"Sunbrella","style_number":"4789-0000","color_name":"Manhattan Classic"},{"brand":"Sunbrella","style_number":"4876-0000","color_name":"Manhattan Fog"},{"brand":"Sunbrella","style_number":"4703-0000","color_name":"Marco Black"},{"brand":"Sunbrella","style_number":"4704-0000","color_name":"Marco Blue Grey"},{"brand":"Sunbrella","style_number":"4707-0000","color_name":"Marco Olive"},{"brand":"Sunbrella","style_number":"4706-0000","color_name":"Marco Sandstone"},{"brand":"Sunbrella","style_number":"4895-0000","color_name":"Motive Denim"},{"brand":"Sunbrella","style_number":"4916-0000","color_name":"Navy / Taupe Fancy"},{"brand":"Sunbrella","style_number":"4755-0000","color_name":"Pacific Blue Fancy"},{"brand":"Sunbrella","style_number":"4712-0000","color_name":"Paxton Dew"},{"brand":"Sunbrella","style_number":"4713-0000","color_name":"Paxton Marble"},{"brand":"Sunbrella","style_number":"4711-0000","color_name":"Paxton Stone"},{"brand":"Sunbrella","style_number":"4768-0000","color_name":"Preston Stone"},{"brand":"Sunbrella","style_number":"4961-0000","color_name":"Putty Regimental"},{"brand":"Sunbrella","style_number":"4884-0000","color_name":"Saxon Cascade"},{"brand":"Sunbrella","style_number":"4885-0000","color_name":"Saxon Chili"},{"brand":"Sunbrella","style_number":"4907-0000","color_name":"Taupe 5 Bar"},{"brand":"Sunbrella","style_number":"4945-0000","color_name":"Taupe Tailored Bar Stripe"},{"brand":"Sunbrella","style_number":"4836-0000","color_name":"Tillman Shale"},{"brand":"Sunbrella","style_number":"4817-0000","color_name":"Westfield Mushroom"},{"brand":"Sunbrella","style_number":"4995-0000","color_name":"Ashford Forest"},{"brand":"Sunbrella","style_number":"4993-0000","color_name":"Baycrest Pacific"},{"brand":"Sunbrella","style_number":"4992-0000","color_name":"Baycrest Sky"},{"brand":"Sunbrella","style_number":"5704-0000","color_name":"Beaufort Black / White 6 Bar"},{"brand":"Sunbrella","style_number":"4708-0000","color_name":"Beaufort Captain Navy"},{"brand":"Sunbrella","style_number":"4752-0000","color_name":"Beaufort Cloud"},{"brand":"Sunbrella","style_number":"4806-0000","color_name":"Beaufort Forest Green / Natural 6 Bar"},{"brand":"Sunbrella","style_number":"4753-0000","color_name":"Beaufort Mushroom"},{"brand":"Sunbrella","style_number":"4771-0000","color_name":"Beaufort Peacock"},{"brand":"Sunbrella","style_number":"4746-0000","color_name":"Beaufort Sagebrush"},{"brand":"Sunbrella","style_number":"5702-0000","color_name":"Beaufort Yellow / White 6 Bar"},{"brand":"Sunbrella","style_number":"4946-0000","color_name":"Black / Taupe Fancy"},{"brand":"Sunbrella","style_number":"4923-0000","color_name":"Black Forest Fancy"},{"brand":"Sunbrella","style_number":"4710-0000","color_name":"Boone Navy"},{"brand":"Sunbrella","style_number":"4798-0000","color_name":"Burgundy / Black / White"},{"brand":"Sunbrella","style_number":"4902-0000","color_name":"Captain Navy / Natural Classic"},{"brand":"Sunbrella","style_number":"4776-0000","color_name":"Chocolate Chip Fancy"},{"brand":"Sunbrella","style_number":"8750-0000","color_name":"Bay Brown"},{"brand":"Sunbrella","style_number":"8751-0000","color_name":"Black"},{"brand":"Sunbrella","style_number":"8756-0000","color_name":"Burgundy"},{"brand":"Sunbrella","style_number":"8752-0000","color_name":"Captain Navy"},{"brand":"Sunbrella","style_number":"8753-0000","color_name":"Forest Green"},{"brand":"Sunbrella","style_number":"8754-0000","color_name":"Jockey Red"},{"brand":"Sunbrella","style_number":"8755-0000","color_name":"Pacific Blue"},{"brand":"Sunbrella","style_number":"8757-0000","color_name":"Terracotta"},{"brand":"Sunbrella","style_number":"6093-0000","color_name":"Pink"},{"brand":"Sunbrella","style_number":"4879-0000","color_name":"Rodanthe Metallic"},{"brand":"Sunbrella","style_number":"2079-0000","color_name":"Royal Navy"},{"brand":"Sunbrella","style_number":"6089-0000","color_name":"Rust"},{"brand":"Sunbrella","style_number":"6073-0000","color_name":"Spa"},{"brand":"Sunbrella","style_number":"6074-0000","color_name":"Wheat"},{"brand":"Sunbrella","style_number":"6069-0000","color_name":"Azure"},{"brand":"Sunbrella","style_number":"6091-0000","color_name":"Badger"},{"brand":"Sunbrella","style_number":"4982-0000","color_name":"Beaufort Classic"},{"brand":"Sunbrella","style_number":"1160-0060","color_name":"Beaufort Classic"},{"brand":"Sunbrella","style_number":"6040-0000","color_name":"Black Cherry"},{"brand":"Sunbrella","style_number":"4855-0000","color_name":"Colonnade Fossil"},{"brand":"Sunbrella","style_number":"4823-0000","color_name":"Colonnade Seaglass"},{"brand":"Sunbrella","style_number":"4822-0000","color_name":"Colonnade Stone"},{"brand":"Sunbrella","style_number":"4838-0000","color_name":"Emblem Badger"},{"brand":"Sunbrella","style_number":"4837-0000","color_name":"Emblem Beige"},{"brand":"Sunbrella","style_number":"4824-0000","color_name":"Emblem Classic"},{"brand":"Sunbrella","style_number":"4839-0000","color_name":"Emblem Dew"},{"brand":"Sunbrella","style_number":"4801-0000","color_name":"Emblem Fern"},{"brand":"Sunbrella","style_number":"4898-0000","color_name":"Emblem Navy"},{"brand":"Sunbrella","style_number":"6080-0000","color_name":"Fawn"},{"brand":"Sunbrella","style_number":"6085-0000","color_name":"Ginkgo"},{"brand":"Sunbrella","style_number":"4991-0000","color_name":"Manteo Cardinal"},{"brand":"Sunbrella","style_number":"4921-0000","color_name":"Mediterranean / Canvas Block Stripe"},{"brand":"Sunbrella","style_number":"4880-0000","color_name":"Moreland Taupe"},{"brand":"Sunbrella","style_number":"8408-0000","color_name":"Black"},{"brand":"Sunbrella","style_number":"8430-0000","color_name":"Cadet Grey"},{"brand":"Sunbrella","style_number":"8446-0000","color_name":"Captain Navy"},{"brand":"Sunbrella","style_number":"8404-0000","color_name":"Natural"},{"brand":"Sunbrella","style_number":"8442-0000","color_name":"Oyster"},{"brand":"Sunbrella","style_number":"8428-0000","color_name":"Toast"},{"brand":"Sunbrella","style_number":"2095-0063","color_name":"Black"},{"brand":"Sunbrella","style_number":"2097-0063","color_name":"Cadet Grey"},{"brand":"Sunbrella","style_number":"2098-0063","color_name":"Captain Navy"},{"brand":"Sunbrella","style_number":"2110-0063","color_name":"Charcoal Grey"},{"brand":"Sunbrella","style_number":"2105-0063","color_name":"Charcoal Tweed"},{"brand":"Sunbrella","style_number":"2102-0063","color_name":"Dubonnet Tweed"},{"brand":"Sunbrella","style_number":"2099-0063","color_name":"Hemlock Tweed"},{"brand":"Sunbrella","style_number":"2104-0063","color_name":"Linen"},{"brand":"Sunbrella","style_number":"2096-0063","color_name":"Linen Tweed"},{"brand":"Sunbrella","style_number":"2107-0063","color_name":"Navy"},{"brand":"Sunbrella","style_number":"2101-0063","color_name":"Oyster"},{"brand":"Sunbrella","style_number":"2103-0063","color_name":"Royal Blue Tweed"},{"brand":"Sunbrella","style_number":"2100-0063","color_name":"Toast Tweed"},{"brand":"Sunbrella","style_number":"84008-0000","color_name":"Black"},{"brand":"Sunbrella","style_number":"84030-0000","color_name":"Cadet Grey"},{"brand":"Sunbrella","style_number":"84044-0000","color_name":"Charcoal Grey"}];

// ─────────────────────────────────────────────────────────────
// PHIFER FABRICS — screen products only
// ─────────────────────────────────────────────────────────────
const PHIFER_FABRICS = [
  // SunTex 80
  { brand: "Phifer", series: "SunTex", openness: "80", style_number: "ST80-Black", color_name: "Black" },
  { brand: "Phifer", series: "SunTex", openness: "80", style_number: "ST80-Brown", color_name: "Brown" },
  { brand: "Phifer", series: "SunTex", openness: "80", style_number: "ST80-Grey", color_name: "Grey" },
  { brand: "Phifer", series: "SunTex", openness: "80", style_number: "ST80-Beige", color_name: "Beige" },
  { brand: "Phifer", series: "SunTex", openness: "80", style_number: "ST80-Stucco", color_name: "Stucco" },
  { brand: "Phifer", series: "SunTex", openness: "80", style_number: "ST80-DarkBronze", color_name: "Dark Bronze" },

  // SunTex 90
  { brand: "Phifer", series: "SunTex", openness: "90", style_number: "ST90-Black", color_name: "Black" },
  { brand: "Phifer", series: "SunTex", openness: "90", style_number: "ST90-Brown", color_name: "Brown" },
  { brand: "Phifer", series: "SunTex", openness: "90", style_number: "ST90-Grey", color_name: "Grey" },
  { brand: "Phifer", series: "SunTex", openness: "90", style_number: "ST90-Beige", color_name: "Beige" },
  { brand: "Phifer", series: "SunTex", openness: "90", style_number: "ST90-Stucco", color_name: "Stucco" },
  { brand: "Phifer", series: "SunTex", openness: "90", style_number: "ST90-DarkBronze", color_name: "Dark Bronze" },

  // SunTex 95
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-DarkBronze", color_name: "Dark Bronze" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-White", color_name: "White" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-WhiteGrey", color_name: "White/Grey" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Stucco", color_name: "Stucco" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Sand", color_name: "Sand" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Alpaca", color_name: "Alpaca" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Chestnut", color_name: "Chestnut" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Mocha", color_name: "Mocha" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Carbon", color_name: "Carbon" },
  { brand: "Phifer", series: "SunTex", openness: "95", style_number: "ST95-Black", color_name: "Black" },

  // SunTex 97
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-DarkBronze", color_name: "Dark Bronze" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-White", color_name: "White" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-WhiteGrey", color_name: "White/Grey" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Stucco", color_name: "Stucco" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Sand", color_name: "Sand" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Alpaca", color_name: "Alpaca" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Chestnut", color_name: "Chestnut" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Mocha", color_name: "Mocha" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Carbon", color_name: "Carbon" },
  { brand: "Phifer", series: "SunTex", openness: "97", style_number: "ST97-Black", color_name: "Black" },

  // SunTex 99
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-DarkBronze", color_name: "Dark Bronze" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-White", color_name: "White" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-WhiteGrey", color_name: "White/Grey" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Stucco", color_name: "Stucco" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Sand", color_name: "Sand" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Alpaca", color_name: "Alpaca" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Chestnut", color_name: "Chestnut" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Mocha", color_name: "Mocha" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Carbon", color_name: "Carbon" },
  { brand: "Phifer", series: "SunTex", openness: "99", style_number: "ST99-Black", color_name: "Black" },

  // SunTex Matte 95
  { brand: "Phifer", series: "SunTex Matte", openness: "95", style_number: "STM95-DarkBronze", color_name: "Matte Dark Bronze" },
  { brand: "Phifer", series: "SunTex Matte", openness: "95", style_number: "STM95-Niko", color_name: "Matte Niko" },
  { brand: "Phifer", series: "SunTex Matte", openness: "95", style_number: "STM95-IronGrey", color_name: "Matte Iron Grey" },
  { brand: "Phifer", series: "SunTex Matte", openness: "95", style_number: "STM95-Black", color_name: "Matte Black" },

  // SunTex Matte 97
  { brand: "Phifer", series: "SunTex Matte", openness: "97", style_number: "STM97-DarkBronze", color_name: "Matte Dark Bronze" },
  { brand: "Phifer", series: "SunTex Matte", openness: "97", style_number: "STM97-Niko", color_name: "Matte Niko" },
  { brand: "Phifer", series: "SunTex Matte", openness: "97", style_number: "STM97-IronGrey", color_name: "Matte Iron Grey" },
  { brand: "Phifer", series: "SunTex Matte", openness: "97", style_number: "STM97-Black", color_name: "Matte Black" },

  // SheerWeave Privacy
  { brand: "Phifer", series: "SheerWeave", openness: "Privacy", style_number: "SWP-EcoChalk", color_name: "Eco Chalk" },
  { brand: "Phifer", series: "SheerWeave", openness: "Privacy", style_number: "SWP-EcoAsh", color_name: "Eco Ash" },
  { brand: "Phifer", series: "SheerWeave", openness: "Privacy", style_number: "SWP-EcoEbony", color_name: "Eco Ebony" },
];

// ─────────────────────────────────────────────────────────────
// TWITCHELL FABRICS — screen products only
// ─────────────────────────────────────────────────────────────
const TWITCHELL_FABRICS_EXTENDED = [
  // Nano 50
  { brand: "Twitchell", series: "Nano 50", style_number: "N50-White", color_name: "White" },
  { brand: "Twitchell", series: "Nano 50", style_number: "N50-Black", color_name: "Black" },

  // Nano 55
  { brand: "Twitchell", series: "Nano 55", style_number: "N55-White", color_name: "White" },
  { brand: "Twitchell", series: "Nano 55", style_number: "N55-Black", color_name: "Black" },

  // Nano 60
  { brand: "Twitchell", series: "Nano 60", style_number: "N60-Black", color_name: "Black" },

  // Nano 70
  { brand: "Twitchell", series: "Nano 70", style_number: "N70-Black", color_name: "Black" },

  // Textilene 80
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-White", color_name: "White" },
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-DesertSand", color_name: "Desert Sand" },
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-Sandstone", color_name: "Sandstone" },
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-DuskGrey", color_name: "Dusk Grey" },
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-Brown", color_name: "Brown" },
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-BlackBrown", color_name: "Black/Brown" },
  { brand: "Twitchell", series: "Textilene 80", style_number: "T80-Black", color_name: "Black" },

  // Textilene 90
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-White", color_name: "White" },
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-DesertSand", color_name: "Desert Sand" },
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-Sandstone", color_name: "Sandstone" },
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-DuskGrey", color_name: "Dusk Grey" },
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-Brown", color_name: "Brown" },
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-BlackBrown", color_name: "Black/Brown" },
  { brand: "Twitchell", series: "Textilene 90", style_number: "T90-Black", color_name: "Black" },

  // Textilene Nano 95
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-White", color_name: "White" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Bone", color_name: "Bone" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Sable", color_name: "Sable" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-DesertSand", color_name: "Desert Sand" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Almond", color_name: "Almond" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Cafe", color_name: "Cafe" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-StoneTexture", color_name: "Stone Texture" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-ShadowTexture", color_name: "Shadow Texture" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Tumbleweed", color_name: "Tumbleweed" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-EspressoTexture", color_name: "Espresso Texture" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Granite", color_name: "Granite" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Tobacco", color_name: "Tobacco" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-Charcoal", color_name: "Charcoal" },
  { brand: "Twitchell", series: "Textilene Nano 95", style_number: "TN95-FlatBlack", color_name: "Flat Black" },

  // Textilene Nano 97
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-White", color_name: "White" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Bone", color_name: "Bone" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Sable", color_name: "Sable" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-DesertSand", color_name: "Desert Sand" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Almond", color_name: "Almond" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Cafe", color_name: "Cafe" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-StoneTexture", color_name: "Stone Texture" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-ShadowTexture", color_name: "Shadow Texture" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Tumbleweed", color_name: "Tumbleweed" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-EspressoTexture", color_name: "Espresso Texture" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Granite", color_name: "Granite" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Tobacco", color_name: "Tobacco" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-Charcoal", color_name: "Charcoal" },
  { brand: "Twitchell", series: "Textilene Nano 97", style_number: "TN97-FlatBlack", color_name: "Flat Black" },

  // Textilene Nano 99
  { brand: "Twitchell", series: "Textilene Nano 99", style_number: "TN99-FlatBlack", color_name: "Flat Black" },
  { brand: "Twitchell", series: "Textilene Nano 99", style_number: "TN99-Charcoal", color_name: "Charcoal" },
  { brand: "Twitchell", series: "Textilene Nano 99", style_number: "TN99-EspressoTexture", color_name: "Espresso Texture" },
  { brand: "Twitchell", series: "Textilene Nano 99", style_number: "TN99-Granite", color_name: "Granite" },
  { brand: "Twitchell", series: "Textilene Nano 99", style_number: "TN99-Tobacco", color_name: "Tobacco" },

  // Textilene Dimout
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-Tan", color_name: "Tan" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-StoneTexture", color_name: "Stone Texture" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-Putty", color_name: "Putty" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-Tobacco", color_name: "Tobacco" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-LightGrey", color_name: "Light Grey" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-ShadowTexture", color_name: "Shadow Texture" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-Grey", color_name: "Grey" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-Charcoal", color_name: "Charcoal" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-EspressoTexture", color_name: "Espresso Texture" },
  { brand: "Twitchell", series: "Textilene Dimout", style_number: "TD-FlatBlack", color_name: "Flat Black" },
];

// ─────────────────────────────────────────────────────────────
// PREMIUM FABRIC SURCHARGE
// ─────────────────────────────────────────────────────────────
const PREMIUM_FABRIC_SURCHARGE_RATE = 35;

function isPremiumFabricSurcharge(fabricSelection) {
  if (!fabricSelection?.brand || !fabricSelection?.style_number) return false;
  const brand    = fabricSelection.brand;
  const series   = fabricSelection.series || "";
  const styleNum = fabricSelection.style_number;
  if (brand === "Phifer" && (series === "SheerWeave Privacy" || styleNum.startsWith("SWP-"))) return true;
  if (brand === "Twitchell" && (series === "Dimout" || styleNum.startsWith("Dimout-"))) return true;
  return false;
}

function calcPremiumFabricSurcharge(fabricSelection, widthRaw) {
  if (!isPremiumFabricSurcharge(fabricSelection)) return 0;
  const widthFt = toFeetKey(widthRaw);
  if (!widthFt) return 0;
  return widthFt * PREMIUM_FABRIC_SURCHARGE_RATE;
}

const SCREEN_FABRIC_BRANDS = ["Phifer", "Twitchell"];
const AWNING_FABRIC_BRANDS = ["Sunbrella"];
const FABRIC_BRANDS = AWNING_FABRIC_BRANDS;

function getScreenFabricsByBrand(brand) {
  if (!brand) return [];
  if (brand === "Phifer")    return PHIFER_FABRICS;
  if (brand === "Twitchell") return TWITCHELL_FABRICS_EXTENDED;
  return [];
}

function getAwningFabricsByBrand(brand) {
  if (!brand) return [];
  if (brand === "Sunbrella") return SUNBRELLA_FABRICS.filter(f => f.brand === "Sunbrella");
  return [];
}

function getFabricsByBrand(brand, fabricContext = "screen") {
  return fabricContext === "awning"
    ? getAwningFabricsByBrand(brand)
    : getScreenFabricsByBrand(brand);
}

function buildFabricLabel(fabricSelection) {
  if (!fabricSelection?.brand) return "";
  if (fabricSelection.style_number) {
    const opennessPart = fabricSelection.openness ? ` (${fabricSelection.openness}% open)` : "";
    return fabricSelection.style_number + " - " + (fabricSelection.color_name || "") + opennessPart;
  }
  return fabricSelection.brand;
}

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
    name: "Dooya M50R",
    displayName: "Dooya M50R",
    brand: "Dooya",
    priceAdjustment: -550,
    includedInBase: false,
    compatibleProducts: [
      "Motorized Power Screen 5in Cassette"
    ],
    notes: "Alternative motor —$550 pricing TBD (may apply credit from base)",
  },
  {
  id: "dooya_m60mrs",
  name: "Dooya M60MRS",
  displayName: "Dooya M60MRS",
  brand: "Dooya",
  priceAdjustment: -750,
  includedInBase: false,
  compatibleProducts: ["Motorized Power Screen 6in Cassette"],
  notes: "Swap for Somfy 550 — applies -$750 deduct",
},
];

const CONTROL_CATALOG = [
  // ── Somfy Remotes ──
  { id: "somfy_remote_1ch",  brand: "Somfy", type: "remote",      name: "1 Channel Somfy Remote",           channels: 1,  price: 125 },
  { id: "somfy_remote_5ch",  brand: "Somfy", type: "remote",      name: "5 Channel Somfy Remote",           channels: 5,  price: 180 },
  { id: "somfy_remote_16ch", brand: "Somfy", type: "remote",      name: "16 Channel Somfy Remote",          channels: 16, price: 320 },
  // ── Somfy Wall Switches ──
  { id: "somfy_wall_1ch",    brand: "Somfy", type: "wall_switch", name: "Somfy DecoFlex WireFree 1 Channel", channels: 1,  price: 175 },
  { id: "somfy_wall_5ch",    brand: "Somfy", type: "wall_switch", name: "Somfy DecoFlex WireFree 5 Channel", channels: 5,  price: 250 },
  // ── Dooya Remotes ──
  { id: "dooya_remote_1ch",  brand: "Dooya", type: "remote",      name: "1 Channel Dooya Remote",           channels: 1,  price: 100 },
  { id: "dooya_remote_5ch",  brand: "Dooya", type: "remote",      name: "5 Channel Dooya Remote",           channels: 5,  price: 125 },
  { id: "dooya_remote_15ch", brand: "Dooya", type: "remote",      name: "15 Channel Dooya Remote",          channels: 15, price: 200 },
];

// Credit applied when the included control is replaced
const INCLUDED_CONTROL_CREDIT = {
  somfy: { 1: 125, 5: 180, 16: 320 },
  dooya: { 1: 100, 5: 125, 15: 200 },
};

function getMotorBrand(motorId) {
  const motor = MOTOR_CATALOG.find(m => m.id === motorId);
  if (!motor) return "Somfy";
  return motor.brand; // "Somfy" or "Dooya"
}

function getIncludedControlId(motorBrand, totalOpenings) {
  if (motorBrand === "Dooya") {
    if (totalOpenings <= 1)  return "dooya_remote_1ch";
    if (totalOpenings <= 5)  return "dooya_remote_5ch";
    return "dooya_remote_15ch"; // max 15
  }
  // Somfy
  if (totalOpenings <= 1)  return "somfy_remote_1ch";
  if (totalOpenings <= 5)  return "somfy_remote_5ch";
  return "somfy_remote_16ch"; // max 16
}

function getIncludedControlCredit(motorBrand, totalOpenings) {
  if (motorBrand === "Dooya") {
    if (totalOpenings <= 1) return INCLUDED_CONTROL_CREDIT.dooya[1];
    if (totalOpenings <= 5) return INCLUDED_CONTROL_CREDIT.dooya[5];
    return INCLUDED_CONTROL_CREDIT.dooya[15];
  }
  if (totalOpenings <= 1) return INCLUDED_CONTROL_CREDIT.somfy[1];
  if (totalOpenings <= 5) return INCLUDED_CONTROL_CREDIT.somfy[5];
  return INCLUDED_CONTROL_CREDIT.somfy[16];
}

function getAvailableControls(motorBrand) {
  return CONTROL_CATALOG.filter(c => c.brand === motorBrand);
}

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

function getDefaultMotorDisplayName(productName) {
  const motorId = getDefaultMotorId(productName);
  if (!motorId) return null;
  const motor = MOTOR_CATALOG.find(m => m.id === motorId);
  return motor?.displayName || null;
}

// ─────────────────────────────────────────────────────────────
// MPS DEFAULTS
// ─────────────────────────────────────────────────────────────
const MPS_DEFAULTS = {
  mountTypes:       ["Surface", "Inside", "Soffit Mount"],
  trackTypes:       ["Zipper", "Wire Guide", "Storm Rail"],
  motorTypes:       ["Somfy (default)", "Somfy RTS", "Somfy WireFree", "Custom"],
  // CHANGE 1: Updated L-channel sizes — now derived from L_CHANNEL_SIZES constant
  lChannelSizes:    L_CHANNEL_SIZES.map(s => s.label),
  lChannelLocs:     ["Left", "Right", "Top", "Bottom"],
  buildoutTypes:    ["Wood", "Alumitube"],
  woodSizes:        ["2x4", "2x6", "2x8", "2x10", "4x4", "4x6", "4x8", "4x10"],
  motorSides:       ["Left", "Right"],
  weightBarTypes:   ["Sand", "White", "Black", "Bronze", "Custom"],
  cassetteColors:   ["Sand", "White", "Black", "Bronze", "Custom"],
  trackColors:      ["Sand", "White", "Black", "Bronze", "Custom"],
  remoteTypes:      ["1 Channel Somfy Remote", "5 Channel Somfy Remote", "16 Channel Somfy Remote"],
};

const WOOD_BUILDOUT_RATES = {
  "2x4":  4,  "2x6":  6,  "2x8":  8,  "2x10": 10,
  "4x4":  10, "4x6":  25, "4x8":  30, "4x10": 40,
};

const STORM_RAIL_RATE        = 40;
// CHANGE 6: Base L_CHANNEL_RATE kept as fallback; per-size rates now used via getLChannelRate()
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
// WIND SENSOR ADD-ONS
// ─────────────────────────────────────────────────────────────
const WIND_SENSOR_WIRED = {
  id: "wind_sensor_wired",
  name: "Somfy Eolis RTS 24V Wired Wind Sensor Kit",
  shortName: "Eolis RTS 24V (Wired)",
  price: 290,
  type: "global",
  description: "Shared sensor — selected once, applies across all openings",
};

const WIND_SENSOR_WIRELESS = {
  id: "wind_sensor_wireless",
  name: "Somfy Eolis 3D Wirefree RTS Wind Sensor",
  shortName: "Eolis 3D Wirefree (Wireless)",
  price: 290,
  type: "per_opening",
  description: "Per-opening sensor — quantity scales with number of openings",
};

function getAvailableWindSensors(productName) {
  const isCassette = productName === "Motorized Power Screen 5in Cassette" ||
                     productName === "Motorized Power Screen 6in Cassette";
  if (isCassette) return [WIND_SENSOR_WIRED];
  return [WIND_SENSOR_WIRED, WIND_SENSOR_WIRELESS];
}

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
      message: `No price for Width=${widthKey}ft × Height=${heightKey}ft. Valid height: ${rowKeys[0]}–${rowKeys[rowKeys.length-1]}ft, Width: ${colKeys[0]}–${colKeys[colKeys.length-1]}ft.`
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
  "Skylight Plus MRA": [
    { id:"somfy_wind_sensor", name:"RTS Wind Sensor",                     pricingType:"per_unit", rate:350, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"somfy_sun_wind",    name:"RTS Sun/Wind",                        pricingType:"per_unit", rate:450, unit:"units", unitShort:"ea", placeholder:"1", group:"Somfy RTS" },
    { id:"power_cord_24ft",   name:"24\u2019 Motor Power Cord (upgrade)", pricingType:"per_unit", rate:80,  unit:"units", unitShort:"ea", placeholder:"1", group:"Power Cable Options" },
    { id:"bracket_12in",      name:"Roof Mount Bracket 12\u2033 Tall",   pricingType:"per_unit", rate:125, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_16in",      name:"Roof Mount Bracket 16\u2033 Tall",   pricingType:"per_unit", rate:150, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
    { id:"bracket_24in",      name:"Roof Mount Bracket 24\u2033 Tall",   pricingType:"per_unit", rate:175, unit:"units", unitShort:"ea", placeholder:"1", group:"Roof Mount Brackets (Brown Only)" },
  ],
  "Skyline Motorized Retractable Awning": [
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
  "Open Roll Motorized Retractable Awning": [
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
  // CHANGE 1: default size is now "1x1" (first in the updated list)
  return { id: uid(), loc: "Left", size: "1x1", customSize: "", lf: "", manualPrice: "", photo: null };
}

function createBuildout() {
  return {
    id: uid(), type: "Wood", woodSize: "2x4", aluminubeSize: "1.5×1.5",
    isCustomAlumitubeSize: false, customAlumitubeSize: "", dims: "", lf: "", customRate: "",
    // CHANGE 4: custom wood fields
    isCustomWoodSize: false, customWoodSizeLabel: "", customWoodRate: "",
    photo: null,
  };
}

function createOpening(productName = "", areaDefaults = {}) {
  return {
    id: uid(), label: "", width: "", height: "",
    motorSide: areaDefaults.motorSide || "Left",
    motorId: getDefaultMotorId(productName) || "",
    fabricSelection: { brand: "", style_number: "", color_name: "", series: "" },
    lChannels: [],
    buildouts: [],
    mountOverride: "", trackOverride: "",
    colorOverride: "", trackColorOverride: "",
    motorOverride: "",
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
    fabricSelection: { brand: "", style_number: "", color_name: "", series: "" },
    cassetteColor: "", trackColor: "",
    motorType: "Somfy (default)",
    weightBar: "", remote: "",
    areaPhoto: null, openings: [createOpening(productName)],
  };
}

function createMRAConfig() {
  return {
    widthFt: "",
    widthIn: "",
    projection: "",
    fabricBrand: "",
    style_number: "",
    color_name: "",
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
    // CHANGE 4: support custom wood size with custom rate
    if (bo.woodSize === "Custom" || bo.isCustomWoodSize) {
      const customRate = parseFloat(bo.customWoodRate) || 0;
      return (parseFloat(bo.lf) || 0) * customRate;
    }
    const rate = WOOD_BUILDOUT_RATES[bo.woodSize] || 0;
    return (parseFloat(bo.lf) || 0) * rate;
  }
  // CHANGE 5: Alumitube — custom size path unchanged
  if (bo.isCustomAlumitubeSize) return parseFloat(bo.customRate) || 0;
  return (parseFloat(bo.lf) || 0) * ALUMITUBE_DEFAULT_RATE;
}

// CHANGE 1: calcLChannelCost now uses per-size rate from L_CHANNEL_SIZES
function calcLChannelCost(lc) {
  if (lc.manualPrice !== "" && !isNaN(parseFloat(lc.manualPrice))) return parseFloat(lc.manualPrice);
  const rate = lc.size === "Custom" ? 0 : getLChannelRate(lc.size);
  return (parseFloat(lc.lf) || 0) * rate;
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
  const effectiveFabric = (opening.fabricSelection?.brand)
    ? opening.fabricSelection
    : (areaDefaults?.fabricSelection?.brand ? areaDefaults.fabricSelection : null);
  total += calcPremiumFabricSurcharge(effectiveFabric, opening.width);
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

function calcWindSensorTotal(windSensorSelections, totalOpenings) {
  let total = 0;
  if (windSensorSelections?.wired)    total += WIND_SENSOR_WIRED.price;
  if (windSensorSelections?.wireless) total += WIND_SENSOR_WIRELESS.price * Math.max(1, totalOpenings);
  return total;
}

function getAutoTransmitter(totalAwningQty) {
  if (totalAwningQty <= 2) return "5-Channel Somfy Transmitter";
  return "16-Channel Somfy Transmitter";
}

// ─────────────────────────────────────────────────────────────
// SESSION STORAGE PERSISTENCE
// ─────────────────────────────────────────────────────────────
const SESSION_KEY = "productSummaryState_v4";

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
// MOTOR SELECTOR
// ─────────────────────────────────────────────────────────────
function MotorSelector({ 
  motorId, 
  productName, 
  onChange, 
  currentOpeningId,
  allOpenings = [], // All openings in this product group
  currentMotorBrand // Pass the existing motor brand from parent
}) {
  const compatibleMotors = getCompatibleMotors(productName);
  const defaultMotorId = getDefaultMotorId(productName);
  const selectedMotor = MOTOR_CATALOG.find(m => m.id === motorId);
  const isDefault = motorId === defaultMotorId || (!motorId && !!defaultMotorId);
  const adjustment = selectedMotor?.priceAdjustment || 0;

  // Get the existing motor brand from all openings (excluding current opening)
  const getExistingMotorBrand = () => {
    for (const opening of allOpenings) {
      if (opening.id !== currentOpeningId && opening.motorId) {
        return getMotorBrand(opening.motorId);
      }
    }
    return null;
  };

  const handleMotorChange = (newMotorId) => {
    const newMotorBrand = getMotorBrand(newMotorId);
    const existingBrand = getExistingMotorBrand();
    
    // Check if trying to mix motor types within same product group
    if (existingBrand && existingBrand !== newMotorBrand) {
      alert("⚠️ This product already uses a different motor type.\n\nTo use another motor type, please create a new product group.");
      return;
    }
    
    onChange(newMotorId);
  };

  return (
    <div className="motor-selector-field mps-field">
      <label className="mps-label">
        Motor
        {isDefault && <span className="motor-badge motor-badge--included">✓ Included in base price</span>}
        {!isDefault && adjustment < 0 && <span className="motor-badge motor-badge--credit">Credit: {fmt(adjustment)}</span>}
        {!isDefault && adjustment > 0 && <span className="motor-badge motor-badge--extra">+{fmt(adjustment)}</span>}
      </label>
      <select 
        className="mps-select motor-select" 
        value={motorId || defaultMotorId || ""} 
        onChange={e => handleMotorChange(e.target.value)}
      >
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
// FABRIC TYPEAHEAD
// ─────────────────────────────────────────────────────────────
function FabricTypeahead({ brand, value, onChange, fabricContext = "screen" }) {
  const [query, setQuery] = useState(
    value?.style_number ? (value.style_number + " - " + value.color_name) : ""
  );
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const fabrics = getFabricsByBrand(brand, fabricContext);

  const matches = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (!q) return fabrics.slice(0, 50);
  return fabrics.filter(f =>
    f.style_number.toLowerCase().includes(q) ||
    f.color_name.toLowerCase().includes(q) ||
    (f.series && f.series.toLowerCase().includes(q)) ||
    (f.openness && f.openness.includes(q))   // ← ADD THIS LINE
  ).slice(0, 60);
}, [query, brand, fabricContext]);

  useEffect(() => {
    if (value?.style_number) {
      setQuery(value.style_number + " - " + value.color_name);
    } else {
      setQuery("");
    }
  }, [value?.style_number]);

  const select = (fabric) => {
    setQuery(fabric.style_number + " - " + fabric.color_name);
    setOpen(false);
    onChange({
      brand:        fabric.brand,
      style_number: fabric.style_number,
      color_name:   fabric.color_name,
      series:       fabric.series || "",
    });
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (value?.style_number) onChange({ brand, style_number: "", color_name: "", series: "" });
  };

  const handleBlur = () => {
    setTimeout(() => { setOpen(false); setFocused(false); }, 150);
  };

  const handleFocus = () => {
    setFocused(true);
    setOpen(true);
  };

  const clearSelection = () => {
    setQuery("");
    setOpen(false);
    onChange({ brand, style_number: "", color_name: "", series: "" });
    inputRef.current?.focus();
  };

  const isSelected = !!value?.style_number;

  return (
    <div className="fabric-typeahead-wrap">
      <div className={`fabric-typeahead-input-row${focused ? " fabric-typeahead-focused" : ""}${isSelected ? " fabric-typeahead-selected" : ""}`}>
        <span className="fabric-typeahead-search-icon">🔍</span>
        <input
          ref={inputRef}
          className="fabric-typeahead-input"
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search by style/color name"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button type="button" className="fabric-typeahead-clear" onClick={clearSelection} title="Clear">✕</button>
        )}
        {isSelected && <span className="fabric-typeahead-check">✓</span>}
      </div>

      {open && !isSelected && (
        <div className="fabric-typeahead-dropdown">
          {matches.length === 0 ? (
            <div className="fabric-typeahead-empty">No fabrics match "{query}"</div>
          ) : (
            <>
              {!query.trim() && (
                <div className="fabric-typeahead-hint">Showing first 50 — type to search all {fabrics.length}</div>
              )}
              {matches.map(f => (
                <button
  key={f.style_number}
  type="button"
  className="fabric-typeahead-option"
  onMouseDown={() => select(f)}
>
  <span className="fabric-typeahead-style">{f.style_number}</span>
  <span className="fabric-typeahead-color">
    {f.color_name}
    {f.series && <span className="fabric-typeahead-series"> — {f.series}</span>}
    {f.openness && <span className="fabric-typeahead-series"> ({f.openness}% open)</span>}  {/* ← ADD THIS */}
  </span>
</button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FABRIC SELECTOR
// ─────────────────────────────────────────────────────────────
function FabricSelector({ fabricSelection = {}, onChange, label = "Fabric", fabricContext = "screen" }) {
  const { brand = "", style_number = "", color_name = "", series = "" } = fabricSelection;
  const fabricLabel = buildFabricLabel(fabricSelection);

  const brandList = fabricContext === "awning" ? AWNING_FABRIC_BRANDS : SCREEN_FABRIC_BRANDS;

  const handleBrandChange = (newBrand) => {
    onChange({ brand: newBrand, style_number: "", color_name: "", series: "" });
  };

  const handleFabricChange = (updated) => {
    onChange({ ...fabricSelection, ...updated });
  };

  const hasSurcharge = isPremiumFabricSurcharge(fabricSelection);

  return (
    <div className="fabric-selector">
      <div className="fabric-selector-label">
        <span className="mps-label">{label}</span>
        {fabricLabel && style_number && (
          <span className="fabric-label-badge">{fabricLabel}</span>
        )}
        {hasSurcharge && (
          <span className="fabric-premium-badge" title="Premium fabric: +$35/LF (width) surcharge applies per opening">
            ⚡ Premium +${PREMIUM_FABRIC_SURCHARGE_RATE}/LF
          </span>
        )}
      </div>
      <div className="fabric-cascade-grid">
        <div className="mps-field">
          <label className="mps-label fabric-step-label"><span className="fabric-step-num">1</span> Brand</label>
          <select className="mps-select" value={brand} onChange={e => handleBrandChange(e.target.value)}>
            <option value="">Select Brand</option>
            {brandList.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {brand && (
          <div className="mps-field fabric-typeahead-field">
            <label className="mps-label fabric-step-label"><span className="fabric-step-num">2</span> Fabric</label>
            <FabricTypeahead
              brand={brand}
              value={{ brand, style_number, color_name, series }}
              onChange={handleFabricChange}
              fabricContext={fabricContext}
            />
          </div>
        )}
      </div>

      {hasSurcharge && (
        <div className="fabric-surcharge-notice">
          <span className="fabric-surcharge-notice-icon">💡</span>
          <span>
            <strong>{series || (style_number.startsWith("SWP-") ? "SheerWeave Privacy" : "Dimout")}</strong> fabric
            includes a <strong>+${PREMIUM_FABRIC_SURCHARGE_RATE}/LF surcharge</strong> calculated from
            each opening's width.
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SKYLIGHT FABRIC SELECTOR
// ─────────────────────────────────────────────────────────────
function SkylightFabricSelector({ fabricBrand, style_number, color_name, onChange }) {
  const fabricLabel = style_number ? (style_number + " - " + (color_name || "")) : "";

  const handleBrandChange = (newBrand) => {
    onChange({ fabricBrand: newBrand, style_number: "", color_name: "" });
  };

  const handleFabricChange = (updated) => {
    onChange({ fabricBrand, style_number: updated.style_number, color_name: updated.color_name });
  };

  return (
    <div className="fabric-selector">
      <div className="fabric-selector-label">
        <span className="mps-label">Fabric</span>
        {fabricLabel && <span className="fabric-label-badge">{fabricLabel}</span>}
      </div>
      <div className="fabric-cascade-grid">
        <div className="mps-field">
          <label className="mps-label fabric-step-label"><span className="fabric-step-num">1</span> Fabric Brand</label>
          <select className="mps-select" value={fabricBrand} onChange={e => handleBrandChange(e.target.value)}>
            <option value="">Select Brand</option>
            {AWNING_FABRIC_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {fabricBrand && (
          <div className="mps-field fabric-typeahead-field">
            <label className="mps-label fabric-step-label"><span className="fabric-step-num">2</span> Fabric</label>
            <FabricTypeahead
              brand={fabricBrand}
              value={{ brand: fabricBrand, style_number: style_number || "", color_name: color_name || "", series: "" }}
              onChange={handleFabricChange}
              fabricContext="awning"
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
// CHANGE 1 + 6: L-CHANNEL ITEM EDITOR
// — Updated size dropdown with tiered pricing
// — Clean "Linear Feet" label, no long text
// ─────────────────────────────────────────────────────────────
function LChannelItem({ lc, index, onChange, onRemove, showRemove }) {
  const set  = (field, val) => onChange({ ...lc, [field]: val });
  const cost = calcLChannelCost(lc);
  const isManualOverride = lc.manualPrice !== "" && !isNaN(parseFloat(lc.manualPrice));
  const currentRate = lc.size === "Custom" ? null : getLChannelRate(lc.size);

  return (
    <div className="structural-item-card">
      <div className="structural-item-header">
        <span className="structural-item-label">L-Channel #{index + 1}</span>
        {showRemove && <button type="button" className="structural-item-remove" onClick={onRemove}>✕ Remove</button>}
      </div>

      {/* CHANGE 6: Clean row layout — no long pricing text in labels */}
      <div className="structural-fields-grid">
        {/* Location */}
        <div className="mps-field">
          <label className="mps-label">Location</label>
          <select className="mps-select" value={lc.loc} onChange={e => set("loc", e.target.value)}>
            {MPS_DEFAULTS.lChannelLocs.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* CHANGE 1: Updated size dropdown with rate shown in option label */}
        <div className="mps-field">
          <label className="mps-label">
            Size
            {currentRate != null && <span className="lchannel-rate-badge">${currentRate}/LF</span>}
          </label>
          <select className="mps-select" value={lc.size} onChange={e => set("size", e.target.value)}>
            {L_CHANNEL_SIZES.map(s => (
              <option key={s.label} value={s.label}>
                {s.label}{s.rate != null ? ` — $${s.rate}/LF` : " — custom price"}
              </option>
            ))}
          </select>
        </div>

        {/* Custom size input — only shown when Custom is selected */}
        {lc.size === "Custom" && (
          <Field label="Custom Size" value={lc.customSize} onChange={v => set("customSize", v)} placeholder='e.g. 2"×3"' />
        )}

        {/* CHANGE 6: Simple "Linear Feet" label */}
        <Field
          label="Linear Feet"
          type="number"
          value={lc.lf}
          onChange={v => set("lf", v)}
          placeholder="e.g. 8"
          min="0"
          step="0.5"
        />

        <Field
          label="Manual Price Override ($)"
          type="number"
          value={lc.manualPrice}
          onChange={v => set("manualPrice", v)}
          placeholder="Leave blank to use rate"
          min="0"
        />
      </div>

      {/* Cost display */}
      {(lc.lf || isManualOverride) && (
        <div className="structural-calc">
          {isManualOverride
            ? <>L-Channel (manual override): <strong>{fmt(cost)}</strong></>
            : lc.size === "Custom"
              ? <>L-Channel (Custom — enter manual price above): <strong>{fmt(cost)}</strong></>
              : <>{lc.size}: {lc.lf} LF × ${currentRate}/LF = <strong>{fmt(cost)}</strong></>
          }
        </div>
      )}
      <PhotoUpload label="L-Channel Photo (optional)" value={lc.photo} onChange={v => set("photo", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE 4 + 5 + 6: BUILDOUT ITEM EDITOR
// — Wood: Custom option added (text + rate inputs)
// — Alumitube: replaced radio with dropdown (CHANGE 5)
// — Clean label, no long pricing text (CHANGE 6)
// ─────────────────────────────────────────────────────────────
function BuildoutItem({ bo, index, onChange, onRemove }) {
  const set = (field, val) => onChange({ ...bo, [field]: val });
  const cost = calcBuildoutCost(bo);
  const isWood = bo.type === "Wood";

  // CHANGE 4: detect custom wood
  const isCustomWood = isWood && (bo.woodSize === "Custom" || bo.isCustomWoodSize);

  // Rate label for standard wood
  const woodRate = (!isCustomWood && isWood) ? (WOOD_BUILDOUT_RATES[bo.woodSize] || 0) : null;

  return (
    <div className="structural-item-card">
      <div className="structural-item-header">
        <span>Buildout #{index + 1}</span>
        <button type="button" className="structural-item-remove" onClick={onRemove}>✕</button>
      </div>

      <div className="structural-fields-grid">

        {/* Type dropdown */}
        <Sel label="Type" value={bo.type} options={["Wood", "Alumitube"]} onChange={v => set("type", v)} />

        {/* ── WOOD path ── */}
        {isWood && (
          <div className="mps-field">
            <label className="mps-label">
              Wood Size
              {woodRate != null && <span className="lchannel-rate-badge">${woodRate}/LF</span>}
            </label>
            {/* CHANGE 4: added "Custom" option to wood size dropdown */}
            <select
              className="mps-select"
              value={bo.woodSize}
              onChange={e => {
                const val = e.target.value;
                set("woodSize", val);
                // toggle isCustomWoodSize flag
                onChange({ ...bo, woodSize: val, isCustomWoodSize: val === "Custom" });
              }}
            >
              {Object.keys(WOOD_BUILDOUT_RATES).map(s => (
                <option key={s} value={s}>{s} — ${WOOD_BUILDOUT_RATES[s]}/LF</option>
              ))}
              {/* CHANGE 4: Custom option */}
              <option value="Custom">Custom</option>
            </select>
          </div>
        )}

        {/* CHANGE 4: Custom wood size inputs */}
        {isWood && isCustomWood && (
          <>
            <Field
              label="Custom Wood Size"
              value={bo.customWoodSizeLabel || ""}
              onChange={v => set("customWoodSizeLabel", v)}
              placeholder='e.g. 3×8, 6×6'
            />
            <Field
              label="Custom Rate ($/LF)"
              type="number"
              value={bo.customWoodRate || ""}
              onChange={v => set("customWoodRate", v)}
              placeholder="e.g. 15"
              min="0"
            />
          </>
        )}

        {/* ── ALUMITUBE path ── */}
        {/* CHANGE 5: replaced radio buttons with a standard dropdown */}
        {!isWood && (
          <div className="mps-field">
            <label className="mps-label">
              Alumitube Size
              {!bo.isCustomAlumitubeSize && <span className="lchannel-rate-badge">${ALUMITUBE_DEFAULT_RATE}/LF</span>}
            </label>
            <select
              className="mps-select"
              value={bo.isCustomAlumitubeSize ? "Custom" : "Standard"}
              onChange={e => set("isCustomAlumitubeSize", e.target.value === "Custom")}
            >
              <option value="Standard">3″ × 8″ — ${ALUMITUBE_DEFAULT_RATE}/LF</option>
              <option value="Custom">Custom Size</option>
            </select>
          </div>
        )}

        {/* Custom alumitube inputs */}
        {!isWood && bo.isCustomAlumitubeSize && (
          <Field
            label="Custom Alumitube Size"
            value={bo.customAlumitubeSize || ""}
            onChange={v => set("customAlumitubeSize", v)}
            placeholder='e.g. 4"×10"'
          />
        )}

        {/* CHANGE 6: Clean "Linear Feet" label for both types */}
        {/* For custom alumitube, show manual price instead of LF */}
        {(!isWood && bo.isCustomAlumitubeSize) ? (
          <Field
            label="Manual Price ($)"
            type="number"
            value={bo.customRate}
            onChange={v => set("customRate", v)}
            placeholder="Enter total price"
            min="0"
          />
        ) : (
          <Field
            label="Linear Feet"
            type="number"
            value={bo.lf}
            onChange={v => set("lf", v)}
            placeholder="e.g. 12"
            min="0"
            step="0.5"
          />
        )}
      </div>

      {/* Cost display */}
      {cost > 0 && (
        <div className="structural-calc">
          {isWood && isCustomWood
            ? <>Custom Wood ({bo.customWoodSizeLabel || "—"}) @ ${bo.customWoodRate || 0}/LF × {bo.lf || 0} LF = <strong>{fmt(cost)}</strong></>
            : isWood
              ? <>{bo.woodSize} @ ${woodRate}/LF × {bo.lf || 0} LF = <strong>{fmt(cost)}</strong></>
              : bo.isCustomAlumitubeSize
                ? <>Alumitube Custom (manual price): <strong>{fmt(cost)}</strong></>
                : <>Alumitube 3″×8″ @ ${ALUMITUBE_DEFAULT_RATE}/LF × {bo.lf || 0} LF = <strong>{fmt(cost)}</strong></>
          }
        </div>
      )}
      <PhotoUpload label="Photo (optional)" value={bo.photo} onChange={v => set("photo", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPENING EDITOR
// CHANGE 2 + 3: "Copy from Previous Opening" buttons for both
//               L-Channels and Buildouts
// ─────────────────────────────────────────────────────────────
function OpeningEditor({ 
  opening, 
  index, 
  areaDefaults, 
  productName, 
  onChange, 
  onRemove, 
  showRemove, 
  allOpenings,
  motorBrandCache // Pass the consistent motor brand for this product group
}) {

  const structural = calcOpeningStructural(opening, areaDefaults);
  const openingPrice = calcOpeningBasePrice(opening, productName);
  const openingTotal = openingPrice + structural;

  const effectiveFabric = (opening.fabricSelection?.brand)
    ? opening.fabricSelection
    : (areaDefaults?.fabricSelection?.brand ? areaDefaults.fabricSelection : null);
  const hasSurcharge = isPremiumFabricSurcharge(effectiveFabric);
  const surchargeAmount = calcPremiumFabricSurcharge(effectiveFabric, opening.width);

  const prevOpening = allOpenings && index > 0 ? allOpenings[index - 1] : null;

  const copyLChannels = () => {
    if (!prevOpening?.lChannels?.length) {
      alert("No L-Channels to copy from the previous opening.");
      return;
    }
    onChange({ ...opening, lChannels: prevOpening.lChannels.map(item => ({ ...item, id: uid() })) });
  };

  const copyBuildouts = () => {
    if (!prevOpening?.buildouts?.length) {
      alert("No Buildouts to copy from the previous opening.");
      return;
    }
    onChange({ ...opening, buildouts: prevOpening.buildouts.map(item => ({ ...item, id: uid() })) });
  };

  const set = (field, val) => onChange({ ...opening, [field]: val });

  const effectiveMount = opening.mountOverride || areaDefaults.mountType || "—";
  const effectiveTrack = opening.trackOverride || areaDefaults.trackType || "—";
  const effectiveMotor = opening.motorOverride || areaDefaults.motorType || "—";
  const effectiveWeightBar = opening.weightBarOverride || areaDefaults.weightBar || "—";
  const effectiveCassette = opening.colorOverride || areaDefaults.cassetteColor || "";
  const effectiveTrackColor = opening.trackColorOverride || areaDefaults.trackColor || "";

  const effectiveFabricLabel = effectiveFabric ? buildFabricLabel(effectiveFabric) : "—";

  const stormRailCost = calcStormRailCost(opening, effectiveTrack);
  const cassIsCustom = effectiveCassette.toLowerCase().includes("custom");
  const trackIsCustom = effectiveTrackColor.toLowerCase().includes("custom");
  const effectiveMotorId = opening.motorId || getDefaultMotorId(productName) || "";
  const motorObj = MOTOR_CATALOG.find(m => m.id === effectiveMotorId);
  const motorAdj = motorObj?.priceAdjustment || 0;

  const showTrackColor = effectiveTrack !== "Wire Guide";

  const addLChannel = () => set("lChannels", [...(opening.lChannels || []), createLChannel()]);
  const updateLChannel = (id, updated) => set("lChannels", (opening.lChannels || []).map(lc => lc.id === id ? updated : lc));
  const removeLChannel = (id) => set("lChannels", (opening.lChannels || []).filter(lc => lc.id !== id));
  const addBuildout = () => set("buildouts", [...(opening.buildouts || []), createBuildout()]);
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

      {hasSurcharge && opening.width && surchargeAmount > 0 && (
        <div className="premium-fabric-surcharge-badge">
          <span className="premium-fabric-surcharge-icon">⚡</span>
          <span>
            Premium fabric surcharge ({effectiveFabric?.series || effectiveFabric?.style_number}):&nbsp;
            {toFeetKey(opening.width)}ft × ${PREMIUM_FABRIC_SURCHARGE_RATE}/LF =&nbsp;
            <strong>{fmt(surchargeAmount)}</strong>
          </span>
        </div>
      )}
      {hasSurcharge && !opening.width && (
        <div className="premium-fabric-surcharge-badge premium-fabric-surcharge-badge--pending">
          <span className="premium-fabric-surcharge-icon">⚡</span>
          <span>Premium fabric surcharge (+${PREMIUM_FABRIC_SURCHARGE_RATE}/LF) — enter width to calculate</span>
        </div>
      )}

      <div className="motor-selector-row">
        <MotorSelector 
          motorId={effectiveMotorId} 
          productName={productName} 
          onChange={v => set("motorId", v)}
          currentOpeningId={opening.id}
          allOpenings={allOpenings}
          currentMotorBrand={motorBrandCache}
        />
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

      <details className="override-details">
        <summary className="override-summary">
          🧵 Fabric Selection
          <span className="override-hint">(Effective: <strong>{effectiveFabricLabel}</strong>)</span>
        </summary>
        <div className="override-resolved-info">Defaults to the Area fabric selection. Set here to override for this opening only.</div>
        <FabricSelector
          fabricSelection={opening.fabricSelection}
          onChange={v => set("fabricSelection", v)}
          label="Opening Fabric Override"
          fabricContext="screen"
        />
      </details>

      <details className="override-details">
        <summary className="override-summary">
          ⚙ Opening Settings
          <span className="override-hint">(Mount: <strong>{effectiveMount}</strong> · Track: <strong>{effectiveTrack}</strong> · Motor: <strong>{effectiveMotor}</strong>)</span>
        </summary>
        <div className="override-resolved-info">These settings default to the Area values above. Change any field here to override for this opening only.</div>
        <div className="override-resolved-grid">

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

          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Motor Type (legacy)
              {opening.motorOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select className={`override-resolved-select ${opening.motorOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.motorOverride || ""} onChange={e => set("motorOverride", e.target.value)}>
              <option value="">
                — area default ({getDefaultMotorDisplayName(productName) || areaDefaults.motorType || "not set"}) —
              </option>
              {MPS_DEFAULTS.motorTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="override-resolved-item">
            <label className="override-resolved-label">
              Cassette Color
              {opening.colorOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                : <span className="override-resolved-source">area default</span>}
            </label>
            <select
              className={`override-resolved-select ${opening.colorOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
              value={opening.colorOverride || ""}
              onChange={e => set("colorOverride", e.target.value)}
            >
              <option value="">— area default ({areaDefaults.cassetteColor || "not set"}) —</option>
              {MPS_DEFAULTS.cassetteColors.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
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

          {showTrackColor && (
            <div className="override-resolved-item">
              <label className="override-resolved-label">
                Track Color
                {opening.trackColorOverride ? <span className="override-resolved-source override-resolved-source--custom">opening override</span>
                  : <span className="override-resolved-source">area default</span>}
              </label>
              <select
                className={`override-resolved-select ${opening.trackColorOverride ? "override-resolved-select--set" : "override-resolved-select--default"}`}
                value={opening.trackColorOverride || ""}
                onChange={e => set("trackColorOverride", e.target.value)}
              >
                <option value="">— area default ({areaDefaults.trackColor || "not set"}) —</option>
                {MPS_DEFAULTS.trackColors.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {trackIsCustom && (
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

          {!showTrackColor && (
            <div className="override-resolved-item">
              <div className="wire-guide-notice">
                <span className="wire-guide-notice-icon">ℹ️</span>
                Track Color is not applicable for <strong>Wire Guide</strong> track type.
              </div>
            </div>
          )}

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

      {/* ── L-CHANNELS ── */}
      <div className="structural-section">
        <div className="structural-section-header">
          <span className="mps-label">L-Channels</span>
          {lChannelTotal > 0 && <span className="structural-section-total">{fmt(lChannelTotal)} total</span>}
          <div className="structural-section-actions">
            <button type="button" className="structural-add-btn" onClick={addLChannel}>
              + Add L-Channel
            </button>
            {prevOpening && (
              <button
                type="button"
                className="structural-copy-btn"
                onClick={copyLChannels}
                title={`Copy ${prevOpening.lChannels?.length || 0} L-Channel(s) from Opening ${index}`}
                disabled={!prevOpening.lChannels?.length}
              >
                ⧉ Copy from Prev Opening
              </button>
            )}
          </div>
        </div>
        {lChannels.length === 0 && (
          <div className="structural-empty">No L-channels added. Click "Add L-Channel" if required.</div>
        )}
        {lChannels.map((lc, idx) => (
          <LChannelItem key={lc.id} lc={lc} index={idx}
            onChange={updated => updateLChannel(lc.id, updated)}
            onRemove={() => removeLChannel(lc.id)} showRemove={true} />
        ))}
      </div>

      {/* ── BUILDOUTS ── */}
      <div className="structural-section">
        <div className="structural-section-header">
          <span className="mps-label">Buildouts</span>
          {buildoutTotal > 0 && <span className="structural-section-total">{fmt(buildoutTotal)} total</span>}
          <div className="structural-section-actions">
            <button type="button" className="structural-add-btn" onClick={addBuildout}>
              + Add Buildout
            </button>
            {prevOpening && (
              <button
                type="button"
                className="structural-copy-btn"
                onClick={copyBuildouts}
                title={`Copy ${prevOpening.buildouts?.length || 0} Buildout(s) from Opening ${index}`}
                disabled={!prevOpening.buildouts?.length}
              >
                ⧉ Copy from Prev Opening
              </button>
            )}
          </div>
        </div>
        {buildouts.length === 0 && (
          <div className="structural-empty">No buildouts added. Click "Add Buildout" if required.</div>
        )}
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
function AreaEditor({ area, areaIndex, productName, onChange, onRemove, showRemove, allAreaOpenings }) {
  const areaBaseTotal = area.openings.reduce((s, o) => s + calcOpeningBasePrice(o, productName), 0);
  const areaStructuralTotal = calcAreaStructuralOnly(area);
  const areaGrandTotal = areaBaseTotal + areaStructuralTotal;
  const setArea = (field, val) => onChange({ ...area, [field]: val });

  // Get consistent motor brand across all openings in this area
  const getConsistentMotorBrand = () => {
    for (const opening of area.openings) {
      if (opening.motorId) {
        return getMotorBrand(opening.motorId);
      }
    }
    return null;
  };
  
  const motorBrandCache = getConsistentMotorBrand();

  const setOpening = useCallback((openingId, updated) => {
    onChange({ ...area, openings: area.openings.map(o => o.id === openingId ? updated : o) });
  }, [area, onChange]);

  const addOpening = () => onChange({ ...area, openings: [...area.openings, createOpening(productName, { motorSide: "Left" })] });
  const removeOpening = (id) => onChange({ ...area, openings: area.openings.filter(o => o.id !== id) });

  const areaEffectiveTrack = area.trackType || "";
  const showAreaTrackColor = areaEffectiveTrack !== "Wire Guide";
  const defaultMotorDisplayName = getDefaultMotorDisplayName(productName);

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

      <details className="override-details">
        <summary className="override-summary">
          ⚙ Area Defaults
          <span className="override-hint">(Mount: <strong>{area.mountType || "not set"}</strong> · Track: <strong>{area.trackType || "not set"}</strong> · Cassette: <strong>{area.cassetteColor || "not set"}</strong>)</span>
        </summary>

        <div className="area-defaults">
          <div className="area-defaults-label">Area Defaults (auto-populated per opening — override per opening below)</div>
          <div className="area-defaults-grid">
            <div className="mps-field">
              <label className="mps-label">Product</label>
              <div className="mps-input mps-input--readonly">{productName}</div>
            </div>
            <Sel label="Mount Type" value={area.mountType} options={MPS_DEFAULTS.mountTypes} onChange={v => setArea("mountType", v)} />
            <Sel label="Track Type" value={area.trackType} options={MPS_DEFAULTS.trackTypes} onChange={v => setArea("trackType", v)} />

            <div className="mps-field">
              <label className="mps-label">Cassette Color</label>
              <select className="mps-select" value={area.cassetteColor || ""} onChange={e => setArea("cassetteColor", e.target.value)}>
                <option value="">Select Cassette Color</option>
                {MPS_DEFAULTS.cassetteColors.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {showAreaTrackColor ? (
              <div className="mps-field">
                <label className="mps-label">Track Color</label>
                <select className="mps-select" value={area.trackColor || ""} onChange={e => setArea("trackColor", e.target.value)}>
                  <option value="">Select Track Color</option>
                  {MPS_DEFAULTS.trackColors.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ) : (
              <div className="mps-field">
                <label className="mps-label">Track Color</label>
                <div className="wire-guide-notice-inline">N/A — Wire Guide selected</div>
              </div>
            )}

            <div className="mps-field">
              <label className="mps-label">Motor Type (Default)</label>
              <div className="mps-input mps-input--readonly">
                {defaultMotorDisplayName || area.motorType || "Somfy (default)"}
                {defaultMotorDisplayName && <span className="motor-badge motor-badge--included" style={{ marginLeft: "8px", fontSize: "0.7em" }}>✓ Included</span>}
              </div>
            </div>

            <Sel label="Weight Bar Color" value={area.weightBar || ""} options={MPS_DEFAULTS.weightBarTypes} onChange={v => setArea("weightBar", v)} placeholder="Select Weight Bar Color" />
          </div>

          <div className="area-fabric-section">
            <div className="area-defaults-label" style={{ marginTop: "12px" }}>Area Default Fabric (openings inherit this unless overridden)</div>
            <FabricSelector
              fabricSelection={area.fabricSelection || { brand: "", style_number: "", color_name: "", series: "" }}
              onChange={v => setArea("fabricSelection", v)}
              label="Area Fabric Default"
              fabricContext="screen"
            />
          </div>

          <PhotoUpload label="Area Photo (wide shot)" value={area.areaPhoto} onChange={v => setArea("areaPhoto", v)} />
        </div>

      </details>

      <div className="openings-container">
        <div className="openings-heading">
          <span>Openings</span>
          <span className="openings-count">{area.openings.length}</span>
          {areaBaseTotal > 0 && <span className="openings-price-total">= {fmt(areaBaseTotal)} product price</span>}
        </div>
        {area.openings.map((opening, idx) => (
          <OpeningEditor 
            key={opening.id} 
            opening={opening} 
            index={idx} 
            areaDefaults={area}
            productName={productName}
            onChange={updated => setOpening(opening.id, updated)}
            onRemove={() => removeOpening(opening.id)}
            showRemove={area.openings.length > 1}
            allOpenings={area.openings}
            motorBrandCache={motorBrandCache}
          />
        ))}
        <button type="button" className="add-opening-btn" onClick={addOpening}>+ Add Opening</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WIND SENSOR SECTION
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
              <span className="wind-sensor-type-badge">
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
// SIGNATURE PAD
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
// FIELD ADDON RENDERER
// ─────────────────────────────────────────────────────────────
function FieldAddonSection({ productName, fieldAddonValues, onFieldAddonChange, lineId }) {
  const fieldAddonDefs = getFieldAddonsForProduct(productName);
  const fieldTotal     = calcFieldAddonTotal(fieldAddonValues, productName);

  if (fieldAddonDefs.length === 0) return null;

  const groupMap = {};
  fieldAddonDefs.forEach(def => { const g = def.group || "Add-ons"; if (!groupMap[g]) groupMap[g] = []; groupMap[g].push(def); });
  const groupOrder = [...new Set(fieldAddonDefs.map(d => d.group || "Add-ons"))];

  return (
    <div className="ps-addons-section field-addons-section">
      <div className="ps-addons-title">
        <span className="ps-addons-icon">◆</span> Optional Accessories
        {fieldTotal > 0 && <span className="ps-addons-running-total">+{fmt(fieldTotal)} selected</span>}
      </div>
      <div className="field-addons-grid">
        {groupOrder.map(groupLabel => (
          <div key={groupLabel} className="field-addon-group">
            <div className="field-addon-group-header">{groupLabel}</div>
            {groupMap[groupLabel].map(def => {
              const val = fieldAddonValues?.[def.id] || {};
              const enabled = !!val.enabled;
              const qtyVal = val.qty || "";
              const customPrice = val.customPrice || "";
              const isCustom = def.pricingType === "custom";
              const lineAmt = enabled ? (isCustom ? (parseFloat(customPrice) || 0) : def.rate * (parseFloat(qtyVal) || 0)) : 0;
              return (
                <div key={def.id} className={`field-addon-row ${enabled ? "field-addon-active" : ""}`}>
                  <label className="field-addon-check-label">
                    <input type="checkbox" className="ps-addon-checkbox" checked={enabled}
                      onChange={() => onFieldAddonChange(lineId, def.id, { ...val, enabled: !enabled })} />
                    <span className="field-addon-name">{def.name}</span>
                  </label>
                  <div className="field-addon-right">
                    {!isCustom && <div className="field-addon-rate">{fmt(def.rate)} / {def.unitShort}</div>}
                    {enabled && (
                      <div className="field-addon-input-wrap">
                        {isCustom ? (
                          <><span className="field-addon-unit-label">$</span>
                            <input type="number" className="field-addon-qty-input" value={customPrice} min="0" step="1" placeholder={def.placeholder}
                              onChange={e => onFieldAddonChange(lineId, def.id, { ...val, enabled: true, customPrice: e.target.value })} />
                            {lineAmt > 0 && <span className="field-addon-line-total">{fmt(lineAmt)}</span>}
                          </>
                        ) : (
                          <><input type="number" className="field-addon-qty-input" value={qtyVal} min="0" step="1" placeholder={def.placeholder}
                              onChange={e => onFieldAddonChange(lineId, def.id, { ...val, enabled: true, qty: e.target.value })} />
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
        ))}
      </div>
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
  controlState, onControlChange,
}) {
  const qty = parseInt(line.quantity, 10) || 1;
  const areas = mpsData[line.id] || [];
  const setAreas = (a) => onMPSChange(line.id, a);
  const addArea = () => setAreas([...areas, createArea(line.product)]);
  const updateArea = (id, u) => setAreas(areas.map(a => a.id === id ? u : a));
  const removeArea = (id) => setAreas(areas.filter(a => a.id !== id));

  const totalOpenings = countTotalOpenings(areas);

  // Get consistent motor brand across ALL openings in this product group
  const getConsistentMotorBrand = () => {
    let foundBrand = null;
    for (const area of areas) {
      for (const opening of area.openings) {
        if (opening.motorId) {
          const brand = getMotorBrand(opening.motorId);
          if (!foundBrand) {
            foundBrand = brand;
          } else if (foundBrand !== brand) {
            // Mixed motors detected - this shouldn't happen due to validation
            console.warn("Mixed motor types detected in product group");
            return null;
          }
        }
      }
    }
    return foundBrand;
  };

  const dominantMotorBrand = getConsistentMotorBrand();
  const dominantMotorId = useMemo(() => {
    for (const area of areas) {
      for (const opening of area.openings) {
        if (opening.motorId) return opening.motorId;
      }
    }
    return getDefaultMotorId(line.product) || "";
  }, [areas, line.product]);

  const controlCost = useMemo(() => {
    const motorBrand = getMotorBrand(dominantMotorId);
    const includedCredit = getIncludedControlCredit(motorBrand, totalOpenings > 0 ? totalOpenings : 1);
    const { includedReplaced = false, replacementControlId = "", additionalControls = [] } = controlState || {};

    let cost = 0;
    if (includedReplaced && replacementControlId) {
      const replacement = CONTROL_CATALOG.find(c => c.id === replacementControlId);
      if (replacement) cost += Math.max(0, replacement.price - includedCredit);
    }
    additionalControls.forEach(ac => {
      const ctrl = CONTROL_CATALOG.find(c => c.id === ac.controlId);
      if (ctrl) cost += ctrl.price * (parseInt(ac.qty, 10) || 1);
    });
    return cost;
  }, [dominantMotorId, totalOpenings, controlState]);

  const selected = addonSelections[line.id] || {};
  const openingsProductTotal = calcMPSOpeningsTotal(areas, line.product);
  const structuralTotal = areas.reduce((s, a) => s + calcAreaStructuralOnly(a), 0);
  const autoRemoteName = getAutoRemote(totalOpenings > 0 ? totalOpenings : 1);
  const simpleAddonTotal = MPS_SIMPLE_ADDONS.reduce((s, a) => selected[a.id] ? s + a.price * qty : s, 0);
  const windTotal = calcWindSensorTotal(windSensorSelections[line.id], totalOpenings);

  const enriched = snapshot.productLines.find(l => l.id === line.id);
  const appBaseTotal = enriched?.pricing?.lineSubtotal || 0;
  const effectiveProductTotal = openingsProductTotal > 0 ? openingsProductTotal : appBaseTotal;
  const grandLineTotal = effectiveProductTotal + structuralTotal + simpleAddonTotal + windTotal + controlCost;

  const hasUnpriced = areas.some(a =>
    a.openings.some(o => (o.width || o.height) && !getMPSOpeningPrice(line.product, o.width, o.height).ok)
  );

  const handleReset = () => {
    if (window.confirm("Reset all areas, openings, and add-ons for this product? This cannot be undone.")) {
      onMPSChange(line.id, []);
      onAddonToggle(line.id, "__RESET__");
      onWindSensorChange(line.id, {});
      onControlChange({ includedReplaced: false, replacementControlId: "", additionalControls: [] });
    }
  };

  const defaultMotorId = getDefaultMotorId(line.product);
  const defaultMotor = MOTOR_CATALOG.find(m => m.id === defaultMotorId);

  // Show warning if mixed motors detected
  const hasMixedMotors = dominantMotorBrand === null && areas.length > 0;

  return (
    <div className="ps-product-card mps-product-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">{line.product}</div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>

      {hasMixedMotors && (
        <div className="motor-mix-warning" style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          color: "#856404"
        }}>
          <span style={{ fontSize: "20px", marginRight: "8px" }}>⚠️</span>
          <strong>Mixed motor types detected!</strong> All openings in a product group must use the same motor type.
          Please update motors to be consistent or create separate product groups.
        </div>
      )}

      <div className="quote-tool-controls">
        <span className="quote-tool-controls-label">🛠 Quote Tool Controls</span>
        <button type="button" className="ctrl-btn ctrl-btn-reset" onClick={handleReset}>↺ Reset Quote Tool</button>
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
          { label: "Product Name", value: line.product },
          { label: "Category", value: line.category },
          { label: "Base Size", value: `${line.width || "—"} × ${line.height || "—"}` },
          { label: "Quantity", value: line.quantity },
          { label: "Operation", value: line.operation, capitalize: true }
        ].map(({ label, value, capitalize }) => (
          <div className="ps-detail-item" key={label}>
            <span className="ps-detail-label">{label}</span>
            <span className="ps-detail-value" style={capitalize ? { textTransform: "capitalize" } : {}}>{value}</span>
          </div>
        ))}
      </div>

      <div className="product-note-section">
        <label className="mps-label">📝 Product Notes</label>
        <textarea className="product-note-textarea"
          placeholder="Add any important notes about this product…"
          value={productNotes || ""} onChange={e => onProductNoteChange(line.id, e.target.value)} rows={3} />
      </div>

      {enriched?.pricing?.priceNote && (
        <div className="ps-price-note">💡 Reference (from intake form): {enriched.pricing.priceNote}</div>
      )}
      {hasUnpriced && (
        <div className="ps-price-note ps-price-note--warn">⚠ Some openings have dimensions that don't match the price matrix.</div>
      )}

      {totalOpenings > 0 && dominantMotorBrand && (
        <div className="auto-remote-badge">
          <span className="auto-remote-icon">🎛</span>
          <span className="auto-remote-text">
            Recommended Remote: <strong>{autoRemoteName}</strong> ({totalOpenings} opening{totalOpenings !== 1 ? "s" : ""}) — <em>included, no extra charge</em>
            <span className="motor-brand-indicator" style={{ marginLeft: "12px", fontSize: "0.85em", opacity: 0.7 }}>
              ({dominantMotorBrand} motor system)
            </span>
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
            {openingsProductTotal > 0 && (
              <div className="mps-structural-total mps-product-from-openings">
                Openings product total: <strong>{fmt(openingsProductTotal)}</strong>
              </div>
            )}
            {structuralTotal > 0 && (
              <div className="mps-structural-total">Structural: <strong>{fmt(structuralTotal)}</strong></div>
            )}
          </div>
        </div>
        {areas.length === 0
          ? <div className="mps-empty-state"><p>No areas configured yet. Add an area to specify openings.</p></div>
          : areas.map((area, idx) => (
            <AreaEditor key={area.id} area={area} areaIndex={idx} productName={line.product}
              onChange={u => updateArea(area.id, u)}
              onRemove={() => removeArea(area.id)}
              showRemove={areas.length > 1}
              allAreaOpenings={area.openings}
            />
          ))
        }
        <button type="button" className="add-area-btn" onClick={addArea}>+ Add Area</button>
      </div>

      <WindSensorSection
        productName={line.product}
        windSensorSelections={windSensorSelections[line.id] || {}}
        onWindSensorChange={(updated) => onWindSensorChange(line.id, updated)}
        totalOpenings={totalOpenings}
      />

      {/* Controls Section - only show if we have a consistent motor brand */}
      {dominantMotorBrand && (
        <MPSControlSection
          productName={line.product}
          motorId={dominantMotorId}
          totalOpenings={totalOpenings > 0 ? totalOpenings : 1}
          controlState={controlState || { includedReplaced: false, replacementControlId: "", additionalControls: [] }}
          onControlChange={onControlChange}
        />
      )}

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
                <input type="checkbox" className="ps-addon-checkbox" checked={isChecked}
                  onChange={() => onAddonToggle(line.id, addon.id)} />
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

      <div className="mps-line-total">
        {openingsProductTotal > 0
          ? <span>Openings Price: {fmt(openingsProductTotal)}</span>
          : <span>Base Price (from form): {fmt(appBaseTotal)}</span>
        }
        {simpleAddonTotal > 0 && <span>+ Add-ons: {fmt(simpleAddonTotal)}</span>}
        {windTotal > 0 && <span>+ Wind Sensor(s): {fmt(windTotal)}</span>}
        {controlCost > 0 && <span>+ Controls: {fmt(controlCost)}</span>}
        {structuralTotal > 0 && <span>+ Structural: {fmt(structuralTotal)}</span>}
        {totalOpenings > 0 && (
          <span className="mps-remote-info-line">Remote included: {autoRemoteName}</span>
        )}
        <span className="mps-line-grand">Line Total: {fmt(grandLineTotal)}</span>
      </div>
    </div>
  );
}

function MPSControlSection({ productName, motorId, totalOpenings, controlState, onControlChange }) {
  const motorBrand = getMotorBrand(motorId);
  const includedControlId = getIncludedControlId(motorBrand, totalOpenings);
  const includedControl = CONTROL_CATALOG.find(c => c.id === includedControlId);
  const includedCredit = getIncludedControlCredit(motorBrand, totalOpenings);
  const availableControls = getAvailableControls(motorBrand);

  const { includedReplaced, replacementControlId, additionalControls = [] } = controlState;

  const replacementControl = CONTROL_CATALOG.find(c => c.id === replacementControlId);

  const setField = (field, val) => onControlChange({ ...controlState, [field]: val });

  const addAdditionalControl = () => {
    onControlChange({
      ...controlState,
      additionalControls: [...additionalControls, { id: uid(), controlId: "", qty: 1 }],
    });
  };

  const updateAdditionalControl = (itemId, updates) => {
    onControlChange({
      ...controlState,
      additionalControls: additionalControls.map(ac =>
        ac.id === itemId ? { ...ac, ...updates } : ac
      ),
    });
  };

  const removeAdditionalControl = (itemId) => {
    onControlChange({
      ...controlState,
      additionalControls: additionalControls.filter(ac => ac.id !== itemId),
    });
  };

  // Cost calculation
  const replacementCost = includedReplaced && replacementControl
    ? Math.max(0, replacementControl.price - includedCredit)
    : 0;

  const additionalCost = additionalControls.reduce((sum, ac) => {
    const ctrl = CONTROL_CATALOG.find(c => c.id === ac.controlId);
    return sum + (ctrl ? ctrl.price * (parseInt(ac.qty, 10) || 1) : 0);
  }, 0);

  const totalControlCost = (includedReplaced ? replacementCost : 0) + additionalCost;

  // Filter out wall switches for Dooya motors
  const filteredControls = availableControls.filter(ctrl => {
    if (motorBrand === "Dooya" && ctrl.type === "wall_switch") return false;
    return true;
  });

  return (
    <div className="mps-control-section">
      <div className="mps-control-section-title">
        <span className="ps-addons-icon">🎛</span> Controls
        {totalControlCost > 0 && (
          <span className="ps-addons-running-total">+{fmt(totalControlCost)}</span>
        )}
        <span className="motor-brand-badge" style={{ marginLeft: "12px", fontSize: "0.8em", opacity: 0.7 }}>
          ({motorBrand} system)
        </span>
      </div>

      {/* Included Control Banner */}
      <div className="mps-included-control-banner">
        <span className="mps-included-icon">✅</span>
        <div>
          <strong>Included: </strong>{includedControl?.name || "—"}
          <span className="mps-included-hint"> (auto-assigned for {totalOpenings} opening{totalOpenings !== 1 ? "s" : ""})</span>
        </div>
      </div>

      {/* Replace Included Control Toggle */}
      <Toggle
        label="Replace included control?"
        checked={includedReplaced}
        onChange={(val) => setField("includedReplaced", val)}
      />

      {includedReplaced && (
        <div className="mps-replacement-control">
          <div className="mps-field">
            <label className="mps-label">Replacement Control</label>
            <select
              className="mps-select"
              value={replacementControlId}
              onChange={e => setField("replacementControlId", e.target.value)}
            >
              <option value="">— Select replacement —</option>
              {filteredControls.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {fmt(c.price)}
                </option>
              ))}
            </select>
          </div>
          {replacementControl && (
            <div className="mps-control-credit-info">
              <span>{replacementControl.name}: {fmt(replacementControl.price)}</span>
              <span className="mps-credit-badge">− {fmt(includedCredit)} credit (included control value)</span>
              <strong>Net cost: {fmt(replacementCost)}</strong>
            </div>
          )}
        </div>
      )}

      {/* Additional Controls */}
      <div className="mps-additional-controls">
        <div className="mps-additional-controls-header">
          <span className="mps-label">Additional Controls</span>
          <button type="button" className="structural-add-btn" onClick={addAdditionalControl}>
            + Add Control
          </button>
        </div>
        {additionalControls.length === 0 && (
          <div className="structural-empty">No additional controls added.</div>
        )}
        {additionalControls.map((ac) => {
          const ctrl = CONTROL_CATALOG.find(c => c.id === ac.controlId);
          const lineTotal = ctrl ? ctrl.price * (parseInt(ac.qty, 10) || 1) : 0;
          return (
            <div key={ac.id} className="structural-item-card">
              <div className="structural-item-header">
                <span>Additional Control</span>
                <button type="button" className="structural-item-remove"
                  onClick={() => removeAdditionalControl(ac.id)}>✕ Remove</button>
              </div>
              <div className="structural-fields-grid">
                <div className="mps-field">
                  <label className="mps-label">Control</label>
                  <select className="mps-select" value={ac.controlId}
                    onChange={e => updateAdditionalControl(ac.id, { controlId: e.target.value })}>
                    <option value="">— Select control —</option>
                    {filteredControls.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {fmt(c.price)}</option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Quantity"
                  type="number"
                  value={String(ac.qty)}
                  onChange={v => updateAdditionalControl(ac.id, { qty: parseInt(v, 10) || 1 })}
                  min="1"
                  placeholder="1"
                />
              </div>
              {lineTotal > 0 && (
                <div className="structural-calc">
                  {ctrl?.name} × {ac.qty} = <strong>{fmt(lineTotal)}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// GENERIC MRA CARD (Skyline + Open Roll)
// ─────────────────────────────────────────────────────────────
function GenericMRACard({
  line, index, snapshot,
  mraConfig, onMRAConfigChange,
  fieldAddonValues, onFieldAddonChange,
  productNotes, onProductNoteChange,
  totalAwningQty,
}) {
  const cfg = mraConfig[line.id] || createMRAConfig();
  const setConfig = (updates) => onMRAConfigChange(line.id, { ...cfg, ...updates });

  const qty = parseInt(line.quantity, 10) || 1;

  const totalWidthFt = (parseInt(cfg.widthFt, 10) || 0) + ((parseInt(cfg.widthIn, 10) || 0) / 12);
  const widthFtKey   = totalWidthFt > 0 ? Math.ceil(totalWidthFt) : null;

  const priceResult  = widthFtKey && cfg.projection
    ? getMRAPrice(line.product, cfg.projection, widthFtKey)
    : { ok: false, price: 0, message: "" };
  const unitPrice    = priceResult.ok ? priceResult.price : 0;
  const matrixTotal  = unitPrice * qty;

  const fieldTotal     = calcFieldAddonTotal(fieldAddonValues, line.product);
  const grandLineTotal = matrixTotal + fieldTotal;

  const matrixRef = line.product === "Skyline Motorized Retractable Awning"
    ? SKYLINE_MRA_PRICE_DATA
    : OPEN_ROLL_MRA_PRICE_DATA;
  const sampleRow    = cfg.projection ? matrixRef[cfg.projection] : null;
  const validWidths  = sampleRow ? Object.keys(sampleRow).map(Number).sort((a,b)=>a-b) : [];

  const isSkylightType = line.product === "Skyline Motorized Retractable Awning";
  const badgeLabel     = isSkylightType ? "Motor A + B Merged" : "Open Roll";

  return (
    <div className="ps-product-card skylight-mra-card">
      <div className="ps-product-header">
        <div className="ps-product-number">#{index + 1}</div>
        <div className="ps-product-name">
          {line.product}
          <span className="skylight-mra-badge">{badgeLabel}</span>
        </div>
        <div className="ps-product-price">{fmt(grandLineTotal)}</div>
      </div>

      <div className="ps-detail-grid">
        <div className="ps-detail-item"><span className="ps-detail-label">Product</span><span className="ps-detail-value">{line.product}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Category</span><span className="ps-detail-value">{line.category}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Quantity</span><span className="ps-detail-value">{qty}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Operation</span><span className="ps-detail-value" style={{textTransform:"capitalize"}}>{line.operation}</span></div>
      </div>

      <div className="skylight-config-section">
        <div className="skylight-config-title">📐 Awning Configuration</div>
        <div className="skylight-config-grid">
          <div className="mps-field">
            <label className="mps-label">Projection <span className="mps-req">*</span></label>
            <select className="mps-select skylight-projection-select" value={cfg.projection} onChange={e => setConfig({ projection: e.target.value })}>
              <option value="">Select Projection</option>
              {MRA_PROJECTION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {cfg.projection && (
              <div className="skylight-projection-note">
                ✓ Projection locked to <strong>{cfg.projection}</strong>
                {validWidths.length > 0 && ` — Valid widths: ${validWidths[0]}–${validWidths[validWidths.length-1]}ft`}
              </div>
            )}
          </div>

          <div className="mps-field skylight-width-field">
            <label className="mps-label">Width <span className="mps-req">*</span></label>
            <div className="skylight-width-inputs">
              <div className="skylight-width-input-wrap">
                <input className="mps-input skylight-dim-input" type="number" value={cfg.widthFt}
                  onChange={e => setConfig({ widthFt: e.target.value })} placeholder="0" min="0" />
                <span className="skylight-dim-unit">ft</span>
              </div>
              <div className="skylight-width-input-wrap">
                <input className="mps-input skylight-dim-input" type="number" value={cfg.widthIn}
                  onChange={e => setConfig({ widthIn: e.target.value })} placeholder="0" min="0" max="11" />
                <span className="skylight-dim-unit">in</span>
              </div>
            </div>
            {(cfg.widthFt || cfg.widthIn) && (
              <div className="skylight-width-display">
                Width: <strong>{cfg.widthFt || 0}' {cfg.widthIn || 0}"</strong>
                {widthFtKey && <span style={{marginLeft:"6px",color:"var(--ps-text-muted,#888)"}}>(→ {widthFtKey}ft bracket)</span>}
              </div>
            )}
          </div>
        </div>

        {cfg.projection && widthFtKey && (
          <div className={`opening-price-badge ${priceResult.ok ? "opening-price-badge--ok" : "opening-price-badge--error"}`}>
            {priceResult.ok
              ? <><span className="opening-price-badge__label">Unit price:</span> <span className="opening-price-badge__value">{fmt(unitPrice)}</span>{qty > 1 && <span className="opening-price-badge__hint"> × {qty} = <strong>{fmt(matrixTotal)}</strong></span>}</>
              : <span>⚠ {priceResult.message}</span>
            }
          </div>
        )}

        <div className="skylight-fabric-section">
          <div className="skylight-config-title" style={{marginTop:"16px"}}>🧵 Fabric Selection</div>
          <SkylightFabricSelector
            fabricBrand={cfg.fabricBrand}
            style_number={cfg.style_number}
            color_name={cfg.color_name}
            onChange={({ fabricBrand, style_number, color_name }) =>
              setConfig({ fabricBrand, style_number, color_name })
            }
          />
        </div>
      </div>

      <div className="product-note-section">
        <label className="mps-label">📝 Product Notes</label>
        <textarea className="product-note-textarea"
          placeholder="Add any important notes about this awning…"
          value={productNotes || ""} onChange={e => onProductNoteChange(line.id, e.target.value)} rows={3} />
      </div>

      <FieldAddonSection
        productName={line.product}
        fieldAddonValues={fieldAddonValues}
        onFieldAddonChange={onFieldAddonChange}
        lineId={line.id}
      />

      <div className="mps-line-total">
        {priceResult.ok
          ? <span>Matrix Price: {fmt(unitPrice)}{qty > 1 ? ` × ${qty} = ${fmt(matrixTotal)}` : ""}</span>
          : <span style={{color:"var(--ps-warn,#e67e22)"}}>⚠ Enter projection &amp; width to calculate price</span>
        }
        {fieldTotal > 0 && <span>+ Accessories: {fmt(fieldTotal)}</span>}
        <span className="mps-line-grand">Line Total: {fmt(grandLineTotal)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SKYLIGHT PLUS MRA CARD
// ─────────────────────────────────────────────────────────────
function SkylightMRACard({
  line, index, snapshot,
  mraConfig, onMRAConfigChange,
  fieldAddonValues, onFieldAddonChange,
  productNotes, onProductNoteChange,
  totalAwningQty,
}) {
  const cfg = mraConfig[line.id] || createMRAConfig();
  const setConfig = (updates) => onMRAConfigChange(line.id, { ...cfg, ...updates });

  const qty = parseInt(line.quantity, 10) || 1;
  const autoTransmitter = getAutoTransmitter(totalAwningQty);

  const totalWidthFt = (parseInt(cfg.widthFt, 10) || 0) + ((parseInt(cfg.widthIn, 10) || 0) / 12);
  const widthFtKey   = totalWidthFt > 0 ? Math.ceil(totalWidthFt) : null;
  const priceResult  = widthFtKey && cfg.projection
    ? getMRAPrice("Skylight Plus MRA", cfg.projection, widthFtKey)
    : { ok: false, price: 0, message: "" };
  const unitPrice    = priceResult.ok ? priceResult.price : 0;
  const matrixTotal  = unitPrice * qty;

  const sampleRow   = cfg.projection ? SKYLIGHT_MRA_PRICE_DATA[cfg.projection] : null;
  const validWidths = sampleRow ? Object.keys(sampleRow).map(Number).sort((a,b)=>a-b) : [];

  const fieldTotal     = calcFieldAddonTotal(fieldAddonValues, "Skylight Plus MRA");
  const grandLineTotal = matrixTotal + fieldTotal;

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
                {totalAwningQty <= 2 ? " (1–2 units → 5-channel)" : " (3+ units → 16-channel)"}
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

      <div className="ps-detail-grid">
        <div className="ps-detail-item"><span className="ps-detail-label">Product</span><span className="ps-detail-value">Skylight Plus MRA</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Category</span><span className="ps-detail-value">{line.category}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Quantity</span><span className="ps-detail-value">{line.quantity}</span></div>
        <div className="ps-detail-item"><span className="ps-detail-label">Operation</span><span className="ps-detail-value" style={{textTransform:"capitalize"}}>{line.operation}</span></div>
      </div>

      <div className="skylight-config-section">
        <div className="skylight-config-title">📐 Awning Configuration</div>
        <div className="skylight-config-grid">
          <div className="mps-field">
            <label className="mps-label">Projection <span className="mps-req">*</span></label>
            <select className="mps-select skylight-projection-select" value={cfg.projection} onChange={e => setConfig({ projection: e.target.value })}>
              <option value="">Select Projection</option>
              {MRA_PROJECTION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {cfg.projection && (
              <div className="skylight-projection-note">
                ✓ Projection locked to <strong>{cfg.projection}</strong>
                {validWidths.length > 0 && ` — Valid widths: ${validWidths[0]}–${validWidths[validWidths.length-1]}ft`}
              </div>
            )}
          </div>

          <div className="mps-field skylight-width-field">
            <label className="mps-label">Width <span className="mps-req">*</span></label>
            <div className="skylight-width-inputs">
              <div className="skylight-width-input-wrap">
                <input className="mps-input skylight-dim-input" type="number" value={cfg.widthFt}
                  onChange={e => setConfig({ widthFt: e.target.value })} placeholder="0" min="0" />
                <span className="skylight-dim-unit">ft</span>
              </div>
              <div className="skylight-width-input-wrap">
                <input className="mps-input skylight-dim-input" type="number" value={cfg.widthIn}
                  onChange={e => setConfig({ widthIn: e.target.value })} placeholder="0" min="0" max="11" />
                <span className="skylight-dim-unit">in</span>
              </div>
            </div>
            {(cfg.widthFt || cfg.widthIn) && (
              <div className="skylight-width-display">
                Width: <strong>{cfg.widthFt || 0}' {cfg.widthIn || 0}"</strong>
                {widthFtKey && <span style={{marginLeft:"6px",color:"var(--ps-text-muted,#888)"}}>(→ {widthFtKey}ft bracket)</span>}
              </div>
            )}
          </div>
        </div>

        {cfg.projection && widthFtKey && (
          <div className={`opening-price-badge ${priceResult.ok ? "opening-price-badge--ok" : "opening-price-badge--error"}`}>
            {priceResult.ok
              ? <><span className="opening-price-badge__label">Unit price:</span> <span className="opening-price-badge__value">{fmt(unitPrice)}</span>{qty > 1 && <span className="opening-price-badge__hint"> × {qty} = <strong>{fmt(matrixTotal)}</strong></span>}</>
              : <span>⚠ {priceResult.message}</span>
            }
          </div>
        )}

        <div className="skylight-fabric-section">
          <div className="skylight-config-title" style={{marginTop:"16px"}}>🧵 Fabric Selection</div>
          <SkylightFabricSelector
            fabricBrand={cfg.fabricBrand}
            style_number={cfg.style_number}
            color_name={cfg.color_name}
            onChange={({ fabricBrand, style_number, color_name }) =>
              setConfig({ fabricBrand, style_number, color_name })
            }
          />
        </div>
      </div>

      <div className="product-note-section">
        <label className="mps-label">📝 Product Notes</label>
        <textarea className="product-note-textarea"
          placeholder="Add any important notes about this awning…"
          value={productNotes || ""} onChange={e => onProductNoteChange(line.id, e.target.value)} rows={3} />
      </div>

      <FieldAddonSection
        productName="Skylight Plus MRA"
        fieldAddonValues={fieldAddonValues}
        onFieldAddonChange={onFieldAddonChange}
        lineId={line.id}
      />

      <div className="mps-line-total">
        {priceResult.ok
          ? <span>Matrix Price: {fmt(unitPrice)}{qty > 1 ? ` × ${qty} = ${fmt(matrixTotal)}` : ""}</span>
          : <span style={{color:"var(--ps-warn,#e67e22)"}}>⚠ Enter projection &amp; width to calculate price</span>
        }
        {fieldTotal > 0 && <span>+ Accessories: {fmt(fieldTotal)}</span>}
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

      <FieldAddonSection
        productName={line.product}
        fieldAddonValues={fieldAddonValues}
        onFieldAddonChange={onFieldAddonChange}
        lineId={line.id}
      />

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

  const [addonSelections,      setAddonSelections]      = useState(() => loadFromSession()?.addonSelections      || {});
  const [mpsData,              setMpsData]              = useState(() => loadFromSession()?.mpsData              || {});
  const [fieldAddonValues,     setFieldAddonValues]     = useState(() => loadFromSession()?.fieldAddonValues     || {});
  const [productNotes,         setProductNotes]         = useState(() => loadFromSession()?.productNotes         || {});
  const [signature,            setSignature]            = useState(() => loadFromSession()?.signature            || null);
  const [windSensorSelections, setWindSensorSelections] = useState(() => loadFromSession()?.windSensorSelections || {});
  const [mraConfig,            setMraConfig]            = useState(() => loadFromSession()?.mraConfig            || {});
  const [mpsControls, setMpsControls] = useState(() => loadFromSession()?.mpsControls || {});

  useEffect(() => {
    saveToSession({ addonSelections, mpsData, fieldAddonValues, productNotes, signature, windSensorSelections, mraConfig, mpsControls });
  }, [addonSelections, mpsData, fieldAddonValues, productNotes, signature, windSensorSelections, mraConfig]);

  const handleProductNoteChange = (lineId, note) => setProductNotes(prev => ({ ...prev, [lineId]: note }));

  const handleFieldAddonChange = (lineId, addonId, val) =>
    setFieldAddonValues(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), [addonId]: val}}));

  const handleMpsControlsChange = (lineId, updated) =>
  setMpsControls(prev => ({ ...prev, [lineId]: updated }));

  const handleAddonToggle = (lineId, addonId) => {
    if (addonId === "__RESET__") { setAddonSelections(prev => ({ ...prev, [lineId]: {} })); return; }
    setAddonSelections(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), [addonId]: !(prev[lineId]?.[addonId])}}));
  };

  const handleMPSChange = (lineId, areas) => setMpsData(prev => ({...prev, [lineId]: areas}));
  const handleWindSensorChange = (lineId, selections) => setWindSensorSelections(prev => ({ ...prev, [lineId]: selections }));
  const handleMRAConfigChange  = (lineId, cfg) => setMraConfig(prev => ({ ...prev, [lineId]: cfg }));

  const handleGlobalReset = () => {
    if (window.confirm("Reset ALL areas, openings, add-ons, and notes for the entire quote? This cannot be undone.")) {
      setAddonSelections({});
      setMpsData({});
      setFieldAddonValues({});
      setProductNotes({});
      setSignature(null);
      setWindSensorSelections({});
      setMraConfig({});
      setMpsControls({});
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

  const totalAwningQty = configuredLines
    .filter(l => AWNING_PRODUCTS.includes(l.product))
    .reduce((sum, l) => sum + (parseInt(l.quantity, 10) || 1), 0);

  const { subtotalWithAddons, summaryAddonGrandTotal, mpsStructuralGrand, mpsOpeningsProductGrand, windSensorGrand, mraMatrixGrand, controlsGrand } = useMemo(() => {
    if (!snapshot) return { subtotalWithAddons:0, summaryAddonGrandTotal:0, mpsStructuralGrand:0, mpsOpeningsProductGrand:0, windSensorGrand:0, mraMatrixGrand:0, controlsGrand:0 };
    const configured = snapshot.productLines.filter(l => l.category && l.product);

    let addonGrand=0, structuralGrand=0, openingsGrand=0, appBaseMPSGrand=0, windGrand=0, mraGrand=0, ctrlGrand=0;

    configured.forEach(line => {
      if (MPS_PRODUCTS.includes(line.product)) {
        const areas = mpsData[line.id] || [];
        const openingsTotal = calcMPSOpeningsTotal(areas, line.product);
        structuralGrand += areas.reduce((s,a) => s + calcAreaStructuralOnly(a), 0);
        const qty = parseInt(line.quantity,10)||1;
        const sel = addonSelections[line.id]||{};
        MPS_SIMPLE_ADDONS.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        const totalOpenings = countTotalOpenings(areas);
        windGrand += calcWindSensorTotal(windSensorSelections[line.id], totalOpenings);

        // Control cost
        const lineControlState = mpsControls[line.id] || {};
        let dominantMotorId = "";
        for (const area of areas) {
          for (const opening of area.openings) {
            if (opening.motorId) { dominantMotorId = opening.motorId; break; }
          }
          if (dominantMotorId) break;
        }
        if (!dominantMotorId) dominantMotorId = getDefaultMotorId(line.product) || "";
        const motorBrand = getMotorBrand(dominantMotorId);
        const includedCredit = getIncludedControlCredit(motorBrand, totalOpenings > 0 ? totalOpenings : 1);
        const { includedReplaced=false, replacementControlId="", additionalControls=[] } = lineControlState;
        if (includedReplaced && replacementControlId) {
          const rep = CONTROL_CATALOG.find(c => c.id === replacementControlId);
          if (rep) ctrlGrand += Math.max(0, rep.price - includedCredit);
        }
        additionalControls.forEach(ac => {
          const ctrl = CONTROL_CATALOG.find(c => c.id === ac.controlId);
          if (ctrl) ctrlGrand += ctrl.price * (parseInt(ac.qty,10)||1);
        });

        if (openingsTotal > 0) openingsGrand += openingsTotal;
        else { const e = snapshot.productLines.find(l2=>l2.id===line.id); appBaseMPSGrand += e?.pricing?.lineSubtotal||0; }

      } else if (AWNING_PRODUCTS.includes(line.product)) {
        const cfg = mraConfig[line.id] || {};
        const qty = parseInt(line.quantity,10)||1;
        const totalWidthFt = (parseInt(cfg.widthFt,10)||0) + ((parseInt(cfg.widthIn,10)||0)/12);
        const widthFtKey = totalWidthFt > 0 ? Math.ceil(totalWidthFt) : null;
        if (widthFtKey && cfg.projection) {
          const pr = getMRAPrice(line.product, cfg.projection, widthFtKey);
          if (pr.ok) mraGrand += pr.price * qty;
        }
        mraGrand += calcFieldAddonTotal(fieldAddonValues[line.id], line.product);
      } else {
        const qty = parseInt(line.quantity,10)||1;
        const addons = getAddonsForProduct(line.product);
        const sel = addonSelections[line.id]||{};
        addons.forEach(a => { if(sel[a.id]) addonGrand += a.price*qty; });
        addonGrand += calcFieldAddonTotal(fieldAddonValues[line.id], line.product);
      }
    });

    const nonMPSNonMRAOriginal = (snapshot.pricingSummary?.subtotal||0) -
      snapshot.productLines
        .filter(l => l.category && l.product && (MPS_PRODUCTS.includes(l.product) || AWNING_PRODUCTS.includes(l.product)))
        .reduce((s,l)=>{ const e=snapshot.productLines.find(l2=>l2.id===l.id); return s+(e?.pricing?.lineSubtotal||0); }, 0);

    return {
      summaryAddonGrandTotal:  addonGrand,
      mpsStructuralGrand:      structuralGrand,
      mpsOpeningsProductGrand: openingsGrand,
      windSensorGrand:         windGrand,
      mraMatrixGrand:          mraGrand,
      controlsGrand:           ctrlGrand,
      subtotalWithAddons: nonMPSNonMRAOriginal + openingsGrand + appBaseMPSGrand + addonGrand + structuralGrand + windGrand + mraGrand + ctrlGrand,
    };
  }, [snapshot, addonSelections, mpsData, fieldAddonValues, windSensorSelections, mraConfig, mpsControls]);

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
            <button className="ps-btn ctrl-btn-reset ctrl-btn-global-reset" onClick={handleGlobalReset}>
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
                const isSkylightMRA = line.product === "Skylight Plus MRA" || line.product === "Motor B Retractable Awning";
                const isGenericMRA  = line.product === "Skyline Motorized Retractable Awning" ||
                                      line.product === "Open Roll Motorized Retractable Awning";

                if (isSkylightMRA) {
                  return (
                    <SkylightMRACard
                      key={line.id}
                      line={{ ...line, product: "Skylight Plus MRA" }}
                      index={idx}
                      snapshot={snapshot}
                      mraConfig={mraConfig}
                      onMRAConfigChange={handleMRAConfigChange}
                      fieldAddonValues={fieldAddonValues[line.id] || {}}
                      onFieldAddonChange={handleFieldAddonChange}
                      productNotes={productNotes[line.id]}
                      onProductNoteChange={handleProductNoteChange}
                      totalAwningQty={totalAwningQty}
                    />
                  );
                }

                if (isGenericMRA) {
                  return (
                    <GenericMRACard
                      key={line.id}
                      line={line}
                      index={idx}
                      snapshot={snapshot}
                      mraConfig={mraConfig}
                      onMRAConfigChange={handleMRAConfigChange}
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
  controlState={mpsControls[line.id] || { includedReplaced: false, replacementControlId: "", additionalControls: [] }}
  onControlChange={(updated) => handleMpsControlsChange(line.id, updated)}
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
            {mraMatrixGrand          > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Awning Matrix Pricing</span><span className="ps-addon-highlight">{fmt(mraMatrixGrand)}</span></div>}
            {summaryAddonGrandTotal  > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Selected Add-ons</span><span className="ps-addon-highlight">+{fmt(summaryAddonGrandTotal)}</span></div>}
            {windSensorGrand         > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Wind Sensor(s)</span><span className="ps-addon-highlight">+{fmt(windSensorGrand)}</span></div>}
            {mpsStructuralGrand      > 0 && <div className="ps-pricing-row ps-addon-total-row"><span>Structural Adjustments (L-Channel / Buildout / Storm Rail / Custom Color / Premium Fabric)</span><span className="ps-addon-highlight">+{fmt(mpsStructuralGrand)}</span></div>}
            {controlsGrand           > 0 && ( <div className="ps-pricing-row ps-addon-total-row"><span>Controls</span> <span className="ps-addon-highlight">+{fmt(controlsGrand)}</span></div>)}
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