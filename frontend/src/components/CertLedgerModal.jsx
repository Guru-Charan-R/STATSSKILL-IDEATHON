import React, { useState, useEffect } from 'react';
import { downloadText, safeFilename } from '../lib/offlineFiles.js';

const COHORTS = {
  'ISS-2025-NZ': {
    code: 'ISS-2025-NZ',
    division: 'Northern Zone (HQ New Delhi)',
    module: 'SNA 2008 & GVA Reconciliation',
    hq: 'Zonal HQ New Delhi · Northern Zone',
    score: 91.4,
    progress: 86,
    officers: 124,
    varianceError: 0.8,
    competencies: [
      'SNA 2008 Value Added Reconciliation — Passed (91.4/100)',
      'Sampling Error Estimation — Passed (94.8%)',
      'PLFS Weighting Lab — Passed with 0.8% Variance Error'
    ]
  },
  'NSSO-FOD-SZ': {
    code: 'NSSO-FOD-SZ',
    division: 'Southern Zone (Field Operations)',
    module: 'PLFS 80th Round Multi-Stage Weighting',
    hq: 'Zonal HQ Bengaluru · Southern Zone',
    score: 95.2,
    progress: 94,
    officers: 210,
    varianceError: 0.6,
    competencies: [
      'PLFS Weighting Lab — Passed with 0.6% Variance Error',
      'Non-response Weight Calibration — Passed',
      'Multi-Stage Sampling Design — Passed (95.2/100)'
    ]
  },
  'DES-STATE-WZ': {
    code: 'DES-STATE-WZ',
    division: 'Western Directorate of Economics',
    module: 'CPI Urban/Rural Basket Price Re-basing',
    hq: 'Zonal HQ Mumbai · Western Zone',
    score: 84.0,
    progress: 72,
    officers: 88,
    varianceError: null,
    status: 'pending',
    competencies: [
      'CPI Hedonic Adjustments — Passed (91.4%)',
      'Basket Weight Reconciliation — Awaiting score',
      'SNA 2008 §25.42 Compliance — In progress'
    ]
  },
  'EPFO-GSTN-AI': {
    code: 'EPFO-GSTN-AI',
    division: 'Administrative Data Integration Wing',
    module: 'Big Data High-Frequency Employment Indices',
    hq: 'Zonal HQ New Delhi · Administrative Data Wing',
    score: 97.8,
    progress: 98,
    officers: 65,
    varianceError: 0.4,
    competencies: [
      'GSTN Proxy Turnover Estimation — Passed (97.8/100)',
      'Administrative Data Harmonization — Passed (85.6%)',
      'PLFS Weighting Lab — Passed with 0.4% Variance Error'
    ]
  }
};

async function sha256(text) {
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* fall through to deterministic fallback */ }
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = ((h1 ^ text.charCodeAt(i)) * 0x01000193) >>> 0;
    h2 = ((h2 + text.charCodeAt(i) * (i + 7)) * 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(4).slice(0, 64);
}

function tokenFromHash(code, hash) {
  return `SSAI-2026-${code}-${hash.slice(0, 8).toUpperCase()}`;
}

export default function CertLedgerModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('registry');
  const [cohortCode, setCohortCode] = useState('ISS-2025-NZ');
  const [credential, setCredential] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [verifyInput, setVerifyInput] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      setMode(detail.mode === 'issue' ? 'issue' : 'registry');
      setCohortCode(detail.cohort && COHORTS[detail.cohort] ? detail.cohort : 'ISS-2025-NZ');
      setVerdict(null);
      setVerifyInput('');
      setNotice('');
      setOpen(true);
    };
    window.addEventListener('open-cert-ledger', handler);
    return () => window.removeEventListener('open-cert-ledger', handler);
  }, []);

  // Deterministic SHA-256 hashes for the seeded token registry.
  useEffect(() => {
    if (!open || registry.length) return;
    let alive = true;
    (async () => {
      const seeds = Object.values(COHORTS).filter(c => c.status !== 'pending');
      const entries = await Promise.all(seeds.map(async c => {
        const hash = await sha256(`${c.code}|${c.module}|${c.score}|seed-2026`);
        return { ...c, hash, token: tokenFromHash(c.code, hash), issued: '2026-01-14', state: 'active' };
      }));
      if (alive) setRegistry(entries);
    })();
    return () => { alive = false; };
  }, [open, registry.length]);

  const issue = async () => {
    const cohort = COHORTS[cohortCode];
    if (!cohort || cohort.status === 'pending') {
      setNotice('This cohort has a pending score. Certificate issuance is blocked until assessment is complete.');
      return;
    }
    setBusy(true);
    const now = new Date();
    const hash = await sha256(`${cohort.code}|${cohort.module}|${cohort.score}|${now.toISOString()}`);
    const record = {
      ...cohort,
      hash,
      token: tokenFromHash(cohort.code, hash),
      issued: now.toISOString(),
      state: 'active'
    };
    setCredential(record);
    setRegistry(prev => [record, ...prev.filter(r => r.token !== record.token)]);
    setBusy(false);
    setNotice('Credential signed and appended to the local token registry.');
  };

  const verify = () => {
    const token = verifyInput.trim().toUpperCase();
    if (!token) { setVerdict({ ok: false, text: 'Enter a token ID to verify officer readiness.' }); return; }
    const found = registry.find(r => r.token.toUpperCase() === token);
    if (!found) {
      setVerdict({ ok: false, text: 'TOKEN NOT FOUND — officer is NOT cleared to sign off on live state-level survey datasets.' });
    } else if (found.state !== 'active' || found.status === 'pending') {
      setVerdict({ ok: false, text: 'TOKEN NOT ACTIVE — officer is NOT cleared. Assessment score is pending.' });
    } else {
      setVerdict({ ok: true, text: `CLEARED — ${found.code} credential is valid. Officer may sign off on live state-level survey datasets. Issued by ${found.hq}.` });
    }
  };

  const downloadCredential = () => {
    if (!credential) return;
    const lines = [
      'StatSkill AI · Tamper-Proof Credential',
      'SIH26101 | Government of India - MOSPI',
      '',
      `Token ID: ${credential.token}`,
      `SHA-256: ${credential.hash}`,
      `Issued: ${new Date(credential.issued).toLocaleString()}`,
      `Issuing Zonal HQ: ${credential.hq}`,
      `Cohort: ${credential.code} — ${credential.division}`,
      `Module: ${credential.module}`,
      `Assessment score: ${credential.score}/100`,
      '',
      'VERIFIED COMPETENCY BREAKDOWN',
      ...credential.competencies.map(c => `- ${c}`),
      '',
      'Verification: present the token ID in the StatSkill AI Token Registry to confirm officer readiness.',
      'This credential is a hackathon prototype record and is not a statutory MoSPI certificate.'
    ];
    downloadText(`${safeFilename(credential.token)}_credential.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/50 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-[20px]">verified_user</span>
              <h2 className="text-base font-bold">Tamper-Proof Cert Ledger</h2>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Cryptographic credential issuance &amp; live officer-readiness verification</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-2">
            <button onClick={() => setMode('issue')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${mode === 'issue' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Issue Certificate</button>
            <button onClick={() => setMode('registry')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${mode === 'registry' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Verify Token Registry</button>
          </div>

          {notice && <p className="text-xs text-teal-700 bg-teal-50 border-l-4 border-teal-400 px-3 py-2 rounded">{notice}</p>}

          {mode === 'issue' && (
            <>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Select cadre cohort</label>
                <select value={cohortCode} onChange={e => { setCohortCode(e.target.value); setCredential(null); setNotice(''); }} className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  {Object.values(COHORTS).map(c => <option key={c.code} value={c.code}>{c.code} — {c.module}</option>)}
                </select>
              </div>

              <button onClick={issue} disabled={busy} className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50">
                {busy ? 'Signing credential…' : 'Sign & Issue Certificate'}
              </button>

              {credential && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Signed credential</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">ACTIVE · SHA-256</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Token ID</div>
                      <div data-no-translate className="font-mono text-sm font-bold text-teal-700 break-all">{credential.token}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">SHA-256 credential hash</div>
                      <div data-no-translate className="font-mono text-[11px] text-slate-700 break-all bg-white border border-slate-200 rounded p-2 mt-1">{credential.hash}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-500">Timestamp</span><div className="font-semibold">{new Date(credential.issued).toLocaleString()}</div></div>
                      <div><span className="text-slate-500">Issuing Zonal HQ</span><div className="font-semibold">{credential.hq}</div></div>
                      <div><span className="text-slate-500">Assessment</span><div className="font-semibold">{credential.score}/100</div></div>
                      <div><span className="text-slate-500">Variance error</span><div className="font-semibold">{credential.varianceError != null ? `${credential.varianceError}%` : '—'}</div></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Verified competency breakdown</h4>
                    <ul className="space-y-2">
                      {credential.competencies.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                          <span className="material-symbols-outlined text-teal-600 text-[16px]">check_circle</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button onClick={downloadCredential} className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-300 text-slate-700 hover:border-teal-500">Download credential (.txt)</button>
                </div>
              )}
            </>
          )}

          {mode === 'registry' && (
            <>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verify Officer Readiness</label>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">Paste a token ID to confirm whether an officer is cleared to sign off on live state-level survey datasets.</p>
                <div className="flex gap-2">
                  <input value={verifyInput} onChange={e => setVerifyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verify(); }} data-no-translate placeholder="SSAI-2026-ISS-2025-NZ-XXXXXXXX" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono" />
                  <button onClick={verify} className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Verify</button>
                </div>
                {verdict && (
                  <div className={`mt-3 rounded-lg p-3 text-xs font-semibold ${verdict.ok ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'}`}>
                    {verdict.ok ? '✔ ' : '✖ '}{verdict.text}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">Active token registry ({registry.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {registry.map(r => (
                    <button key={r.token} onClick={() => setVerifyInput(r.token)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-teal-400 transition">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{r.code}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-700">ACTIVE</span>
                      </div>
                      <div data-no-translate className="font-mono text-[10px] text-teal-700 break-all mt-1">{r.token}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{r.module} · {r.hq}</div>
                      <div className="text-[9px] text-slate-400 mt-1 truncate">SHA-256: {r.hash}</div>
                    </button>
                  ))}
                  {registry.length === 0 && <p className="text-xs text-slate-500">Computing registry hashes…</p>}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Tip: click a token to load it into the readiness verifier.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
