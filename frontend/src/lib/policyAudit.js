// Deterministic methodology compliance engine used by the Policy Auditor.
// Rules are written against realistic flawed survey/CPI plans so a jury demo
// produces identical, citable findings every time (no model dependency).

export const AUDIT_PRESETS = {
  sampling: {
    id: 'sampling',
    label: 'PLFS 80th Round · Sampling Plan',
    code: 'NSSO/PD/80/URB-S1',
    text: `Survey Sampling Plan — PLFS 80th Round (Urban Stratum)
Objective: Estimate usual-status monthly earnings for urban households.

1. Design: A simple random sample of 1,200 households is drawn from each urban stratum.
2. Handling non-response: Missing earnings entries are replaced with the overall mean of observed earnings.
3. Outlier treatment: Extreme earnings are winsorized at the 90th percentile.
4. Weighting: Design weights are computed as inverse selection probabilities. No weight calibration is applied for unit non-response.
5. Rotation: The same households are surveyed in every round to preserve comparability.
6. Auxiliary data: GSTN turnover is used as a direct proxy for household income in the estimation stage.`
  },
  cpi: {
    id: 'cpi',
    label: 'CPI Re-basing · Formula Note',
    code: 'MoSPI/CPI/RB/2026-27',
    text: `CPI Re-basing Formula — Rural Basket 2026-27
1. Base year: 2011-12. Item weights are taken from the current-year household consumption expenditure survey without chaining.
2. Quality adjustment: Hedonic regression is applied only to electronics; other items use unweighted price relatives.
3. Missing price quotes: Missing monthly prices are filled using last observation carried forward.
4. Outlier treatment: Data-entry errors are retained to preserve the original variance of the basket.
5. Weighting: Item weights are not reconciled with SNA 2008 household final consumption expenditure aggregates.`
  }
};

const RULES = [
  {
    id: 'srs-design',
    match: 'simple random sample',
    citation: 'UNSC Fundamental Principle 2',
    title: 'Sampling design ignores explicit stratification',
    why: 'A simple random draw within a heterogeneous urban stratum ignores the design strata and inflates between-stratum sampling error. Official PLFS estimation requires a stratified multi-stage design with known selection probabilities at each stage.',
    impact: 'Understates the standard error of urban earnings and distorts state-level GVA weights derived from PLFS.',
    fix: 'stratified multi-stage sample with explicit stratum weights'
  },
  {
    id: 'mean-imputation',
    match: 'replaced with the overall mean',
    citation: 'MoSPI TAG Guidelines §4.2',
    title: 'Mean substitution for item non-response',
    why: 'Replacing missing earnings with the overall mean collapses the empirical variance and biases the stratum distribution toward the centre. The TAG requires variance-aware imputation using auxiliary information.',
    impact: 'Compresses the earnings distribution, understating inequality measures and the labour share used in SNA 2008 income accounts.',
    fix: 'imputed with mixed-stratum Generalized Variance Functions (GVF)'
  },
  {
    id: 'p90-winsor',
    match: 'winsorized at the 90th percentile',
    citation: 'NSSO Weighting Manual §7.4',
    title: 'Outlier cap set below the P95 threshold',
    why: 'A P90 cap removes legitimate high-income observations along with data-entry outliers, truncating the right tail of the earnings distribution.',
    impact: 'Understates high-income household expenditure, feeding a downward bias into CPI weights and private final consumption expenditure.',
    fix: 'winsorized at the 95th percentile with design-based tail checks'
  },
  {
    id: 'no-calibration',
    match: 'No weight calibration is applied',
    citation: 'UNSC Fundamental Principle 2 · SNA 2008 §25.42',
    title: 'Unit non-response weights are not calibrated',
    why: 'Design weights alone do not compensate for differential non-response. Calibration to projected population totals is mandatory before estimation.',
    impact: 'The weighted sample total drifts from the projected urban population, biasing all national-level earnings aggregates.',
    fix: 'Calibration ratios are applied to align weights with projected population totals'
  },
  {
    id: 'no-rotation',
    match: 'The same households are surveyed in every round',
    citation: 'NSS 80th Round Design Note §3.2',
    title: 'No sample rotation between survey rounds',
    why: 'Reusing the same households creates panel conditioning and leaves the sample unrepresentative of newly formed urban households.',
    impact: 'Stale consumption patterns propagate into CPI re-basing and understate changes in the urban basket.',
    fix: 'A 25% sample rotation is applied in every round'
  },
  {
    id: 'gstn-direct',
    match: 'direct proxy for household income',
    citation: 'MoSPI TAG Guidelines §6.1',
    title: 'GSTN turnover used as a direct income proxy',
    why: 'GSTN turnover is a business-level, gross transaction measure. It cannot be equated with household disposable income without a ratio-estimator adjustment.',
    impact: 'Overstates self-employed earnings and the informal-sector contribution to GVA.',
    fix: 'GSTN turnover is used only as an auxiliary variable in a ratio estimator'
  },
  {
    id: 'no-chaining',
    match: 'without chaining',
    citation: 'SNA 2008 §25.42',
    title: 'Fixed-base weights without volume chaining',
    why: 'Direct comparison of current-year quantities with a single base-year price vector ignores substitution and quality change. SNA 2008 recommends chained volume measures.',
    impact: 'Overstates real growth in the price index and mismeasures the GDP deflator.',
    fix: 'with chained Fisher volume indices referenced to 2011-12'
  },
  {
    id: 'unweighted-relatives',
    match: 'unweighted price relatives',
    citation: 'SNA 2008 §25.42 · CPI Manual §7.3',
    title: 'Unweighted price relatives in the basket',
    why: 'Averaging price relatives without expenditure weights gives a small item the same influence as rice or fuel, breaking the expenditure-share logic of a Laspeyres-type CPI.',
    impact: 'Distorts the CPI headline rate and the escalation factors used in national accounts.',
    fix: 'expenditure-weighted price relatives using 2011-12 shares'
  },
  {
    id: 'locf',
    match: 'last observation carried forward',
    citation: 'MoSPI TAG Guidelines §4.2',
    title: 'Carry-forward imputation for missing quotes',
    why: 'Carrying the previous price forward freezes stale quotes during inflationary periods and suppresses measured price change.',
    impact: 'Understates month-on-month CPI, affecting Dearness Allowance and index-linked payments.',
    fix: 'imputed with stratum-level GVF estimates anchored to neighbouring outlets'
  },
  {
    id: 'retain-outliers',
    match: 'retained to preserve the original variance',
    citation: 'NSSO Weighting Manual §7.4',
    title: 'Data-entry outliers left untreated',
    why: 'Keying errors are non-sampling errors, not genuine variance. Retaining them inflates both the mean and the dispersion of the basket.',
    impact: 'Creates spurious volatility in the CPI series and corrupts weight reconciliation.',
    fix: 'screened and winsorized at the P95 threshold before aggregation'
  },
  {
    id: 'no-sna-reconcile',
    match: 'not reconciled with SNA 2008',
    citation: 'SNA 2008 §25.42',
    title: 'CPI weights not reconciled with household consumption aggregates',
    why: 'CPI item weights must be consistent with the household final consumption expenditure categories in the national accounts.',
    impact: 'Breaks the bridge between CPI and the GDP deflator, weakening reconciliation of national accounts.',
    fix: 'reconciled with SNA 2008 household final consumption expenditure aggregates'
  }
];

/** Audit a plan and return citable findings plus a corrected copy of the text. */
export function auditPlan(text) {
  const source = String(text || '');
  const findings = [];
  let fixed = source;

  RULES.forEach(rule => {
    const index = source.toLowerCase().indexOf(rule.match.toLowerCase());
    if (index === -1) return;
    const line = source.slice(0, index).split('\n').length;
    findings.push({
      id: rule.id,
      snippet: source.slice(index, index + rule.match.length),
      index,
      line,
      citation: rule.citation,
      title: rule.title,
      why: rule.why,
      impact: rule.impact,
      fix: rule.fix
    });
    fixed = fixed.replace(rule.match, rule.fix);
  });

  findings.sort((a, b) => a.index - b.index);
  const risk = Math.min(100, findings.length * 14);
  return {
    findings,
    fixedText: fixed,
    risk,
    status: findings.length === 0 ? 'NO VIOLATIONS DETECTED' : risk >= 60 ? 'HIGH RISK' : 'REMEDIATION REQUIRED',
    checkedAt: new Date().toISOString()
  };
}

/** Apply one or all fixes to the supplied text. */
export function applyFix(text, finding) {
  return String(text || '').replace(finding.snippet, finding.fix);
}

/** Split text into segments so flagged phrases can be highlighted inline. */
export function highlightSegments(text, findings) {
  const source = String(text || '');
  if (!findings.length) return [{ text: source, finding: null }];
  const marks = findings.map(f => ({ start: f.index, end: f.index + f.snippet.length, finding: f }));
  const segments = [];
  let cursor = 0;
  marks.forEach(m => {
    if (m.start > cursor) segments.push({ text: source.slice(cursor, m.start), finding: null });
    segments.push({ text: source.slice(m.start, m.end), finding: m.finding });
    cursor = m.end;
  });
  if (cursor < source.length) segments.push({ text: source.slice(cursor), finding: null });
  return segments;
}
