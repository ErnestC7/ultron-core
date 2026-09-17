import React, { useState, useEffect } from 'react';

function App() {
  const [name, setName] = useState('');
  const [perspective, setPerspective] = useState('Financial');
  const [targetValue, setTargetValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [month, setMonth] = useState('January 2026');

  const [kpis, setKpis] = useState([]);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  // AI analysis state tracking
  const [insights, setInsights] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(null);

  const fetchKPIs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/kpis');
      const result = await response.json();
      if (result.success) {
        setKpis(result.data);
      }
    } catch (err) {
      console.error("Failed to connect to Ultron Core:", err);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });

    if (!name || !targetValue || !actualValue) {
      setMessage({ text: '⚠️ Please fill out all required fields.', isError: true });
      return;
    }

    setLoading(true);
    const payload = { name, perspective, targetValue, actualValue, month };

    try {
      const response = await fetch('http://localhost:5000/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ text: `✅ "${name}" successfully recorded.`, isError: false });
        setName('');
        setTargetValue('');
        setActualValue('');
        fetchKPIs();
      } else {
        setMessage({ text: `❌ ${result.message}`, isError: true });
      }
    } catch (err) {
      setMessage({ text: '❌ Could not connect to backend server.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Trigger FastAPI ML + Gemini analysis via Node.js bridge
  const analyzeKPI = async (id) => {
    setIsAnalyzing(id);
    try {
      const response = await fetch(`http://localhost:5000/api/kpis/${id}/analyze`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        setInsights(prev => ({ ...prev, [id]: result.analysis }));
      } else {
        alert(result.message || 'AI analysis failed.');
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert('Could not connect to AI service.');
    } finally {
      setIsAnalyzing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              ULTRON CORE
            </h1>
            <span className="text-[10px] bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono px-2 py-0.5 rounded-md uppercase font-semibold">
              v1.2 Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">
            AI-Powered Strategic Balanced Scorecard Framework
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-mono shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          ML + GEMINI PIPELINE CONNECTED
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metric Injection Form */}
        <section className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cyan-400 text-lg">⚡</span>
            <h2 className="text-lg font-bold text-slate-100">Metric Injection Form</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Log objectives into the Balanced Scorecard pipeline.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                KPI Metric Title
              </label>
              <input
                type="text"
                placeholder="e.g. Class Attendance Report"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none transition duration-150"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                BSC Strategic Perspective
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none transition duration-150"
                value={perspective}
                onChange={(e) => setPerspective(e.target.value)}
              >
                <option value="Financial">Financial Perspective</option>
                <option value="Customer">Customer Perspective</option>
                <option value="Internal Processes">Internal Processes</option>
                <option value="Learning & Growth">Learning & Growth</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Metric
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="90.00"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none transition duration-150"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Actual Metric
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="46.00"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none transition duration-150"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Reporting Period
              </label>
              <input
                type="text"
                placeholder="January 2026"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none transition duration-150"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all duration-150 shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Committing...' : 'Commit Data to PostgreSQL'}
            </button>
          </form>

          {message.text && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                message.isError
                  ? 'bg-red-950/60 border border-red-500/40 text-red-300'
                  : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              }`}
            >
              {message.text}
            </div>
          )}
        </section>

        {/* Live Stream Section */}
        <section className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-lg">📊</span>
                <h2 className="text-lg font-bold text-slate-100">Live Scorecard Data Stream</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time strategic metrics and AI diagnostic commentary
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
              Total: {kpis.length}
            </span>
          </div>

          {kpis.length === 0 ? (
            <div className="border-2 border-dashed border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-sm">
              No entries found. Input a metric on the left to initialize tracking.
            </div>
          ) : (
            <div className="space-y-4">
              {kpis.map((kpi) => {
                const target = parseFloat(kpi.target_value ?? kpi.targetValue ?? 1);
                const actual = parseFloat(kpi.actual_value ?? kpi.actualValue ?? 0);
                const variance = ((actual / target) * 100).toFixed(1);
                const ai = insights[kpi.id];

                return (
                  <div
                    key={kpi.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-5 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-slate-900">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-slate-100">{kpi.name}</h3>
                          <span className="text-[11px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                            {kpi.perspective}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          Target: <span className="text-slate-200 font-semibold">{target}</span>
                          <span className="mx-2 text-slate-600">|</span>
                          Actual: <span className="text-slate-200 font-semibold">{actual}</span>
                          <span className="mx-2 text-slate-600">|</span>
                          <span className="text-slate-400">{kpi.month}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div
                          className={`px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${
                            parseFloat(variance) >= 100
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : parseFloat(variance) >= 70
                              ? 'bg-sky-950/40 text-sky-400 border-sky-500/30'
                              : 'bg-red-950/40 text-red-400 border-red-500/30'
                          }`}
                        >
                          {variance}%
                        </div>

                        {!ai && (
                          <button
                            onClick={() => analyzeKPI(kpi.id)}
                            disabled={isAnalyzing === kpi.id}
                            className="text-xs bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <span>🧠</span>
                            {isAnalyzing === kpi.id ? 'Running...' : 'Run AI Analysis'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live AI Analysis Response Container */}
                    {ai && (
                      <div className="mt-2 bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold tracking-wide uppercase flex items-center gap-1.5 ${
                              ai.is_anomaly ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            <span>{ai.is_anomaly ? '⚠️' : '✅'}</span>
                            {ai.is_anomaly ? 'Statistical Anomaly Detected' : 'Standard Baseline Variance'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {ai.model}
                          </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed text-[13px]">
                          {ai.ai_insight}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                          <span>Risk Level: <strong className={ai.risk_level === 'High' ? 'text-rose-400' : 'text-emerald-400'}>{ai.risk_level}</strong></span>
                          <span>Variance: <strong>{ai.variance_percentage}%</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;