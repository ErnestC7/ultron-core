import React, { useState, useEffect } from 'react';

// --- SVG Icons for Sidebar ---
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const SingleInputIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const BulkUploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'single', 'bulk'

  // Data State
  const [kpis, setKpis] = useState([]);
  const [insights, setInsights] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(null);

  // Single Form State
  const [name, setName] = useState('');
  const [perspective, setPerspective] = useState('Financial');
  const [targetValue, setTargetValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [month, setMonth] = useState('Q1 2026');
  const [formMessage, setFormMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  // Bulk Import State
  const [csvData, setCsvData] = useState([]);
  const [bulkMessage, setBulkMessage] = useState({ text: '', isError: false });
  const [isBulkCommitting, setIsBulkCommitting] = useState(false);

  // --- API Calls ---
  const fetchKPIs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/kpis');
      const result = await response.json();
      if (result.success) setKpis(result.data);
    } catch (err) {
      console.error("Failed to connect to backend:", err);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const analyzeKPI = async (id) => {
    setIsAnalyzing(id);
    try {
      const response = await fetch(`http://localhost:5000/api/kpis/${id}/analyze`, { method: 'POST' });
      const result = await response.json();
      if (result.success) setInsights(prev => ({ ...prev, [id]: result.analysis }));
    } catch (err) {
      alert('Could not connect to AI microservice.');
    } finally {
      setIsAnalyzing(null);
    }
  };

  // --- Handlers: Single Entry ---
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage({ text: '', isError: false });

    if (!name || !targetValue || !actualValue) {
      setFormMessage({ text: 'Please fill out all required fields.', isError: true });
      return;
    }

    setLoading(true);
    const payload = { name, perspective, targetValue: parseFloat(targetValue), actualValue: parseFloat(actualValue), month };

    try {
      const response = await fetch('http://localhost:5000/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        setFormMessage({ text: `Metric "${name}" successfully recorded.`, isError: false });
        setName(''); setTargetValue(''); setActualValue('');
        fetchKPIs();
      } else {
        setFormMessage({ text: result.message, isError: true });
      }
    } catch (err) {
      setFormMessage({ text: 'Could not connect to backend server.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Bulk Import (CSV) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBulkMessage({ text: '', isError: false });
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const parsedData = [];
      // Start from index 1 to skip the header row
      for (let i = 1; i < lines.length; i++) {
        // Simple comma split (assumes no commas inside the actual text fields)
        const cols = lines[i].split(',');
        if (cols.length >= 5) {
          parsedData.push({
            name: cols[0].trim(),
            perspective: cols[1].trim(),
            targetValue: parseFloat(cols[2].trim()),
            actualValue: parseFloat(cols[3].trim()),
            month: cols[4].trim()
          });
        }
      }
      
      if (parsedData.length > 0) {
        setCsvData(parsedData);
      } else {
        setBulkMessage({ text: 'No valid data found. Ensure CSV has 5 columns.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  const handleBulkCommit = async () => {
    setIsBulkCommitting(true);
    setBulkMessage({ text: '', isError: false });

    let successCount = 0;
    
    // Process sequentially to not overwhelm the local server
    for (const kpi of csvData) {
      try {
        const response = await fetch('http://localhost:5000/api/kpis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kpi)
        });
        const res = await response.json();
        if (res.success) successCount++;
      } catch (err) {
        console.error("Failed to insert:", kpi.name);
      }
    }

    setBulkMessage({ text: `Successfully imported ${successCount} of ${csvData.length} metrics.`, isError: false });
    setCsvData([]); // Clear staging area
    setIsBulkCommitting(false);
    fetchKPIs(); // Refresh dashboard
    
    // Auto redirect to dashboard after 2 seconds
    setTimeout(() => setActiveTab('dashboard'), 2000);
  };

  // --- Layout Render ---
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR (Dark Green Institutional Design) */}
      <aside className="w-64 bg-green-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-green-800">
          <h1 className="text-xl font-bold tracking-tight">STRATEGIC CORE</h1>
          <p className="text-green-300 text-[10px] mt-1 font-medium uppercase tracking-wider">
            Performance Analytics
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition ${
              activeTab === 'dashboard' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'
            }`}
          >
            <DashboardIcon /> Scorecard Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('single')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition ${
              activeTab === 'single' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'
            }`}
          >
            <SingleInputIcon /> Add Single Metric
          </button>
          
          <button
            onClick={() => setActiveTab('bulk')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition ${
              activeTab === 'bulk' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/50'
            }`}
          >
            <BulkUploadIcon /> Bulk Import (CSV)
          </button>
        </nav>

        <div className="p-4 border-t border-green-800">
          <div className="flex items-center gap-2 text-xs text-green-300 font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Algorithmic Engine Active
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center z-10">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {activeTab === 'dashboard' && 'Institutional Scorecard Overview'}
            {activeTab === 'single' && 'Record Strategic Metric'}
            {activeTab === 'bulk' && 'Bulk Data Import Staging'}
          </h2>
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
            Senior Planning Officer
          </span>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {kpis.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white shadow-sm">
                  <p className="text-gray-500 font-medium">No performance records found.</p>
                  <button onClick={() => setActiveTab('single')} className="mt-4 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm transition">
                    Add Your First Metric
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {kpis.map((kpi) => {
                    const target = parseFloat(kpi.target_value ?? kpi.targetValue ?? 1);
                    const actual = parseFloat(kpi.actual_value ?? kpi.actualValue ?? 0);
                    const variance = ((actual / target) * 100).toFixed(1);
                    const ai = insights[kpi.id];

                    let badgeColor = 'bg-green-100 text-green-800 border-green-200';
                    if (parseFloat(variance) < 70) badgeColor = 'bg-red-100 text-red-800 border-red-200';
                    else if (parseFloat(variance) < 95) badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';

                    return (
                      <div key={kpi.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-gray-900">{kpi.name}</h3>
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                                {kpi.perspective}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 tabular-nums">
                              Target: <span className="font-semibold text-gray-900">{target}</span>
                              <span className="mx-2 text-gray-300">|</span>
                              Actual: <span className="font-semibold text-gray-900">{actual}</span>
                              <span className="mx-2 text-gray-300">|</span>
                              Cycle: <span className="text-gray-500">{kpi.month}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`px-2.5 py-1 rounded border text-xs font-bold tabular-nums ${badgeColor}`}>
                              {variance}%
                            </div>
                            {!ai && (
                              <button onClick={() => analyzeKPI(kpi.id)} disabled={isAnalyzing === kpi.id} className="text-xs bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium px-3 py-1.5 rounded transition">
                                {isAnalyzing === kpi.id ? 'Analyzing...' : 'Generate AI Audit'}
                              </button>
                            )}
                          </div>
                        </div>

                        {ai && (
                          <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-4 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold uppercase flex items-center gap-2 ${ai.is_anomaly ? 'text-red-700' : 'text-green-700'}`}>
                                <span className={`w-2 h-2 rounded-full ${ai.is_anomaly ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                {ai.is_anomaly ? 'Statistical Anomaly Detected' : 'Baseline Variance Acceptable'}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-[13px]">{ai.ai_insight}</p>
                            <div className="mt-2 text-[11px] text-gray-500">
                              Risk Level: <strong className={ai.risk_level === 'High' ? 'text-red-700' : 'text-gray-800'}>{ai.risk_level}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: SINGLE METRIC INJECTION */}
          {activeTab === 'single' && (
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <form onSubmit={handleSingleSubmit} className="space-y-5 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Metric Title</label>
                  <input type="text" className="w-full border border-gray-300 focus:border-green-700 rounded-md px-3 py-2 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">BSC Perspective</label>
                  <select className="w-full border border-gray-300 focus:border-green-700 rounded-md px-3 py-2 outline-none bg-white" value={perspective} onChange={(e) => setPerspective(e.target.value)}>
                    <option value="Financial">Financial</option>
                    <option value="Customer">Customer & Stakeholder</option>
                    <option value="Internal Processes">Internal Processes</option>
                    <option value="Learning & Growth">Learning & Growth</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Target</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 focus:border-green-700 rounded-md px-3 py-2 tabular-nums outline-none" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Actual</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 focus:border-green-700 rounded-md px-3 py-2 tabular-nums outline-none" value={actualValue} onChange={(e) => setActualValue(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Reporting Cycle</label>
                  <input type="text" className="w-full border border-gray-300 focus:border-green-700 rounded-md px-3 py-2 outline-none" value={month} onChange={(e) => setMonth(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-800 hover:bg-green-900 text-white font-medium py-2.5 rounded-md transition">
                  {loading ? 'Committing...' : 'Commit Record'}
                </button>
              </form>
              {formMessage.text && (
                <div className={`mt-4 p-3 rounded-md text-xs font-medium border ${formMessage.isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
                  {formMessage.text}
                </div>
              )}
            </div>
          )}

          {/* VIEW: BULK IMPORT */}
          {activeTab === 'bulk' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-2">Upload CSV File</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Ensure your Excel/CSV file has a header row and exactly 5 columns in this order: <br/>
                  <strong className="text-gray-700">Metric Title, Perspective, Target, Actual, Reporting Cycle</strong>
                </p>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition cursor-pointer"
                />
              </div>

              {/* Data Staging Area */}
              {csvData.length > 0 && (
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-800">Staging Area Preview ({csvData.length} Records)</h3>
                    <button 
                      onClick={handleBulkCommit} 
                      disabled={isBulkCommitting}
                      className="bg-green-800 hover:bg-green-900 text-white text-xs font-medium px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      {isBulkCommitting ? 'Committing Data...' : 'Approve & Commit All to Database'}
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-bold uppercase">Title</th>
                          <th className="px-4 py-2 font-bold uppercase">Perspective</th>
                          <th className="px-4 py-2 font-bold uppercase text-right">Target</th>
                          <th className="px-4 py-2 font-bold uppercase text-right">Actual</th>
                          <th className="px-4 py-2 font-bold uppercase">Cycle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {csvData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900">{row.name}</td>
                            <td className="px-4 py-2 text-gray-600">{row.perspective}</td>
                            <td className="px-4 py-2 text-gray-600 text-right tabular-nums">{row.targetValue}</td>
                            <td className="px-4 py-2 text-gray-600 text-right tabular-nums">{row.actualValue}</td>
                            <td className="px-4 py-2 text-gray-600">{row.month}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkMessage.text && (
                <div className={`p-3 rounded-md text-xs font-medium border ${bulkMessage.isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
                  {bulkMessage.text}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;