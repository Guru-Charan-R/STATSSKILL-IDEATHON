import React, { useState } from 'react';
import { AUDIT_PRESETS, auditPlan, applyFix, highlightSegments } from '../lib/policyAudit.js';

export default function PolicyAuditor({ initialPreset = 'sampling' }) {
  const [preset, setPreset] = useState(initialPreset);
  const [text, setText] = useState(AUDIT_PRESETS[initialPreset]?.text || '');
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');

  const choosePreset = (id) => {
    setPreset(id);
    setText(AUDIT_PRESETS[id].text);
    setReport(null);
    setNotice('');
  };

  const run = () => {
    setRunning(true);
    setNotice('');
    // A short pause makes the audit feel like a real engine pass in a demo.
    setTimeout(() => {
      setReport(auditPlan(text));
      setRunning(false);
    }, 450);
  };

  const fixOne = (finding) => {
    setText(prev => applyFix(prev, finding));
    setReport(prev => prev ? { ...prev, findings: prev.findings.filter(f => f.id !== finding.id) } : prev);
    setNotice(`Compliant fix applied for ${finding.citation}. Re-run the audit to confirm.`);
  };

  const fixAll = () => {
    if (!report) return;
    setText(report.fixedText);
    setReport(null);
    setNotice('All compliant fixes applied. Re-run the audit to verify the plan.');
  };

  const tone = report?.status === 'NO VIOLATIONS DETECTED' ? 'teal' : report?.risk >= 60 ? 'rose' : 'amber';
  const badge = tone === 'teal' ? 'bg-teal-100 text-teal-700' : tone === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800">
      <div className="px-5 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-600 text-[20px]">fact_check</span>
          <div>
            <h2 className="text-sm font-bold">Methodology &amp; Policy Auditor</h2>
            <p className="text-[10px] text-slate-500">UNSC · SNA 2008 · MoSPI TAG rule engine</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Load a required artifact</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.values(AUDIT_PRESETS).map(p => (
              <button key={p.id} onClick={() => choosePreset(p.id)} className={`px-3 py-2 rounded-lg text-[11px] font-semibold border ${preset === p.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-[11px] text-slate-500 cursor-pointer hover:border-teal-400 bg-white">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Upload a .txt plan
            <input type="file" accept=".txt,text/plain" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setText(await f.text());
              setPreset('');
              setReport(null);
              setNotice(`Loaded ${f.name}.`);
            }} />
          </label>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plan text (editable)</label>
            <button onClick={() => setText('')} className="text-[10px] text-slate-400 hover:text-rose-500">Clear</button>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={11}
            data-no-translate
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Paste a survey sampling plan or CPI re-basing formula with methodological choices…"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-400">{text.length} characters · {text.split('\n').length} lines</span>
            <button onClick={run} disabled={running || !text.trim()} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50">
              {running ? 'Auditing…' : 'Run UNSC & SNA 2008 Audit'}
            </button>
          </div>
        </div>

        {notice && <p className="text-[11px] text-teal-700 bg-teal-50 border-l-4 border-teal-400 px-3 py-2 rounded">{notice}</p>}

        {report && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold">Audit verdict</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{report.findings.length} violation(s) · checked {new Date(report.checkedAt).toLocaleTimeString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badge}`}>{report.status}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${tone === 'teal' ? 'bg-teal-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${report.risk}%` }}></div>
                </div>
                <span className="text-[11px] font-bold tabular-nums text-slate-600">Risk {report.risk}%</span>
              </div>
              {report.findings.length > 0 && (
                <button onClick={fixAll} className="mt-3 text-[11px] font-semibold text-teal-700 hover:underline">Apply all compliant fixes →</button>
              )}
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Flagged plan (inline)</h3>
              <div data-no-translate className="bg-white rounded-xl border border-slate-200 p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {highlightSegments(text, report.findings).map((seg, i) => seg.finding ? (
                  <mark key={i} title={seg.finding.citation} className="bg-rose-100 text-rose-700 underline decoration-rose-400 decoration-wavy rounded-sm">{seg.text}</mark>
                ) : <span key={i}>{seg.text}</span>)}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Citations &amp; remedies</h3>
              {report.findings.map((f, i) => (
                <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <h4 className="text-xs font-bold text-slate-800">{f.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-semibold whitespace-nowrap">Line {f.line}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 inline-block px-2 py-0.5 rounded">{f.citation}</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed"><b>Why it fails:</b> {f.why}</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed"><b>Impact on estimates:</b> {f.impact}</p>
                  <div className="flex items-start justify-between gap-3 bg-teal-50 rounded-lg p-2">
                    <p className="text-[10px] text-teal-800 leading-snug"><b>Compliant fix:</b> “{f.fix}”</p>
                    <button onClick={() => fixOne(f)} className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700">Apply fix</button>
                  </div>
                </div>
              ))}
              {report.findings.length === 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs text-teal-800">
                  No statutory violations detected. This plan conforms to the UNSC Fundamental Principles, SNA 2008 §25.42 and MoSPI TAG guidance.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
