/* Spendly — personal finance tracker
   Vanilla JS · localStorage · no build step */

(() => {
  "use strict";

  const STORAGE_KEY = "spendly-v1";

  const CATEGORIES = {
    expense: [
      { id: "food", name: "Food & drinks", emoji: "🍔", color: "#fb7185" },
      { id: "transport", name: "Transport", emoji: "🚌", color: "#fbbf24" },
      { id: "shopping", name: "Shopping", emoji: "🛍️", color: "#a78bfa" },
      { id: "bills", name: "Bills & utilities", emoji: "💡", color: "#22d3ee" },
      { id: "health", name: "Health", emoji: "🩺", color: "#34d399" },
      { id: "fun", name: "Entertainment", emoji: "🎬", color: "#f472b6" },
      { id: "other", name: "Other", emoji: "📦", color: "#94a3b8" },
    ],
    income: [
      { id: "salary", name: "Salary", emoji: "💼", color: "#34d399" },
      { id: "freelance", name: "Freelance", emoji: "💻", color: "#22d3ee" },
      { id: "gift", name: "Gift", emoji: "🎁", color: "#fbbf24" },
      { id: "other-income", name: "Other income", emoji: "💰", color: "#94a3b8" },
    ],
  };

  const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income];
  const byId = Object.fromEntries(ALL_CATEGORIES.map((c) => [c.id, c]));

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => new Date();
  const monthOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

  const state = {
    transactions: [],
    budgets: {},
    currency: "PHP",
    theme: "dark",
    month: monthOf(today()),
  };

  let txType = "expense";

  /* ---------- Storage ---------- */

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.transactions)) state.transactions = saved.transactions;
      if (saved.budgets && typeof saved.budgets === "object") state.budgets = saved.budgets;
      if (typeof saved.currency === "string") state.currency = saved.currency;
      if (saved.theme === "light" || saved.theme === "dark") state.theme = saved.theme;
      return true;
    } catch (err) {
      return false;
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          transactions: state.transactions,
          budgets: state.budgets,
          currency: state.currency,
          theme: state.theme,
        })
      );
    } catch (err) {
      toast("Could not save — browser storage is unavailable.");
    }
  }

  function uid() {
    if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "tx-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function money(amount, compact = false) {
    const value = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: state.currency,
        maximumFractionDigits: compact ? 1 : 2,
        notation: compact ? "compact" : "standard",
      }).format(value);
    } catch (err) {
      return value.toFixed(2);
    }
  }

  function shortDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function monthLabel(month) {
    const d = new Date(month + "-01T00:00:00");
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function daysInMonth(month) {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }

  /* ---------- Sample data ---------- */

  function sampleSeed() {
    const now = today();
    const dateIn = (offset, day) => {
      const base = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const max = offset === 0 ? now.getDate() : daysInMonth(monthOf(base));
      base.setDate(Math.min(day, max));
      return toISO(base);
    };

    const rows = [
      ["income", 42000, "salary", "Monthly salary", dateIn(0, 1)],
      ["income", 8500, "freelance", "Landing page project", dateIn(0, 12)],
      ["expense", 12000, "bills", "Apartment rent", dateIn(0, 2)],
      ["expense", 3210, "food", "Groceries for the week", dateIn(0, 4)],
      ["expense", 180, "food", "Coffee with a friend", dateIn(0, 6)],
      ["expense", 1200, "transport", "Monthly transit card", dateIn(0, 7)],
      ["expense", 1699, "bills", "Internet bill", dateIn(0, 9)],
      ["expense", 1450, "food", "Dinner out", dateIn(0, 11)],
      ["expense", 2899, "shopping", "New running shoes", dateIn(0, 14)],
      ["expense", 2100, "bills", "Electricity", dateIn(0, 15)],
      ["expense", 600, "fun", "Movie tickets", dateIn(0, 17)],
      ["expense", 800, "health", "Pharmacy", dateIn(0, 19)],
      ["income", 42000, "salary", "Monthly salary", dateIn(1, 1)],
      ["income", 5000, "freelance", "Logo design", dateIn(1, 16)],
      ["expense", 12000, "bills", "Apartment rent", dateIn(1, 2)],
      ["expense", 5400, "food", "Groceries", dateIn(1, 8)],
      ["expense", 980, "transport", "Fuel", dateIn(1, 10)],
      ["expense", 1699, "bills", "Internet bill", dateIn(1, 9)],
      ["expense", 1200, "shopping", "Clothes", dateIn(1, 18)],
      ["expense", 850, "fun", "Concert ticket", dateIn(1, 22)],
      ["expense", 1500, "health", "Dental checkup", dateIn(1, 24)],
      ["income", 40000, "salary", "Monthly salary", dateIn(2, 1)],
      ["expense", 12000, "bills", "Apartment rent", dateIn(2, 2)],
      ["expense", 6100, "food", "Groceries", dateIn(2, 7)],
      ["expense", 1400, "transport", "Fuel", dateIn(2, 12)],
      ["expense", 3800, "bills", "Electricity and water", dateIn(2, 14)],
      ["expense", 900, "shopping", "Books", dateIn(2, 20)],
      ["income", 40000, "salary", "Monthly salary", dateIn(3, 1)],
      ["expense", 12000, "bills", "Apartment rent", dateIn(3, 2)],
      ["expense", 5800, "food", "Groceries", dateIn(3, 6)],
      ["expense", 1699, "bills", "Internet bill", dateIn(3, 9)],
      ["expense", 1100, "transport", "Fuel", dateIn(3, 13)],
      ["expense", 2200, "shopping", "Desk lamp and cables", dateIn(3, 19)],
      ["income", 40000, "salary", "Monthly salary", dateIn(4, 1)],
      ["expense", 12000, "bills", "Apartment rent", dateIn(4, 2)],
      ["expense", 5600, "food", "Groceries", dateIn(4, 8)],
      ["expense", 2300, "bills", "Electricity", dateIn(4, 14)],
      ["expense", 1200, "fun", "Weekend trip", dateIn(4, 21)],
      ["income", 40000, "salary", "Monthly salary", dateIn(5, 1)],
      ["expense", 12000, "bills", "Apartment rent", dateIn(5, 2)],
      ["expense", 6100, "food", "Groceries", dateIn(5, 7)],
      ["expense", 1350, "transport", "Monthly transit card", dateIn(5, 9)],
      ["expense", 1699, "bills", "Internet bill", dateIn(5, 10)],
      ["expense", 800, "health", "Pharmacy", dateIn(5, 18)],
    ];

    state.transactions = rows.map(([type, amount, category, note, date]) => ({
      id: uid(),
      type,
      amount,
      category,
      note,
      date,
    }));
    state.budgets[monthOf(now)] = 30000;
    save();
  }

  /* ---------- Totals ---------- */

  function monthTransactions(month = state.month) {
    return state.transactions.filter((tx) => tx.date.startsWith(month));
  }

  function totalsFor(month = state.month) {
    let income = 0;
    let expenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    monthTransactions(month).forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === "income") {
        income += amount;
        incomeCount += 1;
      } else {
        expenses += amount;
        expenseCount += 1;
      }
    });

    return {
      income,
      expenses,
      balance: income - expenses,
      savings: income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0,
      incomeCount,
      expenseCount,
    };
  }

  /* ---------- Rendering ---------- */

  function render() {
    renderStats();
    renderCashflow();
    renderBreakdown();
    renderTransactions();
    renderBudget();
    renderInsights();
  }

  function renderStats() {
    const t = totalsFor();
    $("statBalance").textContent = money(t.balance);
    $("statIncome").textContent = money(t.income);
    $("statExpenses").textContent = money(t.expenses);
    $("statSaved").textContent = Math.round(t.savings) + "%";

    $("statBalanceMeta").textContent = t.balance >= 0 ? "Income minus expenses this month" : "You spent more than you earned";
    $("statIncomeMeta").textContent = `${t.incomeCount} transaction${t.incomeCount === 1 ? "" : "s"}`;
    $("statExpensesMeta").textContent = `${t.expenseCount} transaction${t.expenseCount === 1 ? "" : "s"}`;
    $("statSavedMeta").textContent = t.income > 0 ? "Of this month's income" : "Add income to see your rate";
  }

  function renderCashflow() {
    const chart = $("cashflowChart");
    const [y, m] = state.month.split("-").map(Number);
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(y, m - 1 - i, 1);
      months.push(monthOf(d));
    }

    const data = months.map((month) => {
      const t = totalsFor(month);
      return { month, income: t.income, expenses: t.expenses };
    });

    const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expenses)));

    chart.innerHTML = data
      .map((d) => {
        const incomeHeight = Math.max(2, Math.round((d.income / max) * 100));
        const expenseHeight = Math.max(2, Math.round((d.expenses / max) * 100));
        const label = new Date(d.month + "-01T00:00:00").toLocaleDateString("en-US", { month: "short" });
        const current = d.month === state.month ? " is-current" : "";
        return `
          <div class="bar-group${current}">
            <div class="bars">
              <span class="bar bar--income" style="height:${incomeHeight}%" data-value="Income ${money(d.income, true)}" title="Income ${money(d.income)}" tabindex="0" aria-label="${label} income ${money(d.income)}"></span>
              <span class="bar bar--expense" style="height:${expenseHeight}%" data-value="Spent ${money(d.expenses, true)}" title="Expenses ${money(d.expenses)}" tabindex="0" aria-label="${label} expenses ${money(d.expenses)}"></span>
            </div>
            <span class="bar-label">${label}</span>
          </div>`;
      })
      .join("");

    const total = data.reduce((sum, d) => sum + d.income + d.expenses, 0);
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", `Cash flow for the last six months. Total tracked: ${money(total)}.`);
  }

  function renderBreakdown() {
    const expenses = monthTransactions().filter((tx) => tx.type === "expense");
    const grouped = new Map();

    expenses.forEach((tx) => {
      const cat = byId[tx.category] || byId.other;
      grouped.set(cat.id, (grouped.get(cat.id) || 0) + Number(tx.amount || 0));
    });

    const rows = [...grouped.entries()]
      .map(([id, amount]) => ({ ...byId[id], amount }))
      .sort((a, b) => b.amount - a.amount);

    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    const circumference = 2 * Math.PI * 54;
    let offset = 0;

    $("donutSegments").innerHTML = rows
      .map((row) => {
        const length = total > 0 ? (row.amount / total) * circumference : 0;
        const visible = Math.max(0, length - 1.5);
        const seg = `<circle class="donut-seg" cx="70" cy="70" r="54" stroke="${row.color}" stroke-dasharray="${visible} ${circumference - visible}" stroke-dashoffset="${-offset}" transform="rotate(-90 70 70)"></circle>`;
        offset += length;
        return seg;
      })
      .join("");

    $("donutTotal").textContent = money(total, true);
    $("donutSvg").setAttribute("aria-label", total ? `Expenses by category, total ${money(total)}` : "No expenses this month");
    $("breakdownSub").textContent = total ? `${rows.length} categor${rows.length === 1 ? "y" : "ies"} · ${monthLabel(state.month)}` : "Spending by category";

    const list = $("breakdownList");
    if (!rows.length) {
      list.innerHTML = '<li class="breakdown-empty">No expenses recorded this month.</li>';
      return;
    }

    list.innerHTML = rows
      .map((row) => {
        const pct = Math.round((row.amount / total) * 100);
        return `<li>
          <span class="swatch" style="background:${row.color}"></span>
          <span class="name">${row.name} · ${pct}%</span>
          <span class="amount">${money(row.amount)}</span>
        </li>`;
      })
      .join("");
  }

  function getFilteredTransactions() {
    const search = $("searchInput").value.trim().toLowerCase();
    const type = $("typeFilter").value;
    const category = $("categoryFilter").value;

    return monthTransactions()
      .filter((tx) => {
        if (type !== "all" && tx.type !== type) return false;
        if (category !== "all" && tx.category !== category) return false;
        if (!search) return true;
        const cat = byId[tx.category];
        return `${tx.note || ""} ${cat ? cat.name : ""}`.toLowerCase().includes(search);
      })
      .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
  }

  function renderTransactions() {
    const list = $("txList");
    const empty = $("txEmpty");
    const rows = getFilteredTransactions();
    const monthRows = monthTransactions();

    list.innerHTML = rows
      .map((tx) => {
        const cat = byId[tx.category] || byId.other;
        const isIncome = tx.type === "income";
        const sign = isIncome ? "+" : "−";
        return `<div class="tx-row" data-id="${tx.id}">
          <div class="tx-main">
            <span class="tx-icon" aria-hidden="true">${cat.emoji}</span>
            <div>
              <strong>${escapeHTML(tx.note || cat.name)}</strong>
              <span class="tx-cat">${cat.name}</span>
            </div>
          </div>
          <span class="tx-date">${shortDate(tx.date)}</span>
          <span class="tx-amount ${isIncome ? "is-income" : "is-expense"}">${sign}${money(tx.amount)}</span>
          <div class="tx-actions">
            <button type="button" data-action="edit" data-id="${tx.id}" aria-label="Edit ${escapeHTML(tx.note || cat.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>
            </button>
            <button type="button" data-action="delete" data-id="${tx.id}" aria-label="Delete ${escapeHTML(tx.note || cat.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        </div>`;
      })
      .join("");

    const noData = monthRows.length === 0;
    const noMatches = !noData && rows.length === 0;

    empty.hidden = rows.length > 0;
    if (rows.length === 0) {
      const title = empty.querySelector("h3");
      const text = empty.querySelector("p");
      const actions = empty.querySelector(".empty-actions");
      if (noData) {
        title.textContent = "No transactions yet";
        text.textContent = "Add your first one, or load a set of sample data to explore Spendly.";
        actions.innerHTML = '<button class="btn btn--primary btn--sm" type="button" data-open-add>Add transaction</button><button class="btn btn--ghost btn--sm" id="sampleBtn" type="button">Load sample data</button>';
        bindEmptyActions();
      } else if (noMatches) {
        title.textContent = "No matches found";
        text.textContent = "Try a different search, type, or category.";
        actions.innerHTML = '<button class="btn btn--ghost btn--sm" type="button" id="clearFilters">Clear filters</button>';
        $("clearFilters").addEventListener("click", clearFilters);
      }
    }

    $("txSub").textContent = `${monthRows.length} transaction${monthRows.length === 1 ? "" : "s"} in ${monthLabel(state.month)}.`;
  }

  function renderBudget() {
    const budget = Number(state.budgets[state.month]) || 0;
    const spent = totalsFor().expenses;
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

    $("budgetMonth").textContent = monthLabel(state.month);
    $("budgetInput").value = budget > 0 ? budget : "";
    $("budgetTotal").textContent = budget > 0 ? `${money(budget)} budget` : "No budget set";
    $("budgetSpent").textContent = `${money(spent)} spent`;
    $("budgetBar").style.width = pct + "%";
    $("budgetProgress").setAttribute("aria-valuenow", String(Math.round(pct)));
    $("budgetProgress").classList.toggle("is-over", budget > 0 && spent > budget);

    if (budget <= 0) {
      $("budgetRemaining").textContent = "Set a budget";
      $("budgetRemaining").style.color = "";
    } else if (remaining < 0) {
      $("budgetRemaining").textContent = money(Math.abs(remaining)) + " over";
      $("budgetRemaining").style.color = "var(--expense)";
    } else {
      $("budgetRemaining").textContent = money(remaining);
      $("budgetRemaining").style.color = "";
    }
  }

  function renderInsights() {
    const expenses = monthTransactions().filter((tx) => tx.type === "expense");
    const total = expenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    if (!expenses.length) {
      $("insightTop").textContent = "—";
      $("insightTopAmount").textContent = "No expenses yet";
      $("insightAvg").textContent = money(0);
      $("insightBiggest").textContent = "—";
      $("insightBiggestAmount").textContent = "No expenses yet";
      return;
    }

    const grouped = new Map();
    expenses.forEach((tx) => {
      const cat = byId[tx.category] || byId.other;
      grouped.set(cat.id, (grouped.get(cat.id) || 0) + Number(tx.amount || 0));
    });
    const top = [...grouped.entries()].map(([id, amount]) => ({ ...byId[id], amount })).sort((a, b) => b.amount - a.amount)[0];

    const now = today();
    const isCurrent = state.month === monthOf(now);
    const days = isCurrent ? now.getDate() : daysInMonth(state.month);
    const avg = total / Math.max(1, days);

    const biggest = expenses.reduce((max, tx) => (Number(tx.amount) > Number(max.amount) ? tx : max), expenses[0]);

    $("insightTop").textContent = top.name;
    $("insightTopAmount").textContent = `${money(top.amount)} · ${Math.round((top.amount / total) * 100)}% of spending`;
    $("insightAvg").textContent = money(avg);
    $("insightBiggest").textContent = biggest.note || (byId[biggest.category] || byId.other).name;
    $("insightBiggestAmount").textContent = `${money(biggest.amount)} · ${shortDate(biggest.date)}`;
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------- Filters ---------- */

  function populateCategoryFilter() {
    const select = $("categoryFilter");
    const current = select.value;
    select.innerHTML = '<option value="all">All categories</option>';
    ["expense", "income"].forEach((type) => {
      const group = document.createElement("optgroup");
      group.label = type === "expense" ? "Expense categories" : "Income categories";
      CATEGORIES[type].forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
    select.value = current || "all";
  }

  function clearFilters() {
    $("searchInput").value = "";
    $("typeFilter").value = "all";
    $("categoryFilter").value = "all";
    renderTransactions();
  }

  /* ---------- Modal ---------- */

  const modal = $("txModal");
  const form = $("txForm");
  const typeRadios = form.querySelectorAll('input[name="type"]');

  function fillCategorySelect(type, selected) {
    const select = $("txCategory");
    select.innerHTML = CATEGORIES[type]
      .map((cat) => `<option value="${cat.id}">${cat.emoji} ${cat.name}</option>`)
      .join("");
    if (selected) select.value = selected;
  }

  function openModal(tx = null) {
    form.reset();
    $("formError").hidden = true;

    if (tx) {
      $("modalEyebrow").textContent = "Edit entry";
      $("modalTitle").textContent = "Edit transaction";
      $("modalSave").textContent = "Save changes";
      $("txId").value = tx.id;
      $("txAmount").value = tx.amount;
      $("txDate").value = tx.date;
      $("txNote").value = tx.note || "";
      txType = tx.type;
      form.querySelector(`input[name="type"][value="${tx.type}"]`).checked = true;
      fillCategorySelect(tx.type, tx.category);
    } else {
      $("modalEyebrow").textContent = "New entry";
      $("modalTitle").textContent = "Add transaction";
      $("modalSave").textContent = "Save transaction";
      $("txId").value = "";
      $("txDate").value = toISO(today());
      txType = "expense";
      form.querySelector('input[name="type"][value="expense"]').checked = true;
      fillCategorySelect("expense");
    }

    modal.showModal();
    setTimeout(() => $("txAmount").focus(), 30);
  }

  function closeModal() {
    if (modal.open) modal.close();
  }

  typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      txType = radio.value;
      fillCategorySelect(txType);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = $("formError");
    const amount = Number($("txAmount").value);
    const date = $("txDate").value;
    const category = $("txCategory").value;
    const note = $("txNote").value.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      error.textContent = "Enter an amount greater than zero.";
      error.hidden = false;
      $("txAmount").focus();
      return;
    }
    if (!date) {
      error.textContent = "Choose a date.";
      error.hidden = false;
      $("txDate").focus();
      return;
    }
    if (!category) {
      error.textContent = "Choose a category.";
      error.hidden = false;
      return;
    }

    error.hidden = true;
    const id = $("txId").value;
    const payload = {
      id: id || uid(),
      type: txType,
      amount: Math.round(amount * 100) / 100,
      category,
      note: note || (byId[category] ? byId[category].name : "Transaction"),
      date,
    };

    if (id) {
      const index = state.transactions.findIndex((tx) => tx.id === id);
      if (index >= 0) state.transactions[index] = payload;
    } else {
      state.transactions.push(payload);
    }

    state.month = date.slice(0, 7);
    $("monthPicker").value = state.month;
    save();
    render();
    closeModal();
    toast(id ? "Transaction updated" : "Transaction added");
  });

  $("modalClose").addEventListener("click", closeModal);
  $("modalCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  /* ---------- Transactions events ---------- */

  $("txList").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.getAttribute("data-id");
    const tx = state.transactions.find((item) => item.id === id);
    if (!tx) return;

    if (button.getAttribute("data-action") === "edit") {
      openModal(tx);
    } else if (button.getAttribute("data-action") === "delete") {
      if (window.confirm(`Delete "${tx.note}"?`)) {
        state.transactions = state.transactions.filter((item) => item.id !== id);
        save();
        render();
        toast("Transaction deleted");
      }
    }
  });

  function bindEmptyActions() {
    document.querySelectorAll("[data-open-add]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => openModal());
    });
    const sample = $("sampleBtn");
    if (sample) {
      sample.addEventListener("click", () => {
        sampleSeed();
        render();
        toast("Sample data loaded");
      });
    }
  }

  /* ---------- Top bar ---------- */

  $("monthPicker").addEventListener("change", (event) => {
    state.month = event.target.value || monthOf(today());
    render();
  });

  $("currencyPicker").addEventListener("change", (event) => {
    state.currency = event.target.value;
    save();
    render();
    toast("Currency changed to " + state.currency);
  });

  $("themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    applyTheme();
    save();
  });

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const toggle = $("themeToggle");
    const isLight = state.theme === "light";
    toggle.setAttribute("aria-pressed", String(isLight));
    toggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isLight ? "#f2f7f4" : "#080c14");
  }

  $("addBtn").addEventListener("click", () => openModal());
  bindEmptyActions();

  /* ---------- Filters events ---------- */

  $("searchInput").addEventListener("input", renderTransactions);
  $("typeFilter").addEventListener("change", renderTransactions);
  $("categoryFilter").addEventListener("change", renderTransactions);

  /* ---------- Export ---------- */

  $("exportBtn").addEventListener("click", () => {
    const rows = getFilteredTransactions();
    if (!rows.length) {
      toast("Nothing to export for this view");
      return;
    }
    const header = ["Date", "Type", "Category", "Note", "Amount", "Currency"];
    const lines = rows.map((tx) => {
      const cat = byId[tx.category] || byId.other;
      return [tx.date, tx.type, cat.name, tx.note, tx.amount, state.currency]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spendly-${state.month}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Exported ${rows.length} transaction${rows.length === 1 ? "" : "s"}`);
  });

  /* ---------- Budget ---------- */

  $("budgetForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = Number($("budgetInput").value);
    if (!Number.isFinite(value) || value < 0) {
      toast("Enter a valid budget amount");
      return;
    }
    if (value === 0) delete state.budgets[state.month];
    else state.budgets[state.month] = Math.round(value * 100) / 100;
    save();
    renderBudget();
    toast(value === 0 ? "Budget cleared" : "Budget saved");
  });

  /* ---------- Reset ---------- */

  $("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Clear all Spendly data from this browser? This cannot be undone.")) return;
    state.transactions = [];
    state.budgets = {};
    save();
    render();
    toast("All data cleared");
  });

  /* ---------- Navigation ---------- */

  const sideLinks = [...document.querySelectorAll(".side-link")];
  const sections = sideLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          sideLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* ---------- Toast ---------- */

  let toastTimer = null;
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
  }

  /* ---------- Init ---------- */

  const hadData = load();
  if (!hadData) sampleSeed();
  if (!state.budgets[state.month] && !hadData) state.budgets[state.month] = 30000;

  state.month = state.month || monthOf(today());
  $("monthPicker").value = state.month;
  $("currencyPicker").value = state.currency;
  applyTheme();
  populateCategoryFilter();
  render();
  bindEmptyActions();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
