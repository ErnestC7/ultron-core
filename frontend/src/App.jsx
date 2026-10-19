import React, { useState, useEffect } from 'react';

// --- SVGs ---
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>;
const SingleInputIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const BulkUploadIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const BriefcaseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const DocumentTextIcon = () => <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth State
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authForm, setAuthForm] = useState({ username: '', password: '', role: 'admin', department: 'All' });
  const [authError, setAuthError] = useState('');

  // Performance Data State
  const [kpis, setKpis] = useState([]);
  const [insights, setInsights] = useState({});
  const [isAnalyzingKPI, setIsAnalyzingKPI] = useState(null);
  const [deptFilter, setDeptFilter] = useState('All Departments');

  // Work Plans State
  const [workPlans, setWorkPlans] = useState([]);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDept, setNewPlanDept] = useState('Human Resources');
  const [newPlanFile, setNewPlanFile] = useState(null);
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(null);

  // Single KPI Form State
  const [name, setName] = useState('');
  const [perspective, setPerspective] = useState('Financial');
  const [department, setDepartment] = useState('Human Resources');
  const [targetValue, setTargetValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [month, setMonth] = useState('Q1 2026');
  const [loading, setLoading] = useState(false);

  // Bulk Import State
  const [csvData, setCsvData] = useState([]);
  const [bulkMessage, setBulkMessage] = useState({ text: '', type: '' });
  const [isBulkCommitting, setIsBulkCommitting] = useState(false);

  // --- Auth Handlers ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';

    try {
      const response = await fetch(`https://ultron-backend-a9a3.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();

      if (data.success) {
        if (authMode === 'login') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setToken(data.token);
          setCurrentUser(data.user);
          setCurrentView('app');
        } else {
          setAuthMode('login');
          setAuthError('Registration complete. Sign in with your credentials.');
        }
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Unable to connect to authentication service.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  // --- KPI Handlers ---
  const fetchKPIs = async () => {
    if (!token) return;
    try {
      const response = await fetch('https://ultron-backend-a9a3.onrender.com/api/kpis', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setKpis(result.data);
    } catch (err) {
      console.error('Failed to retrieve performance metrics.');
    }
  };

  useEffect(() => {
    if (currentView === 'app' && token) {
      fetchKPIs();
      if (currentUser?.role !== 'admin') {
        setDeptFilter(currentUser.department);
      }
      if (currentUser?.role === 'manager') {
        setNewPlanDept(currentUser.department);
      }
    }
  }, [currentView, token]);

  const handleDeleteKPI = async (id) => {
    if (!window.confirm('Delete this KPI entry?')) return;
    try {
      await fetch(`https://ultron-backend-a9a3.onrender.com/api/kpis/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchKPIs();
    } catch (err) {
      alert('Failed to delete entry.');
    }
  };

  //  Single Submit with Error Alert ---
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetValue || !actualValue) return alert('Complete all metric inputs.');
    setLoading(true);
    const payload = {
      name,
      perspective,
      department,
      targetValue: parseFloat(targetValue),
      actualValue: parseFloat(actualValue),
      month
    };
    try {
      const response = await fetch('https://ultron-backend-a9a3.onrender.com/api/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!data.success) {
          alert("Database Error: " + data.message);
          return; 
      }

      setName('');
      setTargetValue('');
      setActualValue('');
      fetchKPIs();
      setActiveTab('dashboard');
      alert(" Success! Metric saved to database.");
      
    } catch (err) {
      alert("Network Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeKPI = async (id, aiChoice) => {
    setIsAnalyzingKPI(id);
    try {
      const kpiToAnalyze = kpis.find(k => k.id === id);
      const response = await fetch('https://ultron-ai-service-254w.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kpiToAnalyze.name,
          department: kpiToAnalyze.department,
          target_value: parseFloat(kpiToAnalyze.target_value),
          actual_value: parseFloat(kpiToAnalyze.actual_value),
          ai_choice: aiChoice
        })
      });
      const data = await response.json();
      setInsights(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      alert('AI analysis microservice unavailable.');
    } finally {
      setIsAnalyzingKPI(null);
    }
  };

  // --- Work Plan Handlers ---
  const handleAddWorkPlan = (e) => {
    e.preventDefault();
    if (!newPlanTitle || !newPlanFile) {
      return alert('Enter a plan title and attach a document.');
    }
    const newPlan = {
      id: Date.now(),
      title: newPlanTitle,
      department: newPlanDept,
      status: 'Not Started',
      deadline: 'TBD',
      fileObject: newPlanFile,
      fileName: newPlanFile.name,
      ai_insight: null,
      model: null
    };
    setWorkPlans([...workPlans, newPlan]);
    setNewPlanTitle('');
    setNewPlanFile(null);
    const fileInput = document.getElementById('workplan-file-input');
    if (fileInput) fileInput.value = '';
  };

  const updateWorkPlanStatus = (id, newStatus) => {
    setWorkPlans(workPlans.map(p => (p.id === id ? { ...p, status: newStatus } : p)));
  };

  const analyzeWorkPlanDocument = async (plan, aiChoice) => {
    setIsAnalyzingPlan(plan.id);
    try {
      const formData = new FormData();
      formData.append('title', plan.title);
      formData.append('department', plan.department);
      formData.append('status', plan.status);
      formData.append('file', plan.fileObject);
      formData.append('ai_choice', aiChoice);

      const response = await fetch('https://ultron-ai-service-254w.onrender.com/analyze' , {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setWorkPlans(workPlans.map(p => (p.id === plan.id ? { ...p, ai_insight: data.ai_insight, model: data.model } : p)));
    } catch (err) {
      alert('Document auditing service unavailable.');
    } finally {
      setIsAnalyzingPlan(null);
    }
  };

  // --- Bulk CSV Handlers ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.split('\n').filter(line => line.trim() !== '');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 6) {
          parsedData.push({
            name: cols[0].trim(),
            perspective: cols[1].trim(),
            department: cols[2].trim(),
            targetValue: parseFloat(cols[3].trim()),
            actualValue: parseFloat(cols[4].trim()),
            month: cols[5].trim()
          });
        }
      }
      setCsvData(parsedData);
      setBulkMessage({ text: `Parsed ${parsedData.length} records ready for commit.`, type: 'success' });
    };
    reader.readAsText(file);
  };

  // : Bulk Commit with Error Alert ---
  const handleBulkCommit = async () => {
    setIsBulkCommitting(true);
    let successCount = 0;
    let errorMsg = "";

    for (const kpi of csvData) {  
      try {
        const response = await fetch('https://ultron-backend-a9a3.onrender.com/api/kpis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(kpi)
        });
        
        const data = await response.json();
        if (!data.success) {
          errorMsg = data.message;
          break;
        }
        successCount++;
      } catch (err) {
        errorMsg = err.message;
        break;
      }
    }

    setIsBulkCommitting(false);
    
    if (errorMsg) {
      alert(`Database Error after saving ${successCount} records: ` + errorMsg);
    } else {
      alert(`Successfully saved ${successCount} metrics!`);
      setCsvData([]);
      fetchKPIs();
      setActiveTab('dashboard');
    }
  };

  const displayedKpis = deptFilter === 'All Departments' ? kpis : kpis.filter(k => (k.department || 'Unassigned') === deptFilter);

  // ==========================================
  // VIEW: LANDING
  // ==========================================
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 text-center">
          Strategic Planning System with AI
        </h1>
        <p className="text-gray-600 max-w-xl text-center mb-8">
          Aligning departmental execution with institutional vision through intelligent performance tracking.
        </p>
        <button
          onClick={() => setCurrentView(token ? 'app' : 'auth')}
          className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-full font-bold shadow-md transition"
        >
          {token ? 'Enter Dashboard' : 'Login'}
        </button>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATION
  // ==========================================
  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {authMode === 'login' ? 'System Login' : 'Provision Role Account'}
          </h2>
          <p className="text-xs text-gray-500 text-center mb-6">
            Authenticate to access the departmental performance data.
          </p>

          {authError && (
            <div className={`mb-4 p-3 text-xs rounded text-center font-medium border ${authError.includes('complete') ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username / Identifier</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded p-2.5 outline-none focus:border-green-700"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Access Password</label>
              <input
                type="password"
                required
                className="w-full border border-gray-300 rounded p-2.5 outline-none focus:border-green-700"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full border border-gray-300 rounded p-2 bg-white text-xs"
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                  >
                    <option value="admin">Administrator</option>
                    <option value="manager">Dept. Manager</option>
                    <option value="staff">Staff Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    className="w-full border border-gray-300 rounded p-2 bg-white text-xs"
                    value={authForm.department}
                    onChange={(e) => setAuthForm({ ...authForm, department: e.target.value })}
                  >
                    <option value="All">All (Admin)</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Academic Affairs">Academic Affairs</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-green-800 hover:bg-green-900 text-white p-2.5 rounded font-bold transition">
              {authMode === 'login' ? 'Authenticate' : 'Register Account'}
            </button>
          </form>

          <button
            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
            className="mt-4 text-xs text-green-700 hover:underline w-full text-center block"
          >
            {authMode === 'login' ? 'Need an account? Provision here' : 'Return to sign in'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD & WORK PLANS
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-green-900 text-white flex flex-col z-20">
        <div className="p-6 border-b border-green-800">
          <h1 className="text-xl font-bold tracking-tight">OPERATIONS HUB</h1>
          <div className="mt-3 bg-green-950/60 p-2.5 rounded border border-green-800 text-xs">
            <p className="text-green-300 truncate">User: {currentUser?.username}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-200 mt-0.5">
              Role: {currentUser?.role} | {currentUser?.department}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-sm transition ${activeTab === 'dashboard' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/40'}`}
          >
            <DashboardIcon /> Scorecard Dashboard
          </button>
          <button
            onClick={() => setActiveTab('workplans')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-sm transition ${activeTab === 'workplans' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/40'}`}
          >
            <BriefcaseIcon /> Dept. Work Plans
          </button>

          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('single')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-sm transition ${activeTab === 'single' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/40'}`}
              >
                <SingleInputIcon /> Add Metric
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-sm transition ${activeTab === 'bulk' ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/40'}`}
              >
                <BulkUploadIcon /> Bulk File Import
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-green-800">
          <button
            onClick={handleLogout}
            className="w-full flex justify-center items-center gap-2 text-xs py-2 bg-green-950 text-green-200 hover:text-white rounded transition"
          >
            <LogoutIcon /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
            {activeTab === 'dashboard' && 'Institutional Scorecard Metrics'}
            {activeTab === 'workplans' && 'Departmental Action Registry & Auditing'}
            {activeTab === 'single' && 'Register Performance Metric'}
            {activeTab === 'bulk' && 'Bulk Batch Data Ingestion'}
          </h2>
          <div className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded border border-green-200 font-semibold">
            Status: Dual AI Ready
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-gray-600">Department Scope:</span>
                <select
                  className="border border-gray-300 rounded px-2.5 py-1 text-xs outline-none bg-white disabled:bg-gray-100"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  disabled={currentUser?.role !== 'admin'}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="space-y-4">
                {displayedKpis.map(kpi => {
                  const target = parseFloat(kpi.target_value ?? 1);
                  const actual = parseFloat(kpi.actual_value ?? 0);
                  const variance = ((actual / target) * 100).toFixed(1);
                  const ai = insights[kpi.id];

                  return (
                    <div key={kpi.id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm text-gray-900">{kpi.name}</h3>
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold uppercase">
                              {kpi.department}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Target: <span className="font-semibold text-gray-800">{target}</span> | Actual: <span className="font-semibold text-gray-800">{actual}</span> | Cycle: {kpi.month}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs px-2.5 py-1 rounded font-bold border ${parseFloat(variance) < 70 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {variance}%
                          </span>

                          {currentUser?.role !== 'staff' && !ai && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => analyzeKPI(kpi.id, 'gemini')}
                                disabled={isAnalyzingKPI === kpi.id}
                                className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded transition"
                              >
                                {isAnalyzingKPI === kpi.id ? 'Auditing...' : 'Audit with Gemini'}
                              </button>
                              <button
                                onClick={() => analyzeKPI(kpi.id, 'deepseek')}
                                disabled={isAnalyzingKPI === kpi.id}
                                className="text-[11px] bg-gray-900 text-white hover:bg-black px-2.5 py-1 rounded transition"
                              >
                                {isAnalyzingKPI === kpi.id ? 'Auditing...' : 'Audit with DeepSeek'}
                              </button>
                            </div>
                          )}

                          {currentUser?.role === 'admin' && (
                            <button onClick={() => handleDeleteKPI(kpi.id)} className="text-gray-400 hover:text-red-600 p-1">
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </div>

                      {ai && (
                        <div className="mt-3.5 bg-gray-50 border border-gray-200 p-3.5 rounded text-xs whitespace-pre-wrap leading-relaxed">
                          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-200 font-bold text-gray-700">
                            <span>Strategic Analysis</span>
                            <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">
                              {ai.model}
                            </span>
                          </div>
                          {ai.ai_insight}
                        </div>
                      )}
                    </div>
                  );
                })}

                {displayedKpis.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400 bg-white border border-dashed rounded">
                    No metrics recorded for the active scope.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WORK PLANS */}
          {activeTab === 'workplans' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3">Register Work Plan & Document</h3>
                  <form onSubmit={handleAddWorkPlan} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="Action title"
                        className="w-full border border-gray-300 rounded p-2 text-xs outline-none focus:border-green-700"
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Department</label>
                      <select
                        className="w-full border border-gray-300 rounded p-2 text-xs bg-white disabled:bg-gray-100"
                        value={newPlanDept}
                        onChange={(e) => setNewPlanDept(e.target.value)}
                        disabled={currentUser?.role !== 'admin'}
                      >
                        <option value="Human Resources">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Academic Affairs">Academic Affairs</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">File Attachment</label>
                      <input
                        id="workplan-file-input"
                        type="file"
                        accept=".pdf, .docx, .xlsx, .csv, .txt, .pptx, .zip, .jpg, .png"
                        onChange={(e) => setNewPlanFile(e.target.files[0])}
                        className="w-full border border-gray-300 rounded p-1 text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-xs"
                      />
                    </div>
                    <button type="submit" className="bg-green-800 hover:bg-green-900 text-white font-bold py-2 rounded text-xs transition">
                      Upload Initiative
                    </button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {['Not Started', 'In Progress', 'Completed'].map(statusGroup => (
                  <div key={statusGroup} className="bg-gray-100/70 border border-gray-200 p-4 rounded-lg min-h-[450px]">
                    <h4 className="text-xs font-bold text-gray-600 uppercase mb-3 pb-2 border-b border-gray-200">
                      {statusGroup}
                    </h4>

                    {workPlans
                      .filter(p => p.status === statusGroup && (currentUser?.role === 'admin' || p.department === currentUser?.department))
                      .map(plan => (
                        <div key={plan.id} className="bg-white p-4 rounded border border-gray-200 shadow-sm text-xs mb-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-900">{plan.title}</span>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                              <select
                                className="text-[10px] border border-gray-300 rounded px-1 py-0.5 outline-none bg-white"
                                value={plan.status}
                                onChange={(e) => updateWorkPlanStatus(plan.id, e.target.value)}
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </div>

                          <div className="text-[11px] text-gray-500 break-all flex items-center gap-1 bg-gray-50 p-1.5 rounded">
                            <DocumentTextIcon /> {plan.fileName}
                          </div>

                          {currentUser?.role !== 'staff' && !plan.ai_insight && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                onClick={() => analyzeWorkPlanDocument(plan, 'gemini')}
                                disabled={isAnalyzingPlan === plan.id}
                                className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 py-1 rounded hover:bg-blue-100 transition"
                              >
                                {isAnalyzingPlan === plan.id ? 'Auditing...' : 'Gemini Audit'}
                              </button>
                              <button
                                onClick={() => analyzeWorkPlanDocument(plan, 'deepseek')}
                                disabled={isAnalyzingPlan === plan.id}
                                className="text-[10px] bg-gray-900 text-white py-1 rounded hover:bg-black transition"
                              >
                                {isAnalyzingPlan === plan.id ? 'Auditing...' : 'DeepSeek Audit'}
                              </button>
                            </div>
                          )}

                          {plan.ai_insight && (
                            <div className="mt-2 bg-indigo-50/70 border border-indigo-100 p-2.5 rounded text-[11px] text-indigo-950 whitespace-pre-wrap leading-relaxed">
                              <div className="font-bold text-indigo-900 mb-1 border-b border-indigo-200 pb-0.5">
                                {plan.model} Document Audit
                              </div>
                              {plan.ai_insight}
                            </div>
                          )}
                        </div>
                      ))}

                    {workPlans.filter(p => p.status === statusGroup && (currentUser?.role === 'admin' || p.department === currentUser?.department)).length === 0 && (
                      <p className="text-center text-xs text-gray-400 py-8">No initiatives under this stage.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SINGLE METRIC */}
          {activeTab === 'single' && currentUser?.role === 'admin' && (
            <div className="max-w-xl mx-auto bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Metric Title</label>
                  <input
                    type="text"
                    required
                    className="w-full border rounded p-2 outline-none focus:border-green-700"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Perspective</label>
                    <select
                      className="w-full border rounded p-2 bg-white"
                      value={perspective}
                      onChange={(e) => setPerspective(e.target.value)}
                    >
                      <option value="Financial">Financial</option>
                      <option value="Customer">Customer</option>
                      <option value="Internal Processes">Internal Processes</option>
                      <option value="Learning & Growth">Learning & Growth</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Department</label>
                    <select
                      className="w-full border rounded p-2 bg-white"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Academic Affairs">Academic Affairs</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Target</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full border rounded p-2 outline-none"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Actual</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full border rounded p-2 outline-none"
                      value={actualValue}
                      onChange={(e) => setActualValue(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Reporting Cycle</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2 outline-none"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-800 hover:bg-green-900 text-white font-bold p-2.5 rounded transition">
                  {loading ? 'Committing...' : 'Commit Record'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BULK CSV */}
          {activeTab === 'bulk' && currentUser?.role === 'admin' && (
            <div className="max-w-xl mx-auto bg-white border border-gray-200 p-8 rounded-lg shadow-sm text-center">
              <p className="text-xs text-gray-600 mb-4">
                Upload a structured <strong>.csv</strong> file (Title, Perspective, Department, Target, Actual, Cycle).
              </p>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="text-xs file:py-1 file:px-3 file:border-0 file:rounded file:bg-gray-100 mb-4" />
              {bulkMessage.text && <p className="text-xs text-green-700 mb-4">{bulkMessage.text}</p>}
              {csvData.length > 0 && (
                <button onClick={handleBulkCommit} disabled={isBulkCommitting} className="w-full bg-green-800 text-white text-xs font-bold py-2 rounded">
                  {isBulkCommitting ? 'Writing...' : `Commit ${csvData.length} Metrics`}
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;