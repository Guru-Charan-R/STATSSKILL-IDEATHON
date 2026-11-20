import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';

const features = [
  ['Live Microdata Sandbox', 'Clean a dirty PLFS or CPI extract with winsorization, GVF imputation and weight calibration — then watch variance and bias telemetry move.'],
  ['Methodology & Policy Auditor', 'Run UNSC, SNA 2008 and MoSPI TAG rule checks on a sampling plan or re-basing formula, with inline citations and one-click compliant fixes.'],
  ['Tamper-Proof Cert Ledger', 'SHA-256 signed credentials, verifiable token registry and live officer-readiness checks before sign-off on state-level datasets.'],
  ['CAPI Edge Sync Simulator', 'Rehearse an offline district visit with compressed micro-modules, geo-tagged polygon validation and an encrypted sync queue.'],
  ['Competency Gap Analysis', 'Radar view of eight governance competencies against MoSPI role benchmarks — not passive course completion.'],
  ['Pre-Deployment Gatekeeper', 'Simulation results decide whether an officer is cleared for live national datasets. Bias is stopped before it enters the estimate.'],
  ['Governance Document Library', 'RAG over official manuals, NSS schedules and TAG guidance, with plain-text offline copies for field use.'],
  ['Bias Incident Telemetry', 'Longitudinal variance-error and compliance trends across cadres, zonal HQs and assessment cohorts.'],
];

export default function Features() {
  const { t } = useSettings();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 font-display mb-2">{t('featuresTitle')}</h1>
      <p className="text-sm text-slate-500 mb-8 max-w-3xl">Operational governance infrastructure for the National Statistical System — simulation, audit and accreditation, not passive learning.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(([t, d]) => (
          <div key={t} className="bg-white rounded-3xl p-6 border border-slate-100 card-soft-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/videos" className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Explore Video Library</Link>
      </div>
    </div>
  );
}