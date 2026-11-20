// Statistical microdata simulation engine.
// All figures are computed in-browser from the seeded survey rows so the
// governance telemetry reacts live to every control a trainee touches.

const DATASETS = {
  plfs: {
    id: 'plfs',
    name: 'PLFS 80th Round · Urban Stratum',
    code: 'NSSO/PD/80/URB-S1',
    unit: '₹ / month',
    projectedPopulation: 18640,
    description:
      'Usual status monthly earnings from the 80th Round Periodic Labour Force Survey, urban stratum S1. Deliberate non-sampling errors are injected for training: two extreme earners, three missing responses and one skewed field weight.',
    rows: [
      { id: 'U-1104', stratum: 'S1', occupation: 'Retail trade', earnings: 24800, hours: 48, weight: 132, gstn: 62000, gvf: 24100, nonResponse: false },
      { id: 'U-1107', stratum: 'S1', occupation: 'Construction', earnings: 21400, hours: 52, weight: 128, gstn: 54000, gvf: 22100, nonResponse: false },
      { id: 'U-1112', stratum: 'S2', occupation: 'Domestic service', earnings: 15600, hours: 44, weight: 141, gstn: 38000, gvf: 16200, nonResponse: false },
      { id: 'U-1119', stratum: 'S2', occupation: 'Street vendor', earnings: 12900, hours: 56, weight: 156, gstn: 31000, gvf: 13400, nonResponse: false },
      { id: 'U-1123', stratum: 'S1', occupation: 'Manufacturing', earnings: 27600, hours: 48, weight: 124, gstn: 71000, gvf: 26800, nonResponse: false },
      { id: 'U-1128', stratum: 'S3', occupation: 'IT services', earnings: 96500, hours: 50, weight: 119, gstn: 245000, gvf: 71200, nonResponse: false },
      { id: 'U-1131', stratum: 'S3', occupation: 'Finance', earnings: 88200, hours: 52, weight: 121, gstn: 218000, gvf: 68900, nonResponse: false },
      { id: 'U-1136', stratum: 'S2', occupation: 'Catering', earnings: null, hours: 46, weight: 148, gstn: 42000, gvf: 17100, nonResponse: true },
      { id: 'U-1140', stratum: 'S1', occupation: 'Transport', earnings: 23800, hours: 60, weight: 134, gstn: 59000, gvf: 23600, nonResponse: false },
      { id: 'U-1145', stratum: 'S2', occupation: 'Laundry', earnings: null, hours: 42, weight: 152, gstn: 26000, gvf: 12800, nonResponse: true },
      { id: 'U-1149', stratum: 'S1', occupation: 'Retail trade', earnings: 26100, hours: 48, weight: 130, gstn: 66000, gvf: 25400, nonResponse: false },
      { id: 'U-1154', stratum: 'S3', occupation: 'Professional', earnings: 58400, hours: 50, weight: 118, gstn: 148000, gvf: 52200, nonResponse: false },
      { id: 'U-1158', stratum: 'S2', occupation: 'Tailoring', earnings: 18700, hours: 47, weight: 145, gstn: 45000, gvf: 18300, nonResponse: false },
      { id: 'U-1162', stratum: 'S1', occupation: 'Construction', earnings: 22900, hours: 54, weight: 131, gstn: 57000, gvf: 22700, nonResponse: false },
      { id: 'U-1167', stratum: 'S3', occupation: 'Software', earnings: 980000, hours: 55, weight: 116, gstn: 2100000, gvf: 74800, nonResponse: false },
      { id: 'U-1171', stratum: 'S2', occupation: 'Beauty services', earnings: null, hours: 40, weight: 149, gstn: 29000, gvf: 14100, nonResponse: true },
      { id: 'U-1176', stratum: 'S1', occupation: 'Warehousing', earnings: 25300, hours: 49, weight: 133, gstn: 61000, gvf: 24300, nonResponse: false },
      { id: 'U-1180', stratum: 'S2', occupation: 'Street vendor', earnings: 14100, hours: 58, weight: 154, gstn: 33000, gvf: 13800, nonResponse: false }
    ]
  },
  cpi: {
    id: 'cpi',
    name: 'CPI Rural Basket · Item Prices',
    code: 'MoSPI/CPI/RB/2026-27',
    unit: '₹ / kg or unit',
    projectedPopulation: 9420,
    description:
      'Rural consumer price basket for the CPI re-basing exercise. Includes a data-entry outlier on edible oil, missing pulses quotes and a non-response weight skew in the vegetable stratum.',
    rows: [
      { id: 'R-201', stratum: 'Food', occupation: 'Rice (per kg)', earnings: 42, hours: 0, weight: 210, gstn: 52, gvf: 43, nonResponse: false },
      { id: 'R-204', stratum: 'Food', occupation: 'Wheat (per kg)', earnings: 38, hours: 0, weight: 205, gstn: 47, gvf: 39, nonResponse: false },
      { id: 'R-208', stratum: 'Food', occupation: 'Pulses (per kg)', earnings: null, hours: 0, weight: 198, gstn: 121, gvf: 108, nonResponse: true },
      { id: 'R-212', stratum: 'Food', occupation: 'Edible oil (per L)', earnings: 128, hours: 0, weight: 202, gstn: 142, gvf: 131, nonResponse: false },
      { id: 'R-216', stratum: 'Food', occupation: 'Milk (per L)', earnings: 64, hours: 0, weight: 208, gstn: 71, gvf: 65, nonResponse: false },
      { id: 'R-220', stratum: 'Fuel', occupation: 'Kerosene (per L)', earnings: 32, hours: 0, weight: 176, gstn: 36, gvf: 33, nonResponse: false },
      { id: 'R-224', stratum: 'Fuel', occupation: 'Firewood (bundle)', earnings: 118, hours: 0, weight: 181, gstn: 132, gvf: 121, nonResponse: false },
      { id: 'R-228', stratum: 'Fuel', occupation: 'Electricity (unit)', earnings: 9, hours: 0, weight: 188, gstn: 11, gvf: 9, nonResponse: false },
      { id: 'R-232', stratum: 'Veg', occupation: 'Onion (per kg)', earnings: 27, hours: 0, weight: 154, gstn: 34, gvf: 29, nonResponse: false },
      { id: 'R-236', stratum: 'Veg', occupation: 'Tomato (per kg)', earnings: 24, hours: 0, weight: 149, gstn: 31, gvf: 26, nonResponse: false },
      { id: 'R-240', stratum: 'Veg', occupation: 'Potato (per kg)', earnings: 22, hours: 0, weight: 151, gstn: 28, gvf: 24, nonResponse: false },
      { id: 'R-244', stratum: 'Veg', occupation: 'Green chilli (per kg)', earnings: null, hours: 0, weight: 147, gstn: 88, gvf: 81, nonResponse: true },
      { id: 'R-248', stratum: 'Services', occupation: 'Haircut', earnings: 92, hours: 0, weight: 166, gstn: 108, gvf: 96, nonResponse: false },
      { id: 'R-252', stratum: 'Services', occupation: 'Laundry', earnings: 58, hours: 0, weight: 162, gstn: 69, gvf: 61, nonResponse: false },
      { id: 'R-256', stratum: 'Food', occupation: 'Edible oil (per L)', earnings: 12800, hours: 0, weight: 203, gstn: 142, gvf: 131, nonResponse: false },
      { id: 'R-260', stratum: 'Food', occupation: 'Sugar (per kg)', earnings: 46, hours: 0, weight: 207, gstn: 55, gvf: 47, nonResponse: false },
      { id: 'R-264', stratum: 'Veg', occupation: 'Cabbage (per kg)', earnings: 19, hours: 0, weight: 158, gstn: 24, gvf: 21, nonResponse: false }
    ]
  }
};

export function listDatasets() {
  return Object.values(DATASETS).map(({ id, name, code, unit, description, rows }) => ({
    id, name, code, unit, description, rowCount: rows.length
  }));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * (p / 100);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Run the full clean-up pipeline over a dataset.
 * @param {object} options
 * @param {string} options.datasetId  'plfs' | 'cpi'
 * @param {number} options.winsorPct  90 | 95 | 99 (upper percentile cap)
 * @param {string} options.imputeMethod 'gvf' | 'gstn' | 'mean'
 * @param {boolean} options.recalibrate apply non-response weight calibration
 */
export function simulate({ datasetId = 'plfs', winsorPct = 95, imputeMethod = 'gvf', recalibrate = true } = {}) {
  const ds = DATASETS[datasetId] || DATASETS.plfs;
  const observed = ds.rows.filter(r => r.earnings != null).map(r => r.earnings);
  const beforeMean = mean(observed);
  const beforeVar = variance(observed);
  const beforeWeightedMean = ds.rows.reduce((s, r) => s + (r.earnings ?? 0) * r.weight, 0) /
    ds.rows.reduce((s, r) => s + r.weight, 0);

  // 1. Imputation of missing responses.
  let imputedCount = 0;
  const filled = ds.rows.map(r => {
    if (r.earnings != null) return { ...r, value: r.earnings, imputed: false, winsorized: false };
    imputedCount += 1;
    let value;
    if (imputeMethod === 'gstn') value = r.gstn * (datasetId === 'cpi' ? 0.86 : 0.42);
    else if (imputeMethod === 'mean') value = beforeMean;
    else value = r.gvf * (datasetId === 'cpi' ? 0.99 : 1.01); // Mixed-stratum GVF
    return { ...r, value: Math.round(value), imputed: true, winsorized: false };
  });

  // 2. Winsorization at the chosen upper percentile (and mirrored lower tail).
  const sorted = filled.map(r => r.value).slice().sort((a, b) => a - b);
  const upper = percentile(sorted, winsorPct);
  const lower = percentile(sorted, 100 - winsorPct);
  let cappedCount = 0;
  const winsorized = filled.map(r => {
    if (r.value > upper) { cappedCount += 1; return { ...r, value: Math.round(upper), winsorized: true, original: r.value }; }
    if (r.value < lower) { cappedCount += 1; return { ...r, value: Math.round(lower), winsorized: true, original: r.value }; }
    return r;
  });

  // 3. Non-response weight re-calibration to the projected stratum population.
  const rawWeightTotal = winsorized.reduce((s, r) => s + r.weight, 0);
  let adjustedCount = 0;
  const rows = winsorized.map(r => {
    if (!recalibrate) return { ...r, finalWeight: r.weight, weightAdjusted: false };
    // Non-response cells carry a calibration uplift; all weights are then
    // normalised so the weighted total matches the projected population.
    const uplift = r.nonResponse ? 1.34 : 1.0;
    const scaled = r.weight * uplift * (ds.projectedPopulation / rawWeightTotal);
    adjustedCount += uplift > 1 ? 1 : 0;
    return { ...r, finalWeight: Math.round(scaled * 10) / 10, weightAdjusted: uplift > 1 };
  });

  const afterValues = rows.map(r => r.value);
  const afterMean = mean(afterValues);
  const afterVar = variance(afterValues);
  const afterWeightedTotal = rows.reduce((s, r) => s + r.value * r.finalWeight, 0);
  const afterWeightTotal = rows.reduce((s, r) => s + r.finalWeight, 0);
  const afterWeightedMean = afterWeightedTotal / afterWeightTotal;

  const varianceReduction = beforeVar > 0 ? ((beforeVar - afterVar) / beforeVar) * 100 : 0;
  const biasShift = beforeWeightedMean !== 0 ? ((afterWeightedMean - beforeWeightedMean) / beforeWeightedMean) * 100 : 0;

  // Compliance rubric is explicit and deterministic for jury demos.
  const compliant =
    winsorPct >= 95 &&
    imputeMethod !== 'mean' &&
    recalibrate;
  const violations = [];
  if (winsorPct < 95) violations.push('Winsorization below the P95 threshold leaves extreme non-sampling error in the estimator (NSSO Weighting Manual §7.4).');
  if (imputeMethod === 'mean') violations.push('Mean substitution biases stratum variance and is not permitted for official CPI/PLFS estimation (MoSPI TAG Guidelines §4.2).');
  if (!recalibrate) violations.push('Uncalibrated non-response weights understate the population total (UNSC Fundamental Principle 2).');

  return {
    dataset: { id: ds.id, name: ds.name, code: ds.code, unit: ds.unit, description: ds.description },
    settings: { winsorPct, imputeMethod, recalibrate },
    rows,
    before: { mean: beforeMean, variance: beforeVar, weightedMean: beforeWeightedMean, totalWeight: rawWeightTotal },
    after: { mean: afterMean, variance: afterVar, weightedMean: afterWeightedMean, totalWeight: afterWeightTotal },
    telemetry: {
      varianceReduction: Math.round(varianceReduction * 10) / 10,
      biasShift: Math.round(biasShift * 100) / 100,
      compliance: compliant ? 'COMPLIANT' : 'REVIEW REQUIRED',
      violations,
      cappedCount,
      imputedCount,
      adjustedCount,
      projectedPopulation: ds.projectedPopulation
    }
  };
}
