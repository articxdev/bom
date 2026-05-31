export function getDashboardHTML() {
return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Production Management</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<style>
:root {
  --bg: #0f1117;
  --surface: #1a1d27;
  --card: #21253a;
  --accent: #3b82f6;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --text: #e2e8f0;
  --muted: #64748b;
  --border: #2d3150;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(0,0,0,.3);
  --sidebar-w: 240px;
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height:1.5;
  overflow-x:hidden;
  min-height:100vh;
}
.mono { font-family: 'JetBrains Mono', monospace; }
::-webkit-scrollbar { width:6px; }
::-webkit-scrollbar-track { background:var(--surface); }
::-webkit-scrollbar-thumb { background:var(--muted); border-radius:3px; }

/* Login */
#login-screen {
  position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
  background:var(--bg); z-index:9999;
}
#login-screen.hidden { display:none; }
.login-card {
  background:var(--card); border-radius:var(--radius); padding:40px;
  width:360px; max-width:90vw; box-shadow:var(--shadow);
  border:1px solid var(--border);
}
.login-card h1 {
  font-size:24px; font-weight:700; text-align:center; margin-bottom:4px;
}
.login-card .sub { color:var(--muted); text-align:center; margin-bottom:24px; font-size:14px; }
.login-card label { display:block; font-size:13px; color:var(--muted); margin-bottom:4px; margin-top:16px; }
.login-card input,.login-card select {
  width:100%; padding:10px 12px; border-radius:var(--radius-sm);
  background:var(--surface); border:1px solid var(--border); color:var(--text);
  font-size:14px; outline:none; transition:border-color .2s;
}
.login-card input:focus,.login-card select:focus { border-color:var(--accent); }
.login-card button {
  width:100%; margin-top:24px; padding:12px; border-radius:var(--radius-sm);
  border:none; background:var(--accent); color:#fff; font-size:15px; font-weight:600;
  cursor:pointer; transition:opacity .2s;
}
.login-card button:hover { opacity:.85; }
.login-card button:disabled { opacity:.5; cursor:not-allowed; }
.login-error { color:var(--danger); font-size:13px; text-align:center; margin-top:8px; display:none; }

/* App layout */
#app { display:flex; min-height:100vh; }
#app.hidden { display:none; }

/* Sidebar */
#sidebar {
  width:var(--sidebar-w); background:var(--surface); border-right:1px solid var(--border);
  display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0;
  z-index:100; transition:transform .3s ease;
}
#sidebar.collapsed { transform:translateX(-100%); }
.sidebar-header {
  padding:20px 16px; border-bottom:1px solid var(--border); display:flex;
  align-items:center; gap:10px; font-weight:700; font-size:16px;
}
.sidebar-header .logo { color:var(--accent); }
.sidebar-nav { flex:1; overflow-y:auto; padding:8px; }
.nav-item {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  border-radius:var(--radius-sm); cursor:pointer; transition:all .15s;
  font-size:14px; color:var(--muted); text-decoration:none;
}
.nav-item:hover { background:var(--card); color:var(--text); }
.nav-item.active { background:var(--accent); color:#fff; }
.nav-item .icon { width:18px; height:18px; flex-shrink:0; }
.sidebar-footer { padding:12px 16px; border-top:1px solid var(--border); }
.nav-item.logout { color:var(--danger); }
.nav-item.logout:hover { background:rgba(239,68,68,.1); }

/* Topbar */
#topbar {
  position:fixed; top:0; left:var(--sidebar-w); right:0; height:56px;
  background:var(--surface); border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; z-index:99; transition:left .3s ease;
}
#sidebar.collapsed ~ #topbar { left:0; }
#topbar .left { display:flex; align-items:center; gap:12px; }
#topbar .menu-btn {
  background:none; border:none; color:var(--text); cursor:pointer;
  display:none; padding:4px;
}
#topbar .menu-btn .icon { width:20px; height:20px; }
#topbar .page-title { font-size:16px; font-weight:600; }
#topbar .right { display:flex; align-items:center; gap:16px; font-size:13px; color:var(--muted); }
#topbar .right .role-badge {
  padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600;
  text-transform:uppercase;
}
.role-badge.admin { background:rgba(59,130,246,.15); color:var(--accent); }
.role-badge.operator { background:rgba(245,158,11,.15); color:var(--warning); }

/* Main content */
#main-content {
  margin-left:var(--sidebar-w); margin-top:56px; padding:24px;
  flex:1; transition:margin-left .3s ease; min-height:calc(100vh - 56px);
}
#sidebar.collapsed ~ #main-content { margin-left:0; }

/* Page fade */
.page { animation:fadeIn .25s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }

/* Skeleton */
.skeleton {
  background:linear-gradient(90deg,var(--card) 25%,var(--surface) 50%,var(--card) 75%);
  background-size:400px 100%; animation:shimmer 1.5s infinite; border-radius:var(--radius-sm);
}

/* Cards */
.card {
  background:var(--card); border:1px solid var(--border); border-radius:var(--radius);
  padding:20px; transition:box-shadow .2s;
}
.card:hover { box-shadow:var(--shadow); }
.card-stat {
  padding:20px; display:flex; flex-direction:column;
}
.card-stat .label { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.card-stat .value {
  font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:700;
  margin-top:4px;
}
.card-stat .change { font-size:12px; margin-top:4px; }
.card-stat .change.up { color:var(--success); }
.card-stat .change.down { color:var(--danger); }

/* Grid */
.grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }

/* Badge */
.badge {
  display:inline-flex; align-items:center; padding:2px 10px; border-radius:20px;
  font-size:11px; font-weight:600;
}
.badge.ok { background:rgba(34,197,94,.15); color:var(--success); }
.badge.low { background:rgba(245,158,11,.15); color:var(--warning); }
.badge.critical { background:rgba(239,68,68,.15); color:var(--danger); }

/* Table */
.table-wrap { overflow-x:auto; }
table {
  width:100%; border-collapse:collapse; font-size:13px;
}
thead th {
  text-align:left; padding:10px 12px; font-weight:600; font-size:11px;
  text-transform:uppercase; letter-spacing:.5px; color:var(--muted);
  border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--card);
}
tbody td { padding:10px 12px; border-bottom:1px solid var(--border); }
tbody tr:hover td { background:rgba(59,130,246,.04); }
.action-btn {
  background:none; border:none; color:var(--muted); cursor:pointer;
  padding:4px; border-radius:4px; transition:all .15s;
}
.action-btn:hover { color:var(--text); background:var(--surface); }
.action-btn.danger:hover { color:var(--danger); background:rgba(239,68,68,.1); }
.action-btn.success:hover { color:var(--success); background:rgba(34,197,94,.1); }

/* Buttons */
.btn {
  display:inline-flex; align-items:center; gap:6px; padding:8px 16px;
  border-radius:var(--radius-sm); border:1px solid var(--border); cursor:pointer;
  font-size:13px; font-weight:500; transition:all .15s; background:var(--surface); color:var(--text);
}
.btn:hover { background:var(--card); border-color:var(--muted); }
.btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
.btn-primary:hover { opacity:.85; }
.btn-success { background:var(--success); color:#fff; border-color:var(--success); }
.btn-success:hover { opacity:.85; }
.btn-danger { background:var(--danger); color:#fff; border-color:var(--danger); }
.btn-danger:hover { opacity:.85; }
.btn-warning { background:var(--warning); color:#fff; border-color:var(--warning); }
.btn-warning:hover { opacity:.85; }
.btn-ghost { background:transparent; border-color:transparent; color:var(--muted); }
.btn-ghost:hover { background:var(--surface); color:var(--text); }
.btn-sm { padding:5px 10px; font-size:12px; }

/* Inputs */
input,select,textarea {
  padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);
  background:var(--surface); color:var(--text); font-size:13px; outline:none;
  font-family:inherit; transition:border-color .15s; width:100%;
}
input:focus,select:focus,textarea:focus { border-color:var(--accent); }
textarea { resize:vertical; min-height:60px; }
label { display:block; font-size:12px; color:var(--muted); margin-bottom:4px; font-weight:500; }
.form-group { margin-bottom:14px; }

/* Section header */
.section-header {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:20px; flex-wrap:wrap; gap:12px;
}
.section-header h2 { font-size:20px; font-weight:600; }
.section-header .sub { color:var(--muted); font-size:13px; }

/* Tabs */
.tabs {
  display:flex; gap:4px; margin-bottom:20px; background:var(--surface);
  padding:4px; border-radius:var(--radius-sm); width:fit-content;
}
.tab {
  padding:8px 16px; border-radius:6px; cursor:pointer; font-size:13px;
  color:var(--muted); transition:all .15s; border:none; background:none; font-family:inherit;
}
.tab:hover { color:var(--text); }
.tab.active { background:var(--accent); color:#fff; }

/* Progress bar */
.progress-bar {
  height:10px; background:var(--surface); border-radius:5px; overflow:hidden; margin:4px 0;
}
.progress-bar .fill {
  height:100%; border-radius:5px; transition:width .6s ease;
}
.progress-bar .fill.green { background:var(--success); }
.progress-bar .fill.yellow { background:var(--warning); }
.progress-bar .fill.red { background:var(--danger); }
.progress-bar .fill.blue { background:var(--accent); }

/* Modal */
#modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:1000;
  display:flex; align-items:center; justify-content:center;
  opacity:0; pointer-events:none; transition:opacity .2s;
}
#modal-overlay.open { opacity:1; pointer-events:all; }
#modal-overlay .modal {
  background:var(--card); border-radius:var(--radius); border:1px solid var(--border);
  width:520px; max-width:calc(100vw - 32px); max-height:calc(100vh - 32px);
  box-shadow:var(--shadow); display:flex; flex-direction:column;
  animation:slideUp .2s ease;
}
.modal-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; border-bottom:1px solid var(--border);
}
.modal-header h3 { font-size:16px; font-weight:600; }
.modal-close {
  background:none; border:none; color:var(--muted); cursor:pointer; padding:4px;
  border-radius:4px; display:flex;
}
.modal-close:hover { color:var(--text); background:var(--surface); }
.modal-body { padding:20px; overflow-y:auto; flex:1; }
.modal-footer {
  display:flex; justify-content:flex-end; gap:8px;
  padding:16px 20px; border-top:1px solid var(--border);
}

/* Toast */
#toast-container {
  position:fixed; bottom:20px; right:20px; z-index:9999; display:flex;
  flex-direction:column; gap:8px; pointer-events:none;
}
.toast {
  padding:12px 16px; border-radius:var(--radius-sm); font-size:13px;
  box-shadow:var(--shadow); display:flex; align-items:center; gap:8px;
  animation:slideUp .2s ease; pointer-events:all; max-width:380px;
  border:1px solid var(--border);
}
.toast.success { background:rgba(34,197,94,.12); border-color:var(--success); color:var(--success); }
.toast.error { background:rgba(239,68,68,.12); border-color:var(--danger); color:var(--danger); }
.toast.warning { background:rgba(245,158,11,.12); border-color:var(--warning); color:var(--warning); }
.toast.info { background:rgba(59,130,246,.12); border-color:var(--accent); color:var(--accent); }
.toast .icon { width:16px; height:16px; flex-shrink:0; }

/* Chart containers */
.chart-wrap {
  background:var(--card); border:1px solid var(--border); border-radius:var(--radius);
  padding:16px; position:relative;
}
.chart-wrap canvas { max-height:300px; max-width:100%; }

/* Product card */
.product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
.product-card {
  background:var(--card); border:1px solid var(--border); border-radius:var(--radius);
  padding:20px; transition:box-shadow .2s;
}
.product-card:hover { box-shadow:var(--shadow); }
.product-card h3 { font-size:16px; font-weight:600; margin-bottom:12px; }
.product-card .stat-row { display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; }
.product-card .stat-row .lbl { color:var(--muted); }
.product-card .actions { display:flex; gap:6px; margin-top:12px; flex-wrap:wrap; }

/* Summary card */
.summary-card {
  background:var(--card); border:1px solid var(--border); border-radius:var(--radius);
  padding:16px; margin-bottom:12px;
}
.summary-card .bar-row { display:flex; align-items:center; gap:12px; margin-top:8px; }
.summary-card .bar-label { font-size:12px; color:var(--muted); min-width:60px; }
.summary-card .bar-fill { flex:1; }

/* Filter bar */
.filter-bar {
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  margin-bottom:20px; padding:12px 16px; background:var(--surface);
  border-radius:var(--radius-sm); border:1px solid var(--border);
}
.filter-bar input,.filter-bar select { width:auto; min-width:140px; }

/* Responsive */
@media(max-width:1024px) {
  .grid-4 { grid-template-columns:repeat(2,1fr); }
  .grid-3 { grid-template-columns:repeat(2,1fr); }
  .grid-2 { grid-template-columns:1fr; }
}
@media(max-width:768px) {
  #sidebar { transform:translateX(-100%); }
  #sidebar.open { transform:translateX(0); }
  #topbar { left:0; }
  #topbar .menu-btn { display:flex; }
  #main-content { margin-left:0; padding:16px; }
  .grid-4 { grid-template-columns:1fr; }
  .grid-3 { grid-template-columns:1fr; }
  .filter-bar { flex-direction:column; align-items:stretch; }
  .filter-bar input,.filter-bar select { width:100%; }
  .tabs { overflow-x:auto; width:100%; }
}
</style>
</head>
<body>

<div id="login-screen">
  <div class="login-card">
    <h1>🏭 Production</h1>
    <p class="sub">Management System</p>
    <label>PIN</label>
    <input type="password" id="login-pin" placeholder="Enter PIN" maxlength="10" inputmode="numeric" autocomplete="off">
    <label>Role</label>
    <select id="login-role">
      <option value="admin">Admin</option>
      <option value="operator">Operator</option>
    </select>
    <button id="login-btn" onclick="handleLogin()">Sign In</button>
    <div class="login-error" id="login-error"></div>
  </div>
</div>

<div id="app" class="hidden">

<nav id="sidebar">
  <div class="sidebar-header"><span class="logo">🏭</span> ProdManager</div>
  <div class="sidebar-nav" id="sidebar-nav"></div>
  <div class="sidebar-footer">
    <div class="nav-item logout" onclick="handleLogout()">🚪 Sign Out</div>
  </div>
</nav>

<header id="topbar">
  <div class="left">
    <button class="menu-btn" onclick="toggleSidebar()" id="menu-btn" data-lucide="menu"></button>
    <span class="page-title" id="page-title">Dashboard</span>
  </div>
  <div class="right">
    <span id="topbar-date"></span>
    <span class="role-badge" id="role-badge">admin</span>
  </div>
</header>

<main id="main-content">
  <div id="page-content"></div>
</main>

</div>

<div id="modal-overlay" onclick="if(event.target===this)hideModal()">
  <div class="modal" id="modal-content"></div>
</div>

<div id="toast-container"></div>

<script>
// ============== STATE ==============
const state = {
  token: localStorage.getItem('pm_token') || null,
  role: localStorage.getItem('pm_role') || null,
  page: 'dashboard',
  settings: null,
  products: [],
  components: [],
  charts: {}
};

const navItems = [
  { id:'dashboard', label:'Dashboard', icon:'layout-dashboard' },
  { id:'production', label:'Daily Production', icon:'clipboard-list' },
  { id:'products', label:'Products', icon:'package' },
  { id:'components', label:'Components', icon:'cog' },
  { id:'stock', label:'Stock', icon:'warehouse' },
  { id:'faults', label:'Faults', icon:'alert-triangle' },
  { id:'dispatch', label:'Dispatch', icon:'truck' },
  { id:'reports', label:'Reports', icon:'bar-chart-3' },
  { id:'settings', label:'Settings', icon:'settings' }
];

// ============== API HELPER ==============
async function api(method, path, body) {
  const headers = { 'Content-Type':'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (path.includes('/export')) {
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error||'Export failed'); }
    return res;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed ('+res.status+')');
  return data;
}

// ============== AUTH ==============
async function handleLogin() {
  const pin = document.getElementById('login-pin').value;
  const role = document.getElementById('login-role').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!pin) { errEl.textContent='Enter PIN'; errEl.style.display='block'; return; }
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  try {
    const res = await api('POST','/api/auth/login',{pin,role});
    state.token = res.token;
    state.role = res.role;
    localStorage.setItem('pm_token', res.token);
    localStorage.setItem('pm_role', res.role);
    showApp();
  } catch(e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
  btn.disabled = false;
  btn.textContent = 'Sign In';
}

async function handleLogout() {
  try { await api('POST','/api/auth/logout'); } catch(e) {}
  state.token = null;
  state.role = null;
  localStorage.removeItem('pm_token');
  localStorage.removeItem('pm_role');
  destroyCharts();
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

// ============== UI HELPERS ==============
async function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('role-badge').textContent = state.role;
  document.getElementById('role-badge').className = 'role-badge '+state.role;
  renderSidebar();
  updateTopbarDate();
  // Load settings, products, components eagerly
  try {
    state.settings = await api('GET','/api/settings');
    updateTopbarDate();
  } catch(e) {}
  try {
    state.products = await api('GET','/api/products');
    state.components = await api('GET','/api/components');
  } catch(e) {}
  navigate(getPageFromHash());
  window.addEventListener('hashchange', ()=>{
    const p = getPageFromHash();
    if (p !== state.page) navigate(p);
  });
  window.addEventListener('resize', ()=>{
    if (window.innerWidth>768) document.getElementById('sidebar').classList.remove('open');
  });
}

function getPageFromHash() {
  const h = location.hash.slice(1) || 'dashboard';
  return navItems.find(n=>n.id===h) ? h : 'dashboard';
}

function renderSidebar() {
  const el = document.getElementById('sidebar-nav');
  el.innerHTML = navItems.map(n=>\`
    <a class="nav-item \${n.id===state.page?'active':''}" href="#\${n.id}" onclick="navigate('\${n.id}')">
      <i data-lucide="\${n.icon}" class="icon"></i>
      \${n.label}
    </a>\`).join('');
  lucide.createIcons();
}

function navigate(page) {
  state.page = page;
  location.hash = page;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.getAttribute('href')==='#'+page));
  const title = navItems.find(n=>n.id===page)?.label||'Dashboard';
  document.getElementById('page-title').textContent = title;
  const renderMap = {
    dashboard: renderDashboard,
    production: renderProduction,
    products: renderProducts,
    components: renderComponents,
    stock: renderStock,
    faults: renderFaults,
    dispatch: renderDispatch,
    reports: renderReports,
    settings: renderSettings
  };
  destroyCharts();
  const fn = renderMap[page] || renderDashboard;
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="skeleton" style="height:200px;margin-bottom:16px"></div><div class="skeleton" style="height:200px"></div>';
  Promise.resolve(fn()).catch(e=>{
    showToast(e.message,'error');
    content.innerHTML = '<div style="text-align:center;padding:60px;color:var(--muted)">Error loading page</div>';
  });
  if (window.innerWidth<=768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function updateTopbarDate() {
  const opts = state.settings?{timeZone:state.settings.timezone}:{};
  document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-IN',{
    weekday:'short',day:'2-digit',month:'short',year:'numeric',...opts
  });
}

// ============== MODAL ==============
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}
function hideModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ============== TOAST ==============
function showToast(msg, type='info', duration=3000) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast '+type;
  t.innerHTML = '<i data-lucide="'+(type==='success'?'check-circle':type==='error'?'x-circle':type==='warning'?'alert-triangle':'info')+'" class="icon"></i> '+msg;
  c.appendChild(t);
  lucide.createIcons();
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, duration);
}

// ============== CHARTS ==============
function destroyCharts() {
  Object.values(state.charts).forEach(c=>{ try{c.destroy()}catch(e){} });
  state.charts = {};
}

const chartDefaults = {
  color: '#64748b',
  borderColor: '#2d3150',
  font: { family:'Inter' }
};

// ============== DASHBOARD ==============
async function renderDashboard() {
  const el = document.getElementById('page-content');
  el.innerHTML = '<div class="grid-4" id="dash-stats"></div><div class="grid-2" style="margin-top:16px"><div class="chart-wrap" id="dash-line-wrap"><canvas id="dash-line-chart"></canvas></div><div class="chart-wrap" id="dash-doughnut-wrap"><canvas id="dash-doughnut-chart"></canvas></div></div><div class="grid-2" style="margin-top:16px"><div class="card" id="dash-table-wrap"><h3 style="font-size:15px;font-weight:600;margin-bottom:12px">Today\'s Production</h3><div class="table-wrap"><table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Shift</th></tr></thead><tbody id="dash-table-body"></tbody></table></div></div><div class="card" id="dash-alerts-wrap"><h3 style="font-size:15px;font-weight:600;margin-bottom:12px">Stock Alerts</h3><div id="dash-alerts-list"></div></div></div>';

  let data;
  try { data = await api('GET','/api/dashboard'); } catch(e) { showToast(e.message,'error'); return; }

  // Stat cards
  const statCards = [
    { label:'Today', value:data.today.total, change: data.today.change !== null ? {val:data.today.change, dir: data.today.change>=0?'up':'down'} : null },
    { label:'This Week', value:data.week.total, change: null },
    { label:'This Month', value:data.month.total, change: null },
    { label:'Lifetime', value:data.totalLifetime, change: null }
  ];
  document.getElementById('dash-stats').innerHTML = statCards.map(s=>\`
    <div class="card card-stat">
      <div class="label">\${s.label}</div>
      <div class="value"><span class="counter" data-target="\${s.value}">0</span></div>
      \${s.change?'<div class="change '+s.change.dir+'">'+s.change.val+'% vs yesterday</div>':''}
    </div>\`).join('');
  animateCounters();

  // Today's production table
  const todayData = data.today;
  if (todayData.byProduct && todayData.byProduct.length) {
    const tbody = document.getElementById('dash-table-body');
    const prodList = todayData.byProduct;
    const shiftMap = {};
    if (todayData.byShift) todayData.byShift.forEach(s=>shiftMap[s.shift]=s.qty);
    tbody.innerHTML = prodList.map(p=>\`
      <tr><td>Today</td><td>\${p.product}</td><td class="mono">\${p.qty}</td><td>\${Object.entries(shiftMap).filter(([s])=>todayData.byShift?.find(bs=>bs.shift===s)).map(([s,q])=>s+': '+q).join(', ')}</td></tr>\`).join('');
  }

  // Stock alerts
  document.getElementById('dash-alerts-list').innerHTML = data.stockAlerts.length
    ? data.stockAlerts.map(a=>\`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span>\${a.component}</span>
      <span><span class="mono">\${a.stock}</span> / \${a.min} <span class="badge \${a.status.toLowerCase()}">\${a.status}</span></span>
    </div>\`).join('')
    : '<div style="color:var(--muted);font-size:13px;padding:8px 0">All stock levels OK</div>';

  // Charts
  setTimeout(()=>{
    const lineCtx = document.getElementById('dash-line-chart');
    if (lineCtx && data.week.daily) {
      state.charts.line = new Chart(lineCtx, {
        type:'line',
        data:{
          labels: data.week.daily.map(d=>d.date.slice(5)),
          datasets: [{
            label:'Production',
            data: data.week.daily.map(d=>d.total),
            borderColor:'#3b82f6',
            backgroundColor:'rgba(59,130,246,.1)',
            fill:true,
            tension:.3,
            pointRadius:3,
            pointBackgroundColor:'#3b82f6'
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:true,
          plugins:{ legend:{ display:false } },
          scales:{
            x:{ ticks:{ color:'#64748b',font:{size:11} },grid:{color:'#2d3150'} },
            y:{ ticks:{ color:'#64748b',font:{size:11} },grid:{color:'#2d3150'},beginAtZero:true }
          }
        }
      });
    }
    const doughnutCtx = document.getElementById('dash-doughnut-chart');
    if (doughnutCtx && todayData.byProduct && todayData.byProduct.length) {
      const colors = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
      state.charts.doughnut = new Chart(doughnutCtx, {
        type:'doughnut',
        data:{
          labels: todayData.byProduct.map(p=>p.product),
          datasets: [{
            data: todayData.byProduct.map(p=>p.qty),
            backgroundColor: colors.slice(0,todayData.byProduct.length),
            borderWidth:0
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:true,
          plugins:{
            legend:{ position:'bottom',labels:{color:'#e2e8f0',font:{size:11},padding:12} }
          },
          cutout:'65%'
        }
      });
    }
  }, 100);
}

function animateCounters() {
  document.querySelectorAll('.counter').forEach(el=>{
    const target = parseInt(el.dataset.target);
    const duration = 1500;
    const start = performance.now();
    function tick(now) {
      const pct = Math.min((now-start)/duration, 1);
      el.textContent = Math.floor(pct*target).toLocaleString();
      if (pct<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ============== PRODUCTION ==============
async function renderProduction() {
  const el = document.getElementById('page-content');
  const today = dateStr(new Date());
  el.innerHTML = \`
    <div class="section-header">
      <div><h2>Daily Production</h2></div>
      <button class="btn btn-primary" onclick="showProductionModal()">+ Log Production</button>
    </div>
    <div class="filter-bar">
      <input type="date" id="prod-date" value="\${today}" onchange="renderProduction()">
      <div class="tabs" id="prod-shift-tabs">
        <button class="tab active" data-shift="" onclick="setProdShift(this)">All</button>
        <button class="tab" data-shift="Morning" onclick="setProdShift(this)">Morning</button>
        <button class="tab" data-shift="Evening" onclick="setProdShift(this)">Evening</button>
        <button class="tab" data-shift="Night" onclick="setProdShift(this)">Night</button>
      </div>
    </div>
    <div class="card" style="overflow:hidden;padding:0">
      <div class="table-wrap"><table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Shift</th><th>Faults</th><th>Note</th><th>Actions</th></tr></thead><tbody id="prod-table-body"></tbody></table></div>
    </div>
    <div id="prod-summary" style="margin-top:16px"></div>\`;
  await loadProductionTable();
}

let prodShiftFilter = '';

function setProdShift(el) {
  document.querySelectorAll('#prod-shift-tabs .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  prodShiftFilter = el.dataset.shift;
  loadProductionTable();
}

async function loadProductionTable() {
  const date = document.getElementById('prod-date').value;
  if (!date) return;
  let entries;
  try { entries = await api('GET','/api/production?date='+date); } catch(e) { showToast(e.message,'error'); return; }
  if (prodShiftFilter) entries = entries.filter(e=>e.shift===prodShiftFilter);
  const tbody = document.getElementById('prod-table-body');
  if (!entries.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No entries</td></tr>'; }
  else {
    tbody.innerHTML = entries.sort((a,b)=>a.time.localeCompare(b.time)).map(e=>\`
      <tr>
        <td class="mono">\${e.time}</td>
        <td>\${e.product}</td>
        <td class="mono">\${e.qty}</td>
        <td>\${e.shift}</td>
        <td>\${(e.faults||[]).length ? e.faults.map(f=>f.component+':'+f.qty).join(', ') : '-'}</td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis">\${e.note||'-'}</td>
        <td><button class="action-btn danger" onclick="deleteProduction('\${e.id}')" title="Delete" data-lucide="trash-2"></button></td>
      </tr>\`).join('');
    lucide.createIcons();
  }
  // Per-product summary
  const products = await api('GET','/api/products');
  const prodQty = {};
  entries.forEach(e=>{ prodQty[e.product]=(prodQty[e.product]||0)+e.qty; });
  const sEl = document.getElementById('prod-summary');
  sEl.innerHTML = products.map(p=>{
    const qty = prodQty[p.name]||0;
    const pct = p.dailyTarget ? Math.min(100, Math.round(qty/p.dailyTarget*100)) : 0;
    const status = qty>=p.dailyTarget ? 'success' : qty>0 ? 'warning' : 'muted';
    return \`<div class="summary-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h4 style="font-size:14px;font-weight:600">\${p.name}</h4>
        <span style="font-size:12px;color:var(--muted)">Target: \${p.dailyTarget}/day</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">Produced</span>
        <div class="bar-fill"><div class="progress-bar"><div class="fill \${status==='success'?'green':status==='warning'?'yellow':'blue'}" style="width:\${pct}%"></div></div></div>
        <span class="mono" style="font-size:13px;min-width:60px;text-align:right">\${qty} / \${p.dailyTarget||'-'}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">
        \${['Morning','Evening','Night'].map(s=>{
          const sq = entries.filter(e=>e.product===p.name&&e.shift===s).reduce((a,e)=>a+e.qty,0);
          return sq?s+': '+sq:''; }).filter(Boolean).join('  ')||'No production'}
      </div>
    </div>\`;
  }).join('');
}

async function showProductionModal() {
  if (!state.products.length) { try { state.products = await api('GET','/api/products'); } catch(e) {} }
  if (!state.components.length) { try { state.components = await api('GET','/api/components'); } catch(e) {} }
  const today = dateStr(new Date());
  let opts = '<option value="">Select product</option>';
  state.products.forEach(p=>{ opts+='<option value="'+p.name+'">'+p.name+'</option>'; });
  const html = \`
    <div class="modal-header"><h3>Log Production</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Product</label><select id="prod-form-product">\${opts}</select></div>
      <div class="form-group"><label>Quantity</label><input type="number" id="prod-form-qty" min="1" value="1"></div>
      <div class="form-group"><label>Shift</label><select id="prod-form-shift"><option value="Morning">Morning</option><option value="Evening">Evening</option><option value="Night">Night</option></select></div>
      <div class="form-group"><label>Date</label><input type="date" id="prod-form-date" value="\${today}"></div>
      <div class="form-group"><label>Note</label><textarea id="prod-form-note"></textarea></div>
      <div style="margin-top:12px">
        <button class="btn btn-ghost btn-sm" onclick="toggleFaultSection()" style="width:100%;justify-content:center">+ Add Faults</button>
        <div id="prod-fault-section" style="display:none;margin-top:8px"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitProduction()">Save Entry</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

let faultCount = 0;

function toggleFaultSection() {
  const el = document.getElementById('prod-fault-section');
  if (el.style.display==='none') {
    el.style.display = 'block';
    if (!faultCount) addFaultRow();
  } else { el.style.display='none'; }
}

function addFaultRow() {
  const el = document.getElementById('prod-fault-section');
  const compOpts = state.components.map(c=>'<option value="'+c.name+'">'+c.name+'</option>').join('');
  const id = 'fault-'+(faultCount++);
  el.innerHTML += \`
    <div class="fault-row" id="\${id}" style="display:flex;gap:6px;margin-bottom:6px;align-items:end">
      <div style="flex:2"><label>Component</label><select>\${compOpts}</select></div>
      <div style="flex:1"><label>Qty</label><input type="number" min="1" value="1"></div>
      <div style="flex:2"><label>Classification</label><select><option>BURNT</option><option>CRACKED</option><option>DEFECTIVE</option><option>MISSING</option><option>DAMAGED</option><option>CUT-WRONG</option><option>WASTAGE</option><option>OTHER</option></select></div>
      <div style="flex:2"><label>Note</label><input></div>
      <button class="action-btn danger" onclick="this.parentElement.remove()" data-lucide="x"></button>
    </div>\`;
  lucide.createIcons();
}

async function submitProduction() {
  const product = document.getElementById('prod-form-product').value;
  const qty = parseInt(document.getElementById('prod-form-qty').value);
  const shift = document.getElementById('prod-form-shift').value;
  const date = document.getElementById('prod-form-date').value;
  const note = document.getElementById('prod-form-note').value;
  if (!product||!qty||!shift) { showToast('Fill required fields','error'); return; }
  const faults = [];
  document.querySelectorAll('.fault-row').forEach(row=>{
    const comp = row.querySelector('select')?.value;
    const fqty = parseInt(row.querySelector('input[type=number]')?.value)||0;
    const cls = row.querySelectorAll('select')[1]?.value;
    const n = row.querySelector('input:not([type=number])')?.value||'';
    if (comp&&fqty>0) faults.push({component:comp,qty:fqty,classification:cls,note:n});
  });
  hideModal();
  try {
    const res = await api('POST','/api/production',{product,qty,shift,date,note,faults});
    showToast('Production logged!'+(res.alerts?.length?' ('+res.alerts.length+' alerts)':''), res.alerts?.length?'warning':'success');
    renderProduction();
  } catch(e) { showToast(e.message,'error'); renderProduction(); }
}

async function deleteProduction(id) {
  if (!confirm('Delete this entry?')) return;
  const date = document.getElementById('prod-date').value;
  try {
    await api('DELETE','/api/production/'+id+'?date='+date);
    showToast('Deleted','success');
    renderProduction();
  } catch(e) { showToast(e.message,'error'); }
}

// ============== PRODUCTS ==============
async function renderProducts() {
  const el = document.getElementById('page-content');
  el.innerHTML = \`
    <div class="section-header">
      <div><h2>Products</h2></div>
      <button class="btn btn-primary" onclick="showAddProductModal()">+ Add Product</button>
    </div>
    <div class="product-grid" id="product-grid"></div>\`;
  try {
    const products = await api('GET','/api/products');
    state.products = products;
    const grid = document.getElementById('product-grid');
    if (!products.length) { grid.innerHTML='<div style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px">No products yet</div>'; return; }
    grid.innerHTML = products.map(p=>\`
      <div class="product-card">
        <h3>🏭 \${p.name}</h3>
        <div class="stat-row"><span class="lbl">Target</span><span class="mono">\${p.dailyTarget||0}/day</span></div>
        <div class="stat-row"><span class="lbl">Unit</span><span>\${p.unit||'pcs'}</span></div>
        <div class="stat-row"><span class="lbl">Finished Stock</span><span class="mono">\${p.stock||0}</span></div>
        <div class="stat-row"><span class="lbl">BOM Components</span><span>\${p.bomCount||0}</span></div>
        <div class="stat-row"><span class="lbl">Total Produced</span><span class="mono">\${p.total||0}</span></div>
        <div class="actions">
          <button class="btn btn-sm" onclick="showBomModal('\${p.name}')">Edit BOM</button>
          <button class="btn btn-sm" onclick="showEditProductModal('\${p.name}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('\${p.name}')">Delete</button>
        </div>
      </div>\`).join('');
  } catch(e) { showToast(e.message,'error'); }
}

function showAddProductModal() {
  const html = \`
    <div class="modal-header"><h3>Add Product</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Product Name</label><input id="prod-name" placeholder="e.g. Laser Box"></div>
      <div class="form-group"><label>Unit</label><select id="prod-unit"><option value="pcs">pcs</option><option value="m">m</option><option value="kg">kg</option><option value="ml">ml</option></select></div>
      <div class="form-group"><label>Daily Target</label><input type="number" id="prod-target" min="0" value="50"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddProduct()">Create</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitAddProduct() {
  const name = document.getElementById('prod-name').value.trim();
  const unit = document.getElementById('prod-unit').value;
  const dailyTarget = parseInt(document.getElementById('prod-target').value)||0;
  if (!name) { showToast('Name required','error'); return; }
  hideModal();
  try {
    await api('POST','/api/products',{name,unit,dailyTarget});
    showToast('Product created','success');
    renderProducts();
  } catch(e) { showToast(e.message,'error'); }
}

function showEditProductModal(name) {
  const p = state.products.find(x=>x.name===name);
  if (!p) return;
  const html = \`
    <div class="modal-header"><h3>Edit \${name}</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Unit</label><select id="edit-prod-unit"><option value="pcs"\${p.unit==='pcs'?' selected':''}>pcs</option><option value="m"\${p.unit==='m'?' selected':''}>m</option><option value="kg"\${p.unit==='kg'?' selected':''}>kg</option><option value="ml"\${p.unit==='ml'?' selected':''}>ml</option></select></div>
      <div class="form-group"><label>Daily Target</label><input type="number" id="edit-prod-target" value="\${p.dailyTarget||0}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditProduct('\${name}')">Save</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitEditProduct(name) {
  const unit = document.getElementById('edit-prod-unit').value;
  const dailyTarget = parseInt(document.getElementById('edit-prod-target').value)||0;
  hideModal();
  try {
    await api('PUT','/api/products/'+encodeURIComponent(name),{unit,dailyTarget});
    showToast('Updated','success');
    renderProducts();
  } catch(e) { showToast(e.message,'error'); }
}

async function deleteProduct(name) {
  if (!confirm('Delete product "'+name+'"?')) return;
  try {
    await api('DELETE','/api/products/'+encodeURIComponent(name));
    showToast('Deleted','success');
    renderProducts();
  } catch(e) { showToast(e.message,'error'); }
}

async function showBomModal(product) {
  const bom = await api('GET','/api/products/'+encodeURIComponent(product)+'/bom');
  const compOpts = state.components.map(c=>'<option value="'+c.name+'">'+c.name+' ('+c.unit+')</option>').join('');
  let bomRows = Object.entries(bom).map(([c,data])=>'<div class="bom-row" style="display:flex;gap:6px;margin-bottom:6px;align-items:center"><select>'+state.components.map(x=>'<option value="'+x.name+'"'+(x.name===c?' selected':'')+'>'+x.name+'</option>').join('')+'</select><input type="number" value="'+data.qty+'" min="1" style="width:70px"><span style="color:var(--muted);font-size:12px">'+data.unit+'</span><button class="action-btn danger" onclick="this.parentElement.remove()" data-lucide="x"></button></div>').join('');
  const html = \`
    <div class="modal-header"><h3>BOM: \${product}</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div id="bom-rows">\${bomRows||'<div style="color:var(--muted);margin-bottom:8px">No components in BOM</div>'}</div>
      <button class="btn btn-sm btn-ghost" onclick="addBomRow()" style="margin-top:8px;width:100%;justify-content:center">+ Add Component</button>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitBom('\${product}')">Save BOM</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
  window._bomCompOpts = compOpts;
  window._bomComponents = state.components;
}

function addBomRow() {
  const el = document.getElementById('bom-rows');
  const compOpts = state.components.map(c=>'<option value="'+c.name+'">'+c.name+' ('+c.unit+')</option>').join('');
  el.insertAdjacentHTML('beforeend','<div class="bom-row" style="display:flex;gap:6px;margin-bottom:6px;align-items:center"><select>'+compOpts+'</select><input type="number" value="1" min="1" style="width:70px"><span style="color:var(--muted);font-size:12px">pcs</span><button class="action-btn danger" onclick="this.parentElement.remove()" data-lucide="x"></button></div>');
  lucide.createIcons();
}

async function submitBom(product) {
  const components = {};
  document.querySelectorAll('.bom-row').forEach(row=>{
    const selects = row.querySelectorAll('select');
    const inp = row.querySelector('input');
    if (selects.length && inp) {
      const name = selects[0].value;
      const qty = parseInt(inp.value)||1;
      const found = state.components.find(c=>c.name===name);
      components[name] = { qty, unit: found?.unit||'pcs' };
    }
  });
  hideModal();
  try {
    await api('PUT','/api/products/'+encodeURIComponent(product)+'/bom',{components});
    showToast('BOM updated','success');
    renderProducts();
  } catch(e) { showToast(e.message,'error'); }
}

// ============== COMPONENTS ==============
async function renderComponents() {
  const el = document.getElementById('page-content');
  el.innerHTML = \`
    <div class="section-header">
      <div><h2>Components</h2></div>
      <button class="btn btn-primary" onclick="showAddComponentModal()">+ Add Component</button>
    </div>
    <div class="card" style="overflow:hidden;padding:0">
      <div class="table-wrap"><table><thead><tr><th>Component</th><th>Unit</th><th>Stock</th><th>Min</th><th>Status</th><th>Supplier</th><th>Actions</th></tr></thead><tbody id="comp-table-body"></tbody></table></div>
    </div>
    <div id="comp-log-drawer" style="display:none;margin-top:16px"></div>\`;
  await loadComponents();
}

async function loadComponents() {
  let comps;
  try { comps = await api('GET','/api/components'); } catch(e) { showToast(e.message,'error'); return; }
  state.components = comps;
  const tbody = document.getElementById('comp-table-body');
  if (!comps.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No components</td></tr>'; return; }
  tbody.innerHTML = comps.map(c=>\`
    <tr>
      <td><a href="#" onclick="showCompLog('\${c.name}');return false" style="color:var(--accent);text-decoration:none">\${c.name}</a></td>
      <td>\${c.unit}</td>
      <td class="mono">\${c.stock}</td>
      <td class="mono">\${c.min}</td>
      <td><span class="badge \${c.status.toLowerCase()}">\${c.status}</span></td>
      <td>\${c.supplier||'-'}</td>
      <td>
        <button class="action-btn success" onclick="showStockInModal('\${c.name}')" title="Stock In" data-lucide="plus-circle"></button>
        <button class="action-btn warning" onclick="showStockOutModal('\${c.name}')" title="Stock Out" data-lucide="minus-circle"></button>
        <button class="action-btn" onclick="showEditComponentModal('\${c.name}')" title="Edit" data-lucide="pencil"></button>
        <button class="action-btn danger" onclick="deleteComponent('\${c.name}')" title="Delete" data-lucide="trash-2"></button>
      </td>
    </tr>\`).join('');
  lucide.createIcons();
}

function showAddComponentModal() {
  const html = \`
    <div class="modal-header"><h3>Add Component</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Component Name</label><input id="comp-name" placeholder="e.g. laser-diode"></div>
      <div class="form-group"><label>Unit</label><select id="comp-unit"><option value="pcs">pcs</option><option value="m">m</option><option value="kg">kg</option><option value="ml">ml</option></select></div>
      <div class="form-group"><label>Min Stock Level</label><input type="number" id="comp-min" min="0" value="10"></div>
      <div class="form-group"><label>Supplier</label><input id="comp-supplier" placeholder="Optional"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddComponent()">Create</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitAddComponent() {
  const name = document.getElementById('comp-name').value.trim();
  const unit = document.getElementById('comp-unit').value;
  const min = parseInt(document.getElementById('comp-min').value)||0;
  const supplier = document.getElementById('comp-supplier').value.trim();
  if (!name) { showToast('Name required','error'); return; }
  hideModal();
  try {
    await api('POST','/api/components',{name,unit,min,supplier});
    showToast('Component created','success');
    renderComponents();
  } catch(e) { showToast(e.message,'error'); }
}

function showEditComponentModal(name) {
  const c = state.components.find(x=>x.name===name);
  if (!c) return;
  const html = \`
    <div class="modal-header"><h3>Edit \${name}</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Min Stock</label><input type="number" id="edit-comp-min" value="\${c.min}"></div>
      <div class="form-group"><label>Supplier</label><input id="edit-comp-supplier" value="\${c.supplier||''}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditComponent('\${name}')">Save</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitEditComponent(name) {
  const min = parseInt(document.getElementById('edit-comp-min').value)||0;
  const supplier = document.getElementById('edit-comp-supplier').value.trim();
  hideModal();
  try {
    await api('PUT','/api/components/'+encodeURIComponent(name),{min,supplier});
    showToast('Updated','success');
    renderComponents();
  } catch(e) { showToast(e.message,'error'); }
}

async function deleteComponent(name) {
  if (!confirm('Delete component "'+name+'"?')) return;
  try {
    await api('DELETE','/api/components/'+encodeURIComponent(name));
    showToast('Deleted','success');
    renderComponents();
  } catch(e) { showToast(e.message,'error'); }
}

function showStockInModal(component) {
  const html = \`
    <div class="modal-header"><h3>Stock In: \${component}</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Quantity</label><input type="number" id="stock-qty" min="1" value="1"></div>
      <div class="form-group"><label>Note</label><input id="stock-note" placeholder="Stock received from supplier"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-success" onclick="submitStockIn('\${component}')">Add Stock</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitStockIn(component) {
  const qty = parseInt(document.getElementById('stock-qty').value);
  const note = document.getElementById('stock-note').value;
  if (!qty||qty<=0) { showToast('Valid qty required','error'); return; }
  hideModal();
  try {
    await api('POST','/api/stock/componentin',{component,qty,note});
    showToast('Stock added','success');
    renderComponents();
  } catch(e) { showToast(e.message,'error'); }
}

function showStockOutModal(component) {
  const html = \`
    <div class="modal-header"><h3>Stock Out: \${component}</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Quantity</label><input type="number" id="stockout-qty" min="1" value="1"></div>
      <div class="form-group"><label>Note</label><input id="stockout-note" placeholder="Reason for removal"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-warning" onclick="submitStockOut('\${component}')">Deduct Stock</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitStockOut(component) {
  const qty = parseInt(document.getElementById('stockout-qty').value);
  const note = document.getElementById('stockout-note').value;
  if (!qty||qty<=0) { showToast('Valid qty required','error'); return; }
  hideModal();
  try {
    await api('POST','/api/stock/componentout',{component,qty,note});
    showToast('Stock deducted','success');
    renderComponents();
  } catch(e) { showToast(e.message,'error'); }
}

async function showCompLog(component) {
  const drawer = document.getElementById('comp-log-drawer');
  if (drawer.style.display==='block'&&drawer.dataset.comp===component) {
    drawer.style.display='none';
    return;
  }
  drawer.style.display='block';
  drawer.dataset.comp = component;
  drawer.innerHTML = '<div class="skeleton" style="height:100px"></div>';
  try {
    const log = await api('GET','/api/components/'+encodeURIComponent(component)+'/log');
    drawer.innerHTML = \`
      <div class="card">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">Stock History: \${component}</h4>
        \${log.length ? '<div style="max-height:300px;overflow-y:auto">'+log.map(l=>\`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
            <span>\${l.time}</span>
            <span class="badge \${l.type==='in'?'ok':l.type==='out'?'critical':'low'}">\${l.type}</span>
            <span class="mono">\${l.type==='in'?'+':'-'}\${l.qty} \${l.unit}</span>
            <span style="color:var(--muted)">\${l.product||'-'}</span>
            <span style="color:var(--muted)">\${l.note||''}</span>
          </div>\`).join('')+'</div>'
        : '<div style="color:var(--muted);font-size:13px">No history</div>'}
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('+"'comp-log-drawer'"+').style.display='+"'none'"+'" style="margin-top:8px">Close</button>
      </div>\`;
  } catch(e) { showToast(e.message,'error'); drawer.innerHTML='<div class="card"><div style="color:var(--danger)">Error loading history</div></div>'; }
}

// ============== STOCK ==============
async function renderStock() {
  const el = document.getElementById('page-content');
  el.innerHTML = \`
    <div class="section-header"><div><h2>Stock</h2></div></div>
    <div class="tabs" style="margin-bottom:16px">
      <button class="tab active" data-stock-tab="components" onclick="setStockTab(this,'components')">Component Stock</button>
      <button class="tab" data-stock-tab="finished" onclick="setStockTab(this,'finished')">Finished Goods</button>
    </div>
    <div id="stock-content"></div>\`;
  await loadStock('components');
}

function setStockTab(el, tab) {
  document.querySelectorAll('[data-stock-tab]').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  loadStock(tab);
}

async function loadStock(tab) {
  const el = document.getElementById('stock-content');
  el.innerHTML = '<div class="skeleton" style="height:200px"></div>';
  try {
    const data = await api('GET','/api/stock');
    if (tab==='components') renderComponentStock(el, data.components);
    else renderFinishedStock(el, data.finished);
  } catch(e) { showToast(e.message,'error'); el.innerHTML='<div style="color:var(--danger);text-align:center;padding:30px">Error loading stock</div>'; }
}

function renderComponentStock(el, components) {
  if (!components.length) { el.innerHTML='<div style="color:var(--muted);text-align:center;padding:40px">No components</div>'; return; }
  el.innerHTML = components.map(c=>{
    const pct = c.min>0 ? Math.min(100,Math.round(c.stock/c.min*100)) : (c.stock>0?100:0);
    const barColor = c.stock<=0 ? 'red' : c.stock<c.min ? 'yellow' : 'green';
    return \`<div class="card" style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-weight:600;font-size:14px">\${c.name}</span>
        <span><span class="badge \${c.status.toLowerCase()}">\${c.status}</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span class="mono" style="font-size:20px;font-weight:700;min-width:60px">\${c.stock}</span>
        <div style="flex:1"><div class="progress-bar"><div class="fill \${barColor}" style="width:\${pct}%"></div></div></div>
        <span style="color:var(--muted);font-size:12px;min-width:40px">min: \${c.min}</span>
        <span style="color:var(--muted);font-size:12px">\${c.unit}</span>
      </div>
    </div>\`;
  }).join('');
}

function renderFinishedStock(el, finished) {
  if (!finished.length) { el.innerHTML='<div style="color:var(--muted);text-align:center;padding:40px">No finished goods</div>'; return; }
  el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th><th>Unit</th><th>Actions</th></tr></thead><tbody>'+
    finished.map(f=>'<tr><td>'+f.product+'</td><td class="mono">'+f.stock+'</td><td>'+f.unit+'</td><td><button class="btn btn-sm btn-warning" onclick="showDispatchModal(\''+f.product+'\')">Dispatch</button></td></tr>').join('')+
    '</tbody></table></div>';
}

function showDispatchModal(product) {
  const today = dateStr(new Date());
  const html = \`
    <div class="modal-header"><h3>Dispatch: \${product}</h3><button class="modal-close" onclick="hideModal()" data-lucide="x"></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Quantity</label><input type="number" id="disp-qty" min="1" value="1"></div>
      <div class="form-group"><label>Date</label><input type="date" id="disp-date" value="\${today}"></div>
      <div class="form-group"><label>Note</label><textarea id="disp-note"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideModal()">Cancel</button>
      <button class="btn btn-warning" onclick="submitDispatch('\${product}')">Dispatch</button>
    </div>\`;
  showModal(html);
  lucide.createIcons();
}

async function submitDispatch(product) {
  const qty = parseInt(document.getElementById('disp-qty').value);
  const date = document.getElementById('disp-date').value;
  const note = document.getElementById('disp-note').value;
  if (!qty||qty<=0) { showToast('Valid qty required','error'); return; }
  hideModal();
  try {
    const res = await api('POST','/api/stock/dispatch',{product,qty,note,date});
    showToast('Dispatched'+(res.warning?' ('+res.warning+')':''), res.warning?'warning':'success');
    renderStock();
  } catch(e) { showToast(e.message,'error'); }
}

// ============== FAULTS ==============
async function renderFaults() {
  const el = document.getElementById('page-content');
  const today = dateStr(new Date());
  const weekAgo = dateStr(new Date(Date.now()-6*86400000));
  const prodOpts = state.products.map(p=>'<option value="'+p.name+'">'+p.name+'</option>').join('');
  const compOpts = state.components.map(c=>'<option value="'+c.name+'">'+c.name+'</option>').join('');
  el.innerHTML = \`
    <div class="section-header"><div><h2>Faults</h2></div></div>
    <div class="filter-bar">
      <input type="date" id="fault-from" value="\${weekAgo}" onchange="loadFaults()">
      <input type="date" id="fault-to" value="\${today}" onchange="loadFaults()">
      <select id="fault-product" onchange="loadFaults()"><option value="">All Products</option>\${prodOpts}</select>
      <select id="fault-component" onchange="loadFaults()"><option value="">All Components</option>\${compOpts}</select>
    </div>
    <div class="grid-3" id="fault-summary" style="margin-bottom:16px"></div>
    <div class="grid-2" style="margin-bottom:16px">
      <div class="chart-wrap"><canvas id="fault-bar-chart"></canvas></div>
      <div class="chart-wrap"><canvas id="fault-pie-chart"></canvas></div>
    </div>
    <div class="card" style="overflow:hidden;padding:0"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>Component</th><th>Qty</th><th>Classification</th><th>Note</th></tr></thead><tbody id="fault-table-body"></tbody></table></div></div>\`;
  await loadFaults();
}

async function loadFaults() {
  const from = document.getElementById('fault-from').value;
  const to = document.getElementById('fault-to').value;
  const product = document.getElementById('fault-product').value;
  const comp = document.getElementById('fault-component').value;
  let params = '?from='+from+'&to='+to;
  if (product) params+='&product='+encodeURIComponent(product);
  if (comp) params+='&component='+encodeURIComponent(comp);
  let faults;
  try { faults = await api('GET','/api/faults'+params); } catch(e) { showToast(e.message,'error'); return; }
  const tbody = document.getElementById('fault-table-body');
  tbody.innerHTML = faults.length ? faults.map(f=>\`
    <tr><td>\${f.date}</td><td>\${f.product}</td><td>\${f.component}</td><td class="mono">\${f.qty}</td><td><span class="badge critical">\${f.classification}</span></td><td>\${f.note||'-'}</td></tr>\`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">No faults</td></tr>';
  // Summary cards
  const total = faults.reduce((s,f)=>s+f.qty,0);
  const byComp = {}; faults.forEach(f=>{ byComp[f.component]=(byComp[f.component]||0)+f.qty; });
  const topComp = Object.entries(byComp).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('fault-summary').innerHTML = \`
    <div class="card card-stat"><div class="label">Total Faults</div><div class="value mono">\${total}</div></div>
    <div class="card card-stat"><div class="label">Worst Component</div><div class="value" style="font-size:20px">\${topComp?topComp[0]:'-'}</div><div class="change up">\${topComp?topComp[1]+' units':''}</div></div>
    <div class="card card-stat"><div class="label">Fault Rate</div><div class="value" style="font-size:20px">-</div></div>\`;
  // Charts
  setTimeout(()=>{
    const clsCount = {}; faults.forEach(f=>{ clsCount[f.classification]=(clsCount[f.classification]||0)+f.qty; });
    const compCount = {}; faults.forEach(f=>{ compCount[f.component]=(compCount[f.component]||0)+f.qty; });
    const colors = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    const barEl = document.getElementById('fault-bar-chart');
    if (barEl) {
      if (state.charts.faultBar) state.charts.faultBar.destroy();
      state.charts.faultBar = new Chart(barEl, {
        type:'bar',
        data:{ labels:Object.keys(compCount), datasets:[{ label:'Faults', data:Object.values(compCount), backgroundColor:'#ef4444', borderRadius:4 }] },
        options:{ responsive:true, plugins:{ legend:{display:false}, title:{display:true,text:'Faults by Component',color:'#e2e8f0',font:{size:13}} }, scales:{ x:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#2d3150'}}, y:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#2d3150'},beginAtZero:true} } }
      });
    }
    const pieEl = document.getElementById('fault-pie-chart');
    if (pieEl) {
      if (state.charts.faultPie) state.charts.faultPie.destroy();
      state.charts.faultPie = new Chart(pieEl, {
        type:'pie',
        data:{ labels:Object.keys(clsCount), datasets:[{ data:Object.values(clsCount), backgroundColor:colors.slice(0,Object.keys(clsCount).length), borderWidth:0 }] },
        options:{ responsive:true, plugins:{ legend:{position:'bottom',labels:{color:'#e2e8f0',font:{size:10},padding:8}}, title:{display:true,text:'Faults by Classification',color:'#e2e8f0',font:{size:13}} } }
      });
    }
  }, 100);
}

// ============== DISPATCH ==============
async function renderDispatch() {
  const el = document.getElementById('page-content');
  const today = dateStr(new Date());
  el.innerHTML = \`
    <div class="section-header"><div><h2>Dispatch Log</h2></div></div>
    <div class="filter-bar">
      <input type="date" id="disp-date" value="\${today}" onchange="loadDispatch()">
    </div>
    <div class="card" style="overflow:hidden;padding:0"><div class="table-wrap"><table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Note</th><th>By</th></tr></thead><tbody id="disp-table-body"></tbody></table></div></div>\`;
  await loadDispatch();
}

async function loadDispatch() {
  const date = document.getElementById('disp-date').value;
  const tbody = document.getElementById('disp-table-body');
  try {
    const entries = await api('GET','/api/reports/daily?date='+date);
    const dispatches = entries.dispatches||[];
    tbody.innerHTML = dispatches.length
      ? dispatches.map(d=>'<tr><td class="mono">'+d.time+'</td><td>'+d.product+'</td><td class="mono">'+d.qty+'</td><td>'+(d.note||'-')+'</td><td>'+d.by+'</td></tr>').join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No dispatches</td></tr>';
  } catch(e) { showToast(e.message,'error'); tbody.innerHTML='<tr><td colspan="5" style="color:var(--danger);text-align:center;padding:30px">Error loading</td></tr>'; }
}

// ============== REPORTS ==============
async function renderReports() {
  const el = document.getElementById('page-content');
  el.innerHTML = \`
    <div class="section-header"><div><h2>Reports</h2></div></div>
    <div class="tabs" style="margin-bottom:16px">
      <button class="tab active" data-report-tab="daily" onclick="setReportTab(this,'daily')">Daily</button>
      <button class="tab" data-report-tab="weekly" onclick="setReportTab(this,'weekly')">Weekly</button>
      <button class="tab" data-report-tab="monthly" onclick="setReportTab(this,'monthly')">Monthly</button>
      <button class="tab" data-report-tab="product" onclick="setReportTab(this,'product')">Product</button>
    </div>
    <div id="report-content"></div>\`;
  loadReport('daily');
}

function setReportTab(el, tab) {
  document.querySelectorAll('[data-report-tab]').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  loadReport(tab);
}

async function loadReport(tab) {
  const el = document.getElementById('report-content');
  el.innerHTML = '<div class="skeleton" style="height:200px"></div>';
  try {
    if (tab==='daily') await renderDailyReport(el);
    else if (tab==='weekly') await renderWeeklyReport(el);
    else if (tab==='monthly') await renderMonthlyReport(el);
    else if (tab==='product') await renderProductReport(el);
  } catch(e) { showToast(e.message,'error'); el.innerHTML='<div style="color:var(--danger);text-align:center;padding:30px">'+e.message+'</div>'; }
}

async function renderDailyReport(el) {
  const today = dateStr(new Date());
  el.innerHTML = \`
    <div class="filter-bar">
      <input type="date" id="rpt-daily-date" value="\${today}" onchange="loadReport('daily')">
      <button class="btn btn-sm" onclick="exportReport('daily')">Export CSV</button>
    </div>
    <div id="rpt-daily-content"></div>\`;
  const date = document.getElementById('rpt-daily-date').value;
  const data = await api('GET','/api/reports/daily?date='+date);
  el.querySelector('#rpt-daily-content').innerHTML = \`
    <div class="grid-3" style="margin-bottom:16px">
      <div class="card card-stat"><div class="label">Total Produced</div><div class="value mono">\${data.totalProduced||0}</div></div>
      <div class="card card-stat"><div class="label">Faults</div><div class="value mono">\${data.faults?.length||0}</div></div>
      <div class="card card-stat"><div class="label">Dispatches</div><div class="value mono">\${data.dispatches?.length||0}</div></div>
    </div>
    \${Object.entries(data.byProduct||{}).map(([p,d])=>'<div class="summary-card"><h4 style="font-size:14px;font-weight:600">'+p+'</h4><div class="stat-row"><span class="lbl">Qty</span><span class="mono">'+d.qty+'</span></div><div class="stat-row"><span class="lbl">Net Good</span><span class="mono">'+(d.netGood||d.qty)+'</span></div><div class="stat-row"><span class="lbl">Shifts</span><span>'+Object.entries(d.shifts||{}).map(([s,q])=>s+': '+q).join(', ')+'</span></div></div>').join('')}
    <div class="card" style="margin-top:12px;overflow:hidden;padding:0">
      <div class="table-wrap"><table><thead><tr><th>Time</th><th>Product</th><th>Shift</th><th>Qty</th><th>Net</th><th>By</th></tr></thead><tbody>
        \${(data.faults||[]).map(f=>'<tr><td class="mono">'+f.time+'</td><td>'+f.product+'</td><td>-</td><td class="mono">'+f.qty+' (fault)</td><td>-</td><td>'+f.by+'</td></tr>').join('')}
      </tbody></table></div>
    </div>\`;
}

async function renderWeeklyReport(el) {
  const today = dateStr(new Date());
  const weekAgo = dateStr(new Date(Date.now()-6*86400000));
  el.innerHTML = \`
    <div class="filter-bar">
      <input type="date" id="rpt-week-from" value="\${weekAgo}" onchange="loadReport('weekly')">
      <button class="btn btn-sm" onclick="exportReport('weekly')">Export CSV</button>
    </div>
    <div class="chart-wrap" style="margin-bottom:16px"><canvas id="rpt-week-chart"></canvas></div>
    <div id="rpt-week-content"></div>\`;
  const from = document.getElementById('rpt-week-from').value;
  const data = await api('GET','/api/reports/weekly?from='+from);
  el.querySelector('#rpt-week-content').innerHTML = \`
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card card-stat"><div class="label">Week Total</div><div class="value mono">\${data.weekTotal}</div></div>
    </div>
    <div class="card" style="overflow:hidden;padding:0"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Total</th>\${Object.keys(data.daily[0]?.byProduct||{}).map(p=>'<th>'+p+'</th>').join('')}</tr></thead><tbody>
      \${data.daily.map(d=>'<tr><td>'+d.date+'</td><td class="mono">'+d.total+'</td>'+Object.keys(data.daily[0]?.byProduct||{}).map(p=>'<td class="mono">'+(d.byProduct[p]||0)+'</td>').join('')+'</tr>').join('')}
    </tbody></table></div></div>\`;
  setTimeout(()=>{
    const ctx = document.getElementById('rpt-week-chart');
    if (ctx) {
      if (state.charts.rptWeek) state.charts.rptWeek.destroy();
      state.charts.rptWeek = new Chart(ctx, {
        type:'line',
        data:{ labels:data.daily.map(d=>d.date.slice(5)), datasets:[{ label:'Production', data:data.daily.map(d=>d.total), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.1)', fill:true, tension:.3 }] },
        options:{ responsive:true, plugins:{ legend:{labels:{color:'#e2e8f0'}} }, scales:{ x:{ticks:{color:'#64748b'},grid:{color:'#2d3150'}}, y:{ticks:{color:'#64748b'},grid:{color:'#2d3150'},beginAtZero:true} } }
      });
    }
  }, 100);
}

async function renderMonthlyReport(el) {
  const today = dateStr(new Date()).slice(0,7);
  el.innerHTML = \`
    <div class="filter-bar">
      <input type="month" id="rpt-month" value="\${today}" onchange="loadReport('monthly')">
      <button class="btn btn-sm" onclick="exportReport('monthly')">Export CSV</button>
    </div>
    <div class="chart-wrap" style="margin-bottom:16px"><canvas id="rpt-month-chart"></canvas></div>
    <div id="rpt-month-content"></div>\`;
  const month = document.getElementById('rpt-month').value;
  const data = await api('GET','/api/reports/monthly?month='+month);
  el.querySelector('#rpt-month-content').innerHTML = \`
    <div class="grid-3" style="margin-bottom:16px">
      <div class="card card-stat"><div class="label">Month Total</div><div class="value mono">\${data.monthTotal}</div></div>
      \${Object.entries(data.byProduct||{}).map(([p,q])=>'<div class="card card-stat"><div class="label">'+p+'</div><div class="value mono">'+q+'</div></div>').join('')}
    </div>
    <div class="card" style="overflow:hidden;padding:0"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Total</th></tr></thead><tbody>
      \${data.daily.map(d=>'<tr><td>'+d.date+'</td><td class="mono">'+d.total+'</td></tr>').join('')}
    </tbody></table></div></div>\`;
  setTimeout(()=>{
    const ctx = document.getElementById('rpt-month-chart');
    if (ctx) {
      if (state.charts.rptMonth) state.charts.rptMonth.destroy();
      state.charts.rptMonth = new Chart(ctx, {
        type:'bar',
        data:{ labels:data.daily.map(d=>d.date.slice(8)), datasets:[{ label:'Production', data:data.daily.map(d=>d.total), backgroundColor:'#3b82f6', borderRadius:2 }] },
        options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ x:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#2d3150'}}, y:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#2d3150'},beginAtZero:true} } }
      });
    }
  }, 100);
}

async function renderProductReport(el) {
  const today = dateStr(new Date());
  const weekAgo = dateStr(new Date(Date.now()-6*86400000));
  const prodOpts = state.products.map(p=>'<option value="'+p.name+'">'+p.name+'</option>').join('');
  el.innerHTML = \`
    <div class="filter-bar">
      <select id="rpt-prod-name" onchange="loadReport('product')"><option value="">Select product</option>\${prodOpts}</select>
      <input type="date" id="rpt-prod-from" value="\${weekAgo}" onchange="loadReport('product')">
      <input type="date" id="rpt-prod-to" value="\${today}" onchange="loadReport('product')">
      <button class="btn btn-sm" onclick="exportReport('product')">Export CSV</button>
    </div>
    <div id="rpt-prod-content"></div>\`;
  const name = document.getElementById('rpt-prod-name').value;
  if (!name) { el.querySelector('#rpt-prod-content').innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Select a product</div>'; return; }
  const from = document.getElementById('rpt-prod-from').value;
  const to = document.getElementById('rpt-prod-to').value;
  const data = await api('GET','/api/reports/product?name='+encodeURIComponent(name)+'&from='+from+'&to='+to);
  el.querySelector('#rpt-prod-content').innerHTML = \`
    <div class="grid-4" style="margin-bottom:16px">
      <div class="card card-stat"><div class="label">Total</div><div class="value mono">\${data.total}</div></div>
      <div class="card card-stat"><div class="label">Avg/Day</div><div class="value mono">\${data.avgPerDay}</div></div>
      <div class="card card-stat"><div class="label">Best Day</div><div class="value" style="font-size:16px">\${data.bestDay||'-'}</div><div class="change up">\${data.bestQty||0}</div></div>
      <div class="card card-stat"><div class="label">Fault Rate</div><div class="value mono">\${data.faultRate}%</div></div>
    </div>
    <div class="chart-wrap" style="margin-bottom:16px"><canvas id="rpt-prod-chart"></canvas></div>
    \${Object.keys(data.componentConsumption||{}).length ? '<div class="card" style="overflow:hidden;padding:0"><div class="table-wrap"><table><thead><tr><th>Component</th><th>Consumed</th><th>Unit</th></tr></thead><tbody>'+
      Object.entries(data.componentConsumption).map(([c,d])=>'<tr><td>'+c+'</td><td class="mono">'+d.qty+'</td><td>'+d.unit+'</td></tr>').join('')+
    '</tbody></table></div></div>' : ''}\`;
  setTimeout(()=>{
    const ctx = document.getElementById('rpt-prod-chart');
    if (ctx) {
      if (state.charts.rptProd) state.charts.rptProd.destroy();
      state.charts.rptProd = new Chart(ctx, {
        type:'line',
        data:{ labels:data.days.filter(d=>d.qty>0).map(d=>d.date.slice(5)), datasets:[{ label:'Production', data:data.days.filter(d=>d.qty>0).map(d=>d.qty), borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,.1)', fill:true, tension:.3 }] },
        options:{ responsive:true, plugins:{ legend:{labels:{color:'#e2e8f0'}} }, scales:{ x:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#2d3150'}}, y:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#2d3150'},beginAtZero:true} } }
      });
    }
  }, 100);
}

async function exportReport(tab) {
  const params = new URLSearchParams();
  if (tab==='daily') {
    params.set('from', document.getElementById('rpt-daily-date')?.value||dateStr(new Date()));
    params.set('to', params.get('from'));
  } else if (tab==='weekly') {
    const from = document.getElementById('rpt-week-from')?.value||dateStr(new Date());
    params.set('from', from);
    params.set('to', dateStr(new Date(new Date(from).getTime()+6*86400000)));
  } else if (tab==='monthly') {
    const m = document.getElementById('rpt-month')?.value||dateStr(new Date()).slice(0,7);
    params.set('from', m+'-01');
    const days = new Date(parseInt(m), parseInt(m.split('-')[1]), 0).getDate();
    params.set('to', m+'-'+String(days).padStart(2,'0'));
  } else if (tab==='product') {
    params.set('from', document.getElementById('rpt-prod-from')?.value||dateStr(new Date()));
    params.set('to', document.getElementById('rpt-prod-to')?.value||dateStr(new Date()));
  }
  params.set('type', 'csv');
  try {
    const res = await api('GET','/api/reports/export?'+params.toString());
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'production-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported','success');
  } catch(e) { showToast(e.message,'error'); }
}

// ============== SETTINGS ==============
async function renderSettings() {
  const el = document.getElementById('page-content');
  el.innerHTML = \`
    <div class="section-header"><div><h2>Settings</h2></div></div>
    <div class="card" style="max-width:600px">
      <div class="form-group"><label>Company Name</label><input id="set-company"></div>
      <div class="form-group"><label>Timezone</label><select id="set-tz">
        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
        <option value="Asia/Dubai">Asia/Dubai</option>
        <option value="Asia/Singapore">Asia/Singapore</option>
        <option value="Asia/Shanghai">Asia/Shanghai</option>
        <option value="Asia/Tokyo">Asia/Tokyo</option>
        <option value="Europe/London">Europe/London</option>
        <option value="Europe/Berlin">Europe/Berlin</option>
        <option value="America/New_York">America/New_York</option>
        <option value="America/Chicago">America/Chicago</option>
        <option value="America/Los_Angeles">America/Los_Angeles</option>
        <option value="UTC">UTC</option>
      </select></div>
      <div class="form-group"><label>Shifts (comma separated)</label><input id="set-shifts" placeholder="Morning, Evening, Night"></div>
      <button class="btn btn-primary" onclick="saveSettings()" style="margin-top:8px">Save Settings</button>
      <hr style="border:none;border-top:1px solid var(--border);margin:24px 0">
      <h4 style="font-size:14px;font-weight:600;margin-bottom:12px">Change PIN</h4>
      <div class="form-group"><label>New Admin PIN</label><input type="password" id="set-admin-pin" maxlength="10" inputmode="numeric"></div>
      <div class="form-group"><label>New Operator PIN</label><input type="password" id="set-operator-pin" maxlength="10" inputmode="numeric"></div>
      <button class="btn btn-warning" onclick="savePins()">Update PINs</button>
    </div>\`;
  try {
    const s = await api('GET','/api/settings');
    state.settings = s;
    document.getElementById('set-company').value = s.company||'';
    document.getElementById('set-tz').value = s.timezone||'Asia/Kolkata';
    document.getElementById('set-shifts').value = (s.shifts||[]).join(', ');
    updateTopbarDate();
  } catch(e) { showToast(e.message,'error'); }
}

async function saveSettings() {
  const company = document.getElementById('set-company').value;
  const timezone = document.getElementById('set-tz').value;
  const shifts = document.getElementById('set-shifts').value.split(',').map(s=>s.trim()).filter(Boolean);
  try {
    await api('POST','/api/settings',{company,timezone,shifts});
    state.settings = {company,timezone,shifts};
    updateTopbarDate();
    showToast('Settings saved','success');
  } catch(e) { showToast(e.message,'error'); }
}

async function savePins() {
  const adminPin = document.getElementById('set-admin-pin').value;
  const operatorPin = document.getElementById('set-operator-pin').value;
  if (!adminPin&&!operatorPin) { showToast('Enter at least one PIN','warning'); return; }
  try {
    await api('POST','/api/settings',{adminPin,operatorPin});
    showToast('PINs updated','success');
    document.getElementById('set-admin-pin').value='';
    document.getElementById('set-operator-pin').value='';
  } catch(e) { showToast(e.message,'error'); }
}

// ============== UTILITY ==============
function dateStr(d) {
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

// ============== INIT ==============
async function init() {
  // Auto-seed if no components exist
  try {
    const comps = await fetch('/api/components', {
      headers: state.token ? {'Authorization':'Bearer '+state.token} : {}
    });
    if (comps.ok) {
      const list = await comps.json();
      if (!Array.isArray(list) || list.length === 0) {
        await fetch('/api/seed');
      }
    }
  } catch(e) {}
  if (state.token) {
    showApp();
  }
}
init();
</script>
</body>
</html>`;
}
