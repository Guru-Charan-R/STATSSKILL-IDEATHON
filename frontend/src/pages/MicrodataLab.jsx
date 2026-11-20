import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDatasets, simulate } from '../lib/microdata.js';
import { downloadText, safeFilename } from '../lib/offlineFiles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import api from '../lib/api.js';

const DATASETS = listDatasets();

const IMPUTE_LABELS = {
  gvf: 'Mixed-Stratum GVF (recommended)',
  gstn: 'GSTN Proxy Turnover',
  mean: 'Mean Substitution (non-compliant)'
};

function Gauge({ label, value, display, tone = 'teal', hint }) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-teal-500';
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`font-display text-lg font-bold tabular-nums ${tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : 'text-teal-700'}`}>{display}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
        <div className={`${bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
      </div>
      {hint && <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

export default function MicrodataLab() {
  const { user } = useAuth();
  const { t } = useSettings();
  const [datasetId, setDatasetId] = useState('plfs');
  const [winsorPct, setWinsorPct] = useState(95);
  const [imputeMethod, setImputeMethod] = useState('gvf');
  const [recalibrate, setRecalibrate] = useState(true);
  const [showBank, setShowBank] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [docs, setDocs] = useState([]);
  const [genDoc, setGenDoc] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [genQuestions, setGenQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [banner, setBanner] = useState('');

  const result = useMemo(
    () => simulate({ datasetId, winsorPct, imputeMethod, recalibrate }),
    [datasetId, winsorPct, imputeMethod, recalibrate]
  );

  const loadBank = async () => {
    try {
      const r = await api.get('/quizzes');
      setQuizzes(r.data.quizzes || []);
      const d = await api.get('/documents');
      setDocs(d.data.documents || []);
    } catch (e) { setBanner('Assessment bank is unavailable offline.'); }
  };

  const toggleBank = () => {
    const next = !showBank;
    setShowBank(next);
    if (next && quizzes.length === 0) loadBank();
  };

  const generate = async () => {
    try {
      const r = await api.post('/quizzes/generate', { document_id: genDoc || undefined, topic: genTopic, count: genCount });
      setGenQuestions(r.data.questions || []);
      setBanner('MCQ set generated. Save it as a draft or open it in the assessment bank.');
    } catch (err) { setBanner(err.response?.data?.error || 'Generation failed'); }
  };

  const saveQuiz = async () => {
    if (!title || genQuestions.length === 0) return setBanner('Title and questions required');
    try {
      await api.post('/quizzes', { title, document_id: genDoc || undefined, topic: genTopic, questions: genQuestions, status: 'draft' });
      setTitle(''); setGenQuestions([]); setBanner('Draft saved.'); await loadBank();
    } catch (e) { setBanner('Could not save the quiz.'); }
  };

  const approve = async (id) => {
    try { await api.patch(`/quizzes/${id}/approve`); await loadBank(); } catch (e) { setBanner('Approval failed.'); }
  };

  const applyCompliant = () => { setWinsorPct(95); setImputeMethod('gvf'); setRecalibrate(true); setBanner('Compliant estimation preset applied: P95 + Mixed-Stratum GVF + non-response calibration.'); };
  const reset = () => { setWinsorPct(90); setImputeMethod('mean'); setRecalibrate(false); setBanner('Reset to the naive baseline estimator.'); };

  const exportReport = () => {
    const { before, after, telemetry, dataset, settings } = result;
    const lines = [
      'StatSkill AI · Statistical Anomaly & Weighting Lab',
      'SIH26101 | MoSPI Capacity Building Portal',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Dataset: ${dataset.name} (${dataset.code})`,
      `Estimator: P${settings.winsorPct} winsorization · ${IMPUTE_LABELS[settings.imputeMethod]} · recalibration ${settings.recalibrate ? 'ON' : 'OFF'}`,
      '',
      'TELEMETRY',
      `Sampling variance reduction: ${telemetry.varianceReduction}%`,
      `Estimated bias shift: ${telemetry.biasShift}%`,
      `SNA 2008 / NSSO status: ${telemetry.compliance}`,
      '',
      'ESTIMATES',
      `Raw mean (${dataset.unit}): ${before.mean.toFixed(2)}`,
      `Cleaned mean (${dataset.unit}): ${after.mean.toFixed(2)}`,
      `Weighted mean before: ${before.weightedMean.toFixed(2)}`,
      `Weighted mean after: ${after.weightedMean.toFixed(2)}`,
      `Design weight total: ${before.totalWeight.toFixed(0)} → calibrated ${after.totalWeight.toFixed(0)} (projected ${telemetry.projectedPopulation})`,
      '',
      `Outliers capped: ${telemetry.cappedCount} | Missing imputed: ${telemetry.imputedCount} | Weights adjusted: ${telemetry.adjustedCount}`,
      ...(telemetry.violations.length ? ['', 'VIOLATIONS', ...telemetry.violations.map(v => `- ${v}`)] : [])
    ];
    downloadText(`${safeFilename(dataset.code)}_lab_report.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
    setBanner('Lab report downloaded as a text file.');
  };

  const complianceTone = result.telemetry.compliance === 'COMPLIANT' ? 'teal' : 'rose';
  const biasTone = Math.abs(result.telemetry.biasShift) > 1 ? 'rose' : Math.abs(result.telemetry.biasShift) > 0.2 ? 'amber' : 'teal';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[22px]">query_stats</span>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">Statistical Anomaly &amp; Weighting Lab</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            A live microdata sandbox. Apply official cleaning rules to a dirty survey extract and watch the
            sampling variance, bias and SNA 2008 compliance telemetry update in real time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={applyCompliant} className="px-3 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Apply compliant preset</button>
          <button onClick={exportReport} className="px-3 py-2 rounded-full text-xs font-semibold border border-slate-200 text-slate-600 hover:border-teal-400">Export lab report (.txt)</button>
        </div>
      </div>

      {banner && <p className="text-xs text-teal-700 bg-teal-50 border-l-4 border-teal-400 px-3 py-2 rounded">{banner}</p>}

      {/* Dataset selector */}
      <div className="flex flex-wrap gap-2">
        {DATASETS.map(d => (
          <button key={d.id} onClick={() => setDatasetId(d.id)} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${datasetId === d.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
            <span className="block text-[11px]">{d.name}</span>
            <span className="block text-[9px] opacity-70 font-mono">{d.code} · {d.rowCount} rows</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dataset table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 card-soft-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">{result.dataset.name}</h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{result.dataset.description}</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3">HH / Item</th>
                  <th className="py-2 px-3">Stratum</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Raw ({result.dataset.unit})</th>
                  <th className="py-2 px-3 text-right">Clean</th>
                  <th className="py-2 px-3 text-right">Final wt.</th>
                  <th className="py-2 px-3">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.rows.map(r => (
                  <tr key={r.id} className={`${r.winsorized || r.imputed || r.weightAdjusted ? 'bg-amber-50/50' : ''} hover:bg-slate-50`}>
                    <td className="py-1.5 px-3 font-mono font-semibold text-slate-700">{r.id}</td>
                    <td className="py-1.5 px-3 text-slate-500">{r.stratum}</td>
                    <td className="py-1.5 px-3 text-slate-700">{r.occupation}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-slate-500">
                      {r.earnings == null ? <span className="text-rose-500">MISSING</span> : r.earnings.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums font-semibold text-slate-800">{r.value.toLocaleString()}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-slate-600">{r.finalWeight.toFixed(1)}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {r.winsorized && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">WINSOR {r.original.toLocaleString()}→{r.value.toLocaleString()}</span>}
                        {r.imputed && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-700">IMPUTED</span>}
                        {r.weightAdjusted && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-700">W-ADJ</span>}
                        {!r.winsorized && !r.imputed && !r.weightAdjusted && <span className="text-[9px] text-slate-400">clean</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] text-slate-500">
            <span><b className="text-amber-600">{result.telemetry.cappedCount}</b> outliers capped</span>
            <span><b className="text-cyan-600">{result.telemetry.imputedCount}</b> cells imputed</span>
            <span><b className="text-teal-600">{result.telemetry.adjustedCount}</b> weights recalibrated</span>
          </div>
        </div>

        {/* Controls + telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">Estimator Controls</h2>
              <button onClick={reset} className="text-[10px] font-semibold text-slate-500 hover:text-teal-600">Reset</button>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-semibold text-slate-700">Winsorization threshold</label>
                <span className="text-xs font-bold text-teal-700 font-mono">P{winsorPct}</span>
              </div>
              <input type="range" min="90" max="99" step="1" value={winsorPct} onChange={e => setWinsorPct(Number(e.target.value))} className="w-full accent-teal-500" />
              <div className="flex justify-between text-[9px] text-slate-400 mt-1"><span>P90</span><span>P95</span><span>P99</span></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Imputation method</label>
              <select value={imputeMethod} onChange={e => setImputeMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs">
                {Object.entries(IMPUTE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <label className="flex items-center justify-between cursor-pointer bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div>
                <div className="text-xs font-semibold text-slate-700">Non-response weight re-calibration</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Scale field weights to projected stratum population</div>
              </div>
              <input type="checkbox" checked={recalibrate} onChange={e => setRecalibrate(e.target.checked)} className="w-4 h-4 accent-teal-500" />
            </label>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow space-y-3">
            <h2 className="font-bold text-slate-900 text-sm">Live Governance Telemetry</h2>
            <Gauge
              label="Sampling variance reduction"
              value={result.telemetry.varianceReduction}
              display={`${result.telemetry.varianceReduction}%`}
              hint={`Variance ${result.before.variance.toFixed(0)} → ${result.after.variance.toFixed(0)}`}
            />
            <Gauge
              label="Estimated bias shift"
              value={Math.min(100, Math.abs(result.telemetry.biasShift) * 10)}
              display={`${result.telemetry.biasShift > 0 ? '+' : ''}${result.telemetry.biasShift}%`}
              tone={biasTone}
              hint={`Weighted mean ${result.before.weightedMean.toFixed(0)} → ${result.after.weightedMean.toFixed(0)}`}
            />
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">SNA 2008 / NSSO status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${complianceTone === 'teal' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>
                  {result.telemetry.compliance}
                </span>
              </div>
              {result.telemetry.violations.length ? (
                <ul className="mt-2 space-y-1">
                  {result.telemetry.violations.map((v, i) => <li key={i} className="text-[10px] text-rose-600 leading-snug">• {v}</li>)}
                </ul>
              ) : (
                <p className="text-[10px] text-teal-700 mt-2">All applied rules conform to NSSO Weighting Manual §7.4, MoSPI TAG Guidelines §4.2 and UNSC Fundamental Principle 2.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
            <h2 className="font-bold text-slate-900 text-sm mb-2">Estimator comparison</h2>
            <table className="w-full text-xs">
              <thead><tr className="text-[10px] uppercase text-slate-500"><th className="text-left py-1">Measure</th><th className="text-right py-1">Before</th><th className="text-right py-1">After</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-1.5 text-slate-600">Mean ({result.dataset.unit})</td><td className="py-1.5 text-right tabular-nums">{result.before.mean.toFixed(2)}</td><td className="py-1.5 text-right tabular-nums font-semibold">{result.after.mean.toFixed(2)}</td></tr>
                <tr><td className="py-1.5 text-slate-600">Variance</td><td className="py-1.5 text-right tabular-nums">{result.before.variance.toFixed(0)}</td><td className="py-1.5 text-right tabular-nums font-semibold">{result.after.variance.toFixed(0)}</td></tr>
                <tr><td className="py-1.5 text-slate-600">Weighted mean</td><td className="py-1.5 text-right tabular-nums">{result.before.weightedMean.toFixed(2)}</td><td className="py-1.5 text-right tabular-nums font-semibold">{result.after.weightedMean.toFixed(2)}</td></tr>
                <tr><td className="py-1.5 text-slate-600">Total design weight</td><td className="py-1.5 text-right tabular-nums">{result.before.totalWeight.toFixed(0)}</td><td className="py-1.5 text-right tabular-nums font-semibold">{result.after.totalWeight.toFixed(0)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Retained assessment bank */}
      <div className="bg-white rounded-2xl border border-slate-200 card-soft-shadow overflow-hidden">
        <button onClick={toggleBank} className="w-full px-5 py-4 flex items-center justify-between text-left">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Assessment Bank · MCQ generation</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Generate and curate formal quizzes from approved documents. The live lab above replaces timed scoring for field simulations.</p>
          </div>
          <span className="text-xs font-semibold text-teal-600">{showBank ? 'Hide −' : 'Show +'}</span>
        </button>
        {showBank && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
            {(user?.role === 'admin' || user?.role === 'trainer') && (
              <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select value={genDoc} onChange={e => setGenDoc(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs">
                    <option value="">No document</option>
                    {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                  <input value={genTopic} onChange={e => setGenTopic(e.target.value)} placeholder="Topic (optional)" className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  <input value={genCount} onChange={e => setGenCount(e.target.value)} type="number" min="1" max="20" className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  <button onClick={generate} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Generate</button>
                </div>
                {genQuestions.length > 0 && (
                  <div className="space-y-2">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                    {genQuestions.map((q, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg p-3 text-xs bg-white">
                        <div className="font-semibold">{i + 1}. {q.question}</div>
                        <ul className="mt-1 text-[11px] text-slate-600 list-disc pl-5">{(q.options || []).map((o, j) => <li key={j}>{o} {q.correct_index === j && <span className="text-emerald-600">(correct)</span>}</li>)}</ul>
                      </div>
                    ))}
                    <button onClick={saveQuiz} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Save as draft</button>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              {quizzes.map(q => (
                <div key={q.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">{q.title}</div>
                    <div className="text-[10px] text-slate-500">{q.topic || 'General'} · {q.difficulty} · {q.status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(user?.role === 'admin' || user?.role === 'trainer') && q.status !== 'approved' && (
                      <button onClick={() => approve(q.id)} className="text-xs text-cyan-600 hover:underline">Approve</button>
                    )}
                    <Link to={`/quizzes/${q.id}`} className="text-xs text-cyan-600 hover:underline">Open</Link>
                  </div>
                </div>
              ))}
              {quizzes.length === 0 && <p className="text-xs text-slate-500">No quizzes yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
