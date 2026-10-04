/* ═══════════════════════════════════════════════
   FINANCE TRACKER — dashboard.js
   All logic: Navigation, Transactions, Budget,
   Reports (Charts), Goals, Settings
   Data stored in MySQL via Spring Boot API
   ═══════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════
   UTILITY HELPERS
══════════════════════════════════════ */
const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ══════════════════════════════════════
   STORAGE (in-memory cache backed by API)
══════════════════════════════════════ */
const cache = {
  txns: [],
  budgets: [],
  goals: [],
  profile: { name: '', email: '', since: today() },
  prefs: { currency: 'INR', theme: 'dark', notifs: true },
};

const DB = {
  txns:    () => cache.txns,
  budgets: () => cache.budgets,
  goals:   () => cache.goals,
  profile: () => cache.profile,
  prefs:   () => cache.prefs,
};

function applyUser(user) {
  cache.profile = {
    name: user.name || '',
    email: user.email || '',
    since: user.since || today()
  };
  cache.prefs = {
    currency: user.currency || 'INR',
    theme: user.theme || 'dark',
    notifs: user.notifs !== false
  };
}

function num(v) { return Number(v); }

async function loadAll() {
  const [txns, budgets, goals, me] = await Promise.all([
    api('/transactions'),
    api('/budgets'),
    api('/goals'),
    api('/auth/me')
  ]);
  cache.txns = txns.map(t => ({ ...t, amount: num(t.amount), note: t.note || '' }));
  cache.budgets = budgets.map(b => ({ ...b, limit: num(b.limit) }));
  cache.goals = goals.map(g => ({ ...g, target: num(g.target), saved: num(g.saved), deadline: g.deadline || '' }));
  applyUser(me);
}


/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg, type = 'success') {
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3200);
}

/* ══════════════════════════════════════
   SIDEBAR / NAVIGATION
══════════════════════════════════════ */
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');

function openSidebar() {
  sidebar.classList.add('active');
  sidebarOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('active');
  sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

menuBtn.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Section switching
let activeView = 'dashboard';
const sections = document.querySelectorAll('.view-section');
const tabs     = document.querySelectorAll('.option[data-view]');

function switchView(view) {
  activeView = view;
  sections.forEach(s => s.classList.toggle('active-view', s.id === `view-${view}`));
  tabs.forEach(t => t.classList.toggle('selected', t.dataset.view === view));
  closeSidebar();
  renderView(view);
}

tabs.forEach(t => t.addEventListener('click', e => {
  e.preventDefault();
  switchView(t.dataset.view);
}));

// "View All" link on dashboard
document.querySelectorAll('[data-view]').forEach(el => {
  if (!el.classList.contains('option')) {
    el.addEventListener('click', e => { e.preventDefault(); switchView(el.dataset.view); });
  }
});

// Profile button -> settings
document.getElementById('navProfileBtn').addEventListener('click', () => switchView('settings'));

function renderView(view) {
  switch (view) {
    case 'dashboard':    renderDashboard(); break;
    case 'transactions': renderTransactions(); break;
    case 'budget':       renderBudget(); break;
    case 'reports':      renderReports(); break;
    case 'goals':        renderGoals(); break;
    case 'settings':     renderSettings(); break;
  }
}

/* ══════════════════════════════════════
   CATEGORY ICONS
══════════════════════════════════════ */
const CAT_ICON = {
  Food: '🍔', Travel: '✈️', Shopping: '🛍️', Education: '📚',
  Entertainment: '🎬', Healthcare: '💊', Bills: '📃',
  Salary: '💼', Freelance: '💻', Investment: '📈', Other: '📦'
};

/* ══════════════════════════════════════
   CHART COLORS
══════════════════════════════════════ */
const PALETTE = [
  '#A1CCA5','#4ade80','#34d399','#60a5fa','#a78bfa',
  '#f472b6','#fb923c','#fbbf24','#f87171','#38bdf8','#c084fc'
];

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
let dashPieChart = null;
let dashBarChart = null;

function renderDashboard() {
  const txns = DB.txns();

  // Summary
  const income   = txns.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const balance  = income - expenses;

  document.getElementById('dashBalance').textContent  = fmt(balance);
  document.getElementById('dashIncome').textContent   = fmt(income);
  document.getElementById('dashExpenses').textContent = fmt(expenses);

  // Pie chart — spending by category
  const catMap = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const catLabels = Object.keys(catMap);
  const catData   = Object.values(catMap);

  if (dashPieChart) dashPieChart.destroy();
  const pieCtx = document.getElementById('pie-chart').getContext('2d');
  dashPieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: catLabels.length ? catLabels : ['No Data'],
      datasets: [{
        data: catData.length ? catData : [1],
        backgroundColor: catLabels.length ? PALETTE.slice(0, catLabels.length) : ['#2d5c30'],
        borderColor: '#162019', borderWidth: 2, hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#8cad8e', font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
      },
      cutout: '60%'
    }
  });

  // Bar chart — income vs expenses by month (last 6)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const incomeByMonth  = months.map(m => txns.filter(t => t.type === 'income'  && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const expenseByMonth = months.map(m => txns.filter(t => t.type === 'expense' && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));

  if (dashBarChart) dashBarChart.destroy();
  const barCtx = document.getElementById('bar-chart').getContext('2d');
  dashBarChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'Income',   data: incomeByMonth,  backgroundColor: 'rgba(74,222,128,0.7)', borderRadius: 6 },
        { label: 'Expenses', data: expenseByMonth, backgroundColor: 'rgba(248,113,113,0.7)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#8cad8e', font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } }
      },
      scales: {
        x: { ticks: { color: '#8cad8e' }, grid: { color: 'rgba(161,204,165,0.08)' } },
        y: { ticks: { color: '#8cad8e', callback: v => fmt(v) }, grid: { color: 'rgba(161,204,165,0.08)' } }
      }
    }
  });

  // Recent transactions (last 5)
  const recentList = document.getElementById('recentList');
  const recent = [...txns].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  if (!recent.length) {
    recentList.innerHTML = '<div class="empty-state">No transactions yet. Add one!</div>';
    return;
  }
  recentList.innerHTML = recent.map(t => `
    <div class="recent-item">
      <div class="ri-icon">${CAT_ICON[t.category] || '📦'}</div>
      <div class="ri-info">
        <div class="ri-desc">${escHtml(t.description)}</div>
        <div class="ri-meta">${fmtDate(t.date)} &middot; ${t.category}</div>
      </div>
      <div class="ri-amount ${t.type === 'income' ? 'income-amt' : 'expense-amt'}">
        ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}
      </div>
    </div>
  `).join('');

  // Update greeting
  updateGreeting();
}

function updateGreeting() {
  const profile = DB.profile();
  const name = profile.name || 'User';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('navGreeting').textContent = `${greet}, ${name}`;
}

/* ══════════════════════════════════════
   TRANSACTIONS
══════════════════════════════════════ */
let txnDeleteId = null;

function renderTransactions() {
  let txns = DB.txns();
  const search  = document.getElementById('txnSearch').value.toLowerCase().trim();
  const typeF   = document.getElementById('txnTypeFilter').value;
  const catF    = document.getElementById('txnCatFilter').value;
  const sortF   = document.getElementById('txnSort').value;

  if (search) txns = txns.filter(t => t.description.toLowerCase().includes(search) || t.category.toLowerCase().includes(search) || (t.note||'').toLowerCase().includes(search));
  if (typeF !== 'all') txns = txns.filter(t => t.type === typeF);
  if (catF !== 'all')  txns = txns.filter(t => t.category === catF);

  txns.sort((a, b) => {
    if (sortF === 'date-desc')   return b.date.localeCompare(a.date);
    if (sortF === 'date-asc')    return a.date.localeCompare(b.date);
    if (sortF === 'amount-desc') return b.amount - a.amount;
    if (sortF === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  const tbody = document.getElementById('txnTableBody');
  if (!txns.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No transactions found.</td></tr>';
    return;
  }
  tbody.innerHTML = txns.map(t => `
    <tr>
      <td>${fmtDate(t.date)}</td>
      <td>
        <div style="font-weight:600">${escHtml(t.description)}</div>
        ${t.note ? `<div style="font-size:12px;color:var(--text-muted)">${escHtml(t.note)}</div>` : ''}
      </td>
      <td><span class="cat-badge">${CAT_ICON[t.category]||''} ${t.category}</span></td>
      <td><span class="type-badge ${t.type}">${t.type}</span></td>
      <td class="txn-amount ${t.type === 'income' ? 'positive' : 'negative'}">
        ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn" onclick="openEditTxn('${t.id}')" title="Edit" aria-label="Edit transaction">✏️</button>
          <button class="action-btn del" onclick="openDeleteTxn('${t.id}')" title="Delete" aria-label="Delete transaction">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Filters
['txnSearch','txnTypeFilter','txnCatFilter','txnSort'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { if (activeView === 'transactions') renderTransactions(); });
  document.getElementById(id).addEventListener('change', () => { if (activeView === 'transactions') renderTransactions(); });
});

// Open Add Modal
document.getElementById('openAddTxnModal').addEventListener('click', () => {
  document.getElementById('txnModalTitle').textContent = 'Add Transaction';
  document.getElementById('txnSubmitBtn').textContent  = 'Save Transaction';
  document.getElementById('txnForm').reset();
  document.getElementById('txnId').value = '';
  document.getElementById('txnDate').value = today();
  openModal('txnModalOverlay');
});

// Open Edit Modal
window.openEditTxn = function(id) {
  const txn = DB.txns().find(t => t.id === id);
  if (!txn) return;
  document.getElementById('txnModalTitle').textContent = 'Edit Transaction';
  document.getElementById('txnSubmitBtn').textContent  = 'Update Transaction';
  document.getElementById('txnId').value      = txn.id;
  document.getElementById('txnDate').value    = txn.date;
  document.getElementById('txnType').value    = txn.type;
  document.getElementById('txnDesc').value    = txn.description;
  document.getElementById('txnCat').value     = txn.category;
  document.getElementById('txnAmount').value  = txn.amount;
  document.getElementById('txnNote').value    = txn.note || '';
  openModal('txnModalOverlay');
};

// Delete transaction
window.openDeleteTxn = function(id) {
  txnDeleteId = id;
  const txn = DB.txns().find(t => t.id === id);
  document.getElementById('deleteMsg').textContent = `Delete "${txn ? txn.description : 'this transaction'}"?`;
  openModal('deleteModalOverlay');
};

// Transaction form submit
document.getElementById('txnForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id     = document.getElementById('txnId').value;
  const date   = document.getElementById('txnDate').value;
  const type   = document.getElementById('txnType').value;
  const desc   = document.getElementById('txnDesc').value.trim();
  const cat    = document.getElementById('txnCat').value;
  const amount = parseFloat(document.getElementById('txnAmount').value);
  const note   = document.getElementById('txnNote').value.trim();

  if (!date || !desc || !cat || isNaN(amount) || amount <= 0) {
    showToast('Please fill all required fields.', 'error'); return;
  }

  const payload = { date, type, description: desc, category: cat, amount, note };
  try {
    if (id) {
      const updated = await api(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      cache.txns = cache.txns.map(t => t.id === id ? { ...updated, amount: num(updated.amount), note: updated.note || '' } : t);
      showToast('Transaction updated!');
    } else {
      const created = await api('/transactions', { method: 'POST', body: JSON.stringify(payload) });
      cache.txns.unshift({ ...created, amount: num(created.amount), note: created.note || '' });
      showToast('Transaction added!');
    }
    closeModal('txnModalOverlay');
    renderTransactions();
    checkBudgetAlerts(cat, type);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

['closeTxnModal','cancelTxnModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => closeModal('txnModalOverlay'));
});

/* ══════════════════════════════════════
   BUDGET
══════════════════════════════════════ */
let budgetDeleteId = null;

// Set default month
document.getElementById('budgetMonthPicker').value = thisMonth();

document.getElementById('budgetMonthPicker').addEventListener('change', renderBudget);

function renderBudget() {
  const month   = document.getElementById('budgetMonthPicker').value || thisMonth();
  const budgets = DB.budgets().filter(b => b.month === month);
  const txns    = DB.txns().filter(t => t.date.startsWith(month) && t.type === 'expense');

  let totalSpent = 0, totalLimit = 0;

  const container = document.getElementById('budgetList');
  if (!budgets.length) {
    container.innerHTML = '<div class="empty-state">No budgets set for this month. Create one!</div>';
    document.getElementById('budgetTotalSpent').textContent = 'Spent: ₹0';
    document.getElementById('budgetTotalLimit').textContent = 'of ₹0';
    return;
  }

  container.innerHTML = budgets.map(b => {
    const spent = txns.filter(t => t.category === b.category).reduce((s,t) => s+t.amount, 0);
    const pct   = Math.min((spent / b.limit) * 100, 100);
    const over  = spent > b.limit;
    const warn  = !over && pct >= 80;
    const remaining = b.limit - spent;
    totalSpent += spent; totalLimit += b.limit;

    return `
      <div class="budget-item ${over ? 'budget-over' : ''}">
        <div class="budget-item-header">
          <span class="budget-cat-name">${CAT_ICON[b.category]||''} ${b.category}</span>
          <div class="budget-amounts">
            <span class="budget-spent ${over ? 'budget-over' : ''}">${fmt(spent)}</span>
            <span>/ ${fmt(b.limit)}</span>
            ${over ? '<span class="over-badge">OVER</span>' : ''}
          </div>
        </div>
        <div class="budget-progress-bg">
          <div class="budget-progress-fill ${over ? 'over' : warn ? 'warn' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="budget-item-footer">
          <span class="budget-remaining ${remaining >= 0 ? 'positive' : 'negative'}">
            ${remaining >= 0 ? `₹${Math.abs(remaining).toLocaleString('en-IN')} remaining` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
          </span>
          <div class="action-btns">
            <button class="action-btn" onclick="openEditBudget('${b.id}')" title="Edit">✏️</button>
            <button class="action-btn del" onclick="openDeleteBudget('${b.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('budgetTotalSpent').textContent = `Spent: ${fmt(totalSpent)}`;
  document.getElementById('budgetTotalLimit').textContent = `of ${fmt(totalLimit)}`;
}

document.getElementById('openAddBudgetModal').addEventListener('click', () => {
  document.getElementById('budgetModalTitle').textContent = 'Create Budget';
  document.getElementById('budgetForm').reset();
  document.getElementById('budgetId').value = '';
  document.getElementById('budgetMonth').value = thisMonth();
  openModal('budgetModalOverlay');
});

window.openEditBudget = function(id) {
  const b = DB.budgets().find(x => x.id === id);
  if (!b) return;
  document.getElementById('budgetModalTitle').textContent = 'Edit Budget';
  document.getElementById('budgetId').value    = b.id;
  document.getElementById('budgetCat').value   = b.category;
  document.getElementById('budgetMonth').value = b.month;
  document.getElementById('budgetLimit').value = b.limit;
  openModal('budgetModalOverlay');
};

window.openDeleteBudget = function(id) {
  budgetDeleteId = id;
  txnDeleteId = null;
  document.getElementById('deleteMsg').textContent = 'Delete this budget?';
  openModal('deleteModalOverlay');
};

document.getElementById('budgetForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = document.getElementById('budgetId').value;
  const cat   = document.getElementById('budgetCat').value;
  const month = document.getElementById('budgetMonth').value;
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  if (!cat || !month || isNaN(limit) || limit <= 0) { showToast('Fill all fields.', 'error'); return; }

  const payload = { category: cat, month, limit };
  try {
    if (id) {
      const updated = await api(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      cache.budgets = cache.budgets.map(b => b.id === id ? { ...updated, limit: num(updated.limit) } : b);
      showToast('Budget updated!');
    } else {
      const created = await api('/budgets', { method: 'POST', body: JSON.stringify(payload) });
      cache.budgets.push({ ...created, limit: num(created.limit) });
      showToast('Budget created!');
    }
    closeModal('budgetModalOverlay');
    renderBudget();
  } catch (err) {
    showToast(err.message, err.message.includes('already exists') ? 'warning' : 'error');
  }
});

['closeBudgetModal','cancelBudgetModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => closeModal('budgetModalOverlay'));
});

// Budget alerts when adding transaction
function checkBudgetAlerts(category, type) {
  if (type !== 'expense') return;
  const prefs = DB.prefs();
  if (!prefs.notifs) return;
  const month  = thisMonth();
  const budget = DB.budgets().find(b => b.category === category && b.month === month);
  if (!budget) return;
  const spent = DB.txns().filter(t => t.category === category && t.date.startsWith(month) && t.type === 'expense')
                          .reduce((s,t) => s+t.amount, 0);
  const pct = (spent / budget.limit) * 100;
  if (spent > budget.limit) showToast(`⚠️ Over budget for ${category}! ${fmt(spent)} of ${fmt(budget.limit)}`, 'error');
  else if (pct >= 80) showToast(`⚠️ ${category} budget at ${pct.toFixed(0)}% (${fmt(spent)} of ${fmt(budget.limit)})`, 'warning');
}

/* ══════════════════════════════════════
   REPORTS
══════════════════════════════════════ */
let reportMonthlyChart = null;
let reportPieChart     = null;

function getFilteredTxns() {
  const period = document.getElementById('reportPeriod').value;
  const catF   = document.getElementById('reportCatFilter').value;
  const now    = new Date();
  let from, to = now;

  switch (period) {
    case 'this-month':  from = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'last-month':  from = new Date(now.getFullYear(), now.getMonth()-1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); break;
    case 'last-3':      from = new Date(now.getFullYear(), now.getMonth()-2, 1); break;
    case 'last-6':      from = new Date(now.getFullYear(), now.getMonth()-5, 1); break;
    case 'this-year':   from = new Date(now.getFullYear(), 0, 1); break;
    default:            from = new Date('2000-01-01');
  }

  let txns = DB.txns().filter(t => {
    const d = new Date(t.date);
    return d >= from && d <= to;
  });
  if (catF !== 'all') txns = txns.filter(t => t.category === catF);
  return { txns, from, to };
}

function renderReports() {
  const { txns } = getFilteredTxns();

  // Stat cards
  const expenses = txns.filter(t => t.type === 'expense');
  const incomes  = txns.filter(t => t.type === 'income');

  // Highest spending category
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category]||0) + t.amount; });
  const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
  if (sorted.length) {
    document.getElementById('rscHighCat').textContent    = `${CAT_ICON[sorted[0][0]]||''} ${sorted[0][0]}`;
    document.getElementById('rscHighCatAmt').textContent = fmt(sorted[0][1]);
  } else {
    document.getElementById('rscHighCat').textContent    = '—';
    document.getElementById('rscHighCatAmt').textContent = '';
  }

  // Avg monthly expense
  const monthSet = new Set(expenses.map(t => t.date.slice(0,7)));
  const monthCount = Math.max(monthSet.size, 1);
  const totalExp   = expenses.reduce((s,t)=>s+t.amount,0);
  document.getElementById('rscAvgExpense').textContent = fmt(totalExp / monthCount);

  // Largest transaction
  const all = [...txns].sort((a,b) => b.amount-a.amount);
  if (all.length) {
    document.getElementById('rscLargest').textContent    = fmt(all[0].amount);
    document.getElementById('rscLargestDesc').textContent = `${all[0].description} · ${all[0].category}`;
  } else {
    document.getElementById('rscLargest').textContent    = '₹0';
    document.getElementById('rscLargestDesc').textContent = '';
  }

  // Savings
  const totalInc = incomes.reduce((s,t)=>s+t.amount,0);
  document.getElementById('rscSavings').textContent = fmt(totalInc - totalExp);

  // Monthly bar chart
  const months = [...new Set(txns.map(t => t.date.slice(0,7)))].sort();
  const mIncome  = months.map(m => txns.filter(t=>t.type==='income'  && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const mExpense = months.map(m => txns.filter(t=>t.type==='expense' && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));

  if (reportMonthlyChart) reportMonthlyChart.destroy();
  const mCtx = document.getElementById('monthlyChart').getContext('2d');
  reportMonthlyChart = new Chart(mCtx, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'Income',   data: mIncome,  backgroundColor: 'rgba(74,222,128,0.75)', borderRadius: 6 },
        { label: 'Expenses', data: mExpense, backgroundColor: 'rgba(248,113,113,0.75)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#8cad8e' } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } }
      },
      scales: {
        x: { ticks: { color: '#8cad8e' }, grid: { color: 'rgba(161,204,165,0.06)' } },
        y: { ticks: { color: '#8cad8e', callback: v => fmt(v) }, grid: { color: 'rgba(161,204,165,0.06)' } }
      }
    }
  });

  // Pie chart — category
  if (reportPieChart) reportPieChart.destroy();
  const pCtx = document.getElementById('reportPieChart').getContext('2d');
  reportPieChart = new Chart(pCtx, {
    type: 'doughnut',
    data: {
      labels: sorted.length ? sorted.map(s=>s[0]) : ['No Data'],
      datasets: [{
        data: sorted.length ? sorted.map(s=>s[1]) : [1],
        backgroundColor: sorted.length ? PALETTE.slice(0, sorted.length) : ['#2d5c30'],
        borderColor: '#162019', borderWidth: 2, hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#8cad8e', font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
      },
      cutout: '55%'
    }
  });

  // Monthly summary table
  const tbody = document.getElementById('monthlySummaryBody');
  if (!months.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No data.</td></tr>';
    return;
  }
  tbody.innerHTML = months.reverse().map(m => {
    const inc = txns.filter(t=>t.type==='income'  && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0);
    const exp = txns.filter(t=>t.type==='expense' && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0);
    const sav = inc - exp;
    return `<tr>
      <td>${monthLabel(m)}</td>
      <td style="color:var(--income-clr);font-weight:700">${fmt(inc)}</td>
      <td style="color:var(--expense-clr);font-weight:700">${fmt(exp)}</td>
      <td style="color:${sav>=0?'var(--income-clr)':'var(--expense-clr)'};font-weight:700">${sav>=0?'+':''}${fmt(sav)}</td>
    </tr>`;
  }).join('');
}

['reportPeriod','reportCatFilter'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { if (activeView === 'reports') renderReports(); });
});

/* ══════════════════════════════════════
   GOALS
══════════════════════════════════════ */
let goalDeleteId = null;

function renderGoals() {
  const goals = DB.goals();
  const container = document.getElementById('goalsList');
  if (!goals.length) {
    container.innerHTML = '<div class="empty-state">No goals yet. Set one!</div>';
    return;
  }
  container.innerHTML = goals.map(g => {
    const pct  = Math.min((g.saved / g.target) * 100, 100);
    const done = g.saved >= g.target;
    const remaining = Math.max(g.target - g.saved, 0);
    const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 864e5) : null;
    return `
      <div class="goal-card ${done ? 'completed' : ''}">
        ${done ? '<div class="completed-badge">✅ Completed!</div>' : ''}
        <div class="goal-header">
          <div class="goal-title-wrap">
            <div class="goal-emoji">${g.icon || '🎯'}</div>
            <div>
              <div class="goal-name">${escHtml(g.name)}</div>
              ${g.deadline ? `<div class="goal-deadline">Target: ${fmtDate(g.deadline)}${daysLeft !== null ? ` · ${daysLeft > 0 ? daysLeft+' days left' : 'overdue'}` : ''}</div>` : ''}
            </div>
          </div>
        </div>
        <div class="goal-amounts">
          <span class="goal-saved">${fmt(g.saved)}</span>
          <span class="goal-target">of ${fmt(g.target)}</span>
        </div>
        <div class="goal-progress-bg">
          <div class="goal-progress-fill ${done ? 'done' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="goal-footer">
          <span class="goal-pct">${pct.toFixed(1)}%</span>
          <span class="goal-remaining">${done ? 'Goal reached!' : `${fmt(remaining)} to go`}</span>
        </div>
        <div class="goal-actions">
          <button class="action-btn" onclick="openEditGoal('${g.id}')" title="Edit">✏️</button>
          <button class="action-btn del" onclick="openDeleteGoal('${g.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('openAddGoalModal').addEventListener('click', () => {
  document.getElementById('goalModalTitle').textContent = 'Add Goal';
  document.getElementById('goalForm').reset();
  document.getElementById('goalId').value = '';
  openModal('goalModalOverlay');
});

window.openEditGoal = function(id) {
  const g = DB.goals().find(x => x.id === id);
  if (!g) return;
  document.getElementById('goalModalTitle').textContent = 'Edit Goal';
  document.getElementById('goalId').value       = g.id;
  document.getElementById('goalName').value     = g.name;
  document.getElementById('goalTarget').value   = g.target;
  document.getElementById('goalSaved').value    = g.saved;
  document.getElementById('goalIcon').value     = g.icon || '🎯';
  document.getElementById('goalDeadline').value = g.deadline || '';
  openModal('goalModalOverlay');
};

window.openDeleteGoal = function(id) {
  goalDeleteId = id; txnDeleteId = null; budgetDeleteId = null;
  const g = DB.goals().find(x => x.id === id);
  document.getElementById('deleteMsg').textContent = `Delete goal "${g ? g.name : ''}"?`;
  openModal('deleteModalOverlay');
};

document.getElementById('goalForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id       = document.getElementById('goalId').value;
  const name     = document.getElementById('goalName').value.trim();
  const target   = parseFloat(document.getElementById('goalTarget').value);
  const saved    = parseFloat(document.getElementById('goalSaved').value) || 0;
  const icon     = document.getElementById('goalIcon').value;
  const deadline = document.getElementById('goalDeadline').value || null;

  if (!name || isNaN(target) || target <= 0) { showToast('Fill all required fields.', 'error'); return; }

  const payload = { name, target, saved, icon, deadline };
  try {
    if (id) {
      const updated = await api(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      cache.goals = cache.goals.map(g => g.id === id ? {
        ...updated, target: num(updated.target), saved: num(updated.saved), deadline: updated.deadline || ''
      } : g);
      showToast('Goal updated!');
    } else {
      const created = await api('/goals', { method: 'POST', body: JSON.stringify(payload) });
      cache.goals.push({
        ...created, target: num(created.target), saved: num(created.saved), deadline: created.deadline || ''
      });
      showToast('Goal added!');
    }
    closeModal('goalModalOverlay');
    renderGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

['closeGoalModal','cancelGoalModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => closeModal('goalModalOverlay'));
});

/* ══════════════════════════════════════
   DELETE CONFIRM
══════════════════════════════════════ */
document.getElementById('confirmDelete').addEventListener('click', async () => {
  try {
    if (txnDeleteId) {
      await api(`/transactions/${txnDeleteId}`, { method: 'DELETE' });
      cache.txns = cache.txns.filter(t => t.id !== txnDeleteId);
      showToast('Transaction deleted.', 'error');
      txnDeleteId = null;
      closeModal('deleteModalOverlay');
      renderTransactions();
    } else if (budgetDeleteId) {
      await api(`/budgets/${budgetDeleteId}`, { method: 'DELETE' });
      cache.budgets = cache.budgets.filter(b => b.id !== budgetDeleteId);
      showToast('Budget deleted.', 'error');
      budgetDeleteId = null;
      closeModal('deleteModalOverlay');
      renderBudget();
    } else if (goalDeleteId) {
      await api(`/goals/${goalDeleteId}`, { method: 'DELETE' });
      cache.goals = cache.goals.filter(g => g.id !== goalDeleteId);
      showToast('Goal deleted.', 'error');
      goalDeleteId = null;
      closeModal('deleteModalOverlay');
      renderGoals();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

['closeDeleteModal','cancelDelete'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    txnDeleteId = null; budgetDeleteId = null; goalDeleteId = null;
    closeModal('deleteModalOverlay');
  });
});

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
function renderSettings() {
  const profile = DB.profile();
  const prefs   = DB.prefs();

  document.getElementById('profileName').value  = profile.name;
  document.getElementById('profileEmail').value = profile.email;
  document.getElementById('profileAvatar').textContent = getInitials(profile.name);
  document.getElementById('prefCurrency').value = prefs.currency;
  document.getElementById('prefTheme').value    = prefs.theme;
  document.getElementById('prefNotifs').checked = prefs.notifs;

  // Stats
  document.getElementById('statTxns').textContent    = DB.txns().length;
  document.getElementById('statBudgets').textContent = DB.budgets().length;
  document.getElementById('statGoals').textContent   = DB.goals().length;
  document.getElementById('statSince').textContent   = fmtDate(profile.since || today());

  updateGreeting();
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
}

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const name  = document.getElementById('profileName').value.trim();
  const email = document.getElementById('profileEmail').value.trim();
  try {
    const user = await api('/users/me', { method: 'PUT', body: JSON.stringify({ name, email }) });
    applyUser(user);
    document.getElementById('profileAvatar').textContent = getInitials(name);
    showToast('Profile saved!');
    updateGreeting();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('savePrefsBtn').addEventListener('click', async () => {
  const prefs = {
    currency: document.getElementById('prefCurrency').value,
    theme:    document.getElementById('prefTheme').value,
    notifs:   document.getElementById('prefNotifs').checked
  };
  try {
    const user = await api('/users/me/prefs', { method: 'PUT', body: JSON.stringify(prefs) });
    applyUser(user);
    showToast('Preferences saved!');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('changePwdBtn').addEventListener('click', async () => {
  const curr    = document.getElementById('currPwd').value;
  const newP    = document.getElementById('newPwd').value;
  const confirm = document.getElementById('confirmPwd').value;
  if (!curr || !newP || !confirm) { showToast('Fill all password fields.', 'error'); return; }
  if (newP !== confirm) { showToast('Passwords do not match!', 'error'); return; }
  if (newP.length < 6) { showToast('Password must be at least 6 characters.', 'warning'); return; }
  try {
    await api('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: curr, newPassword: newP })
    });
    showToast('Password changed!');
    document.getElementById('currPwd').value = '';
    document.getElementById('newPwd').value  = '';
    document.getElementById('confirmPwd').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('clearDataBtn').addEventListener('click', async () => {
  if (confirm('This will delete ALL transactions, budgets and goals. Are you sure?')) {
    try {
      await api('/users/me/data', { method: 'DELETE' });
      cache.txns = [];
      cache.budgets = [];
      cache.goals = [];
      showToast('All data cleared.', 'warning');
      renderSettings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
});

function logout() {
  clearSession();
  window.location.href = 'login.html';
}
document.querySelectorAll('a[href="login.html"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
});

/* ══════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      closeModal(overlay.id);
      txnDeleteId = null; budgetDeleteId = null; goalDeleteId = null;
    }
  });
});
// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    closeSidebar();
  }
});

/* ══════════════════════════════════════
   XSS ESCAPE
══════════════════════════════════════ */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('budgetMonthPicker').value = thisMonth();
  try {
    await loadAll();
    updateGreeting();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
});