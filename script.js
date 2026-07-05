(function () {
  'use strict';

  const ENTRIES_PREFIX = 'meudinheiro.entries.v1'; // legado: chave sem perfil
  const PROFILES_KEY = 'meudinheiro.profiles.v1';
  const CURRENT_PROFILE_KEY = 'meudinheiro.currentProfile.v1';
  const THEME_KEY = 'meudinheiro.theme.v1';

  const entriesKeyFor = (profileId) => `${ENTRIES_PREFIX}.${profileId}`;

  /* ---------------- Ícones (linha simples, 24x24) ---------------- */
  const ICONS = {
    alimentacao: '<path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v6M9 3v6M11 3v6M16 3c-1.5 0-2.5 2-2.5 5s1 5 2.5 5v8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    transporte: '<path d="M4 16V9.5a1 1 0 0 1 .6-.9L7 7.5l1.3-2.6A1 1 0 0 1 9.2 4.3h5.6a1 1 0 0 1 .9.6L17 7.5l2.4 1.1a1 1 0 0 1 .6.9V16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M4 16h16v2.5a.5.5 0 0 1-.5.5H18a1 1 0 0 1-1-1v-.5H7v.5a1 1 0 0 1-1 1H4.5a.5.5 0 0 1-.5-.5V16Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/><circle cx="7.5" cy="16" r="1.1" fill="currentColor"/><circle cx="16.5" cy="16" r="1.1" fill="currentColor"/>',
    moradia: '<path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    lazer: '<rect x="3" y="8" width="18" height="9" rx="3" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 11v3M6.5 12.5h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11.3" r="0.9" fill="currentColor"/><circle cx="17.6" cy="13.3" r="0.9" fill="currentColor"/>',
    saude: '<path d="M12 20.5s-7.2-4.4-9.4-8.9C1.2 8.3 3 5 6.3 5c1.9 0 3.3 1 4.2 2.3.4.5 1.6.5 2 0C13.4 6 14.8 5 16.7 5 20 5 21.8 8.3 20.4 11.6 18.2 16.1 12 20.5 12 20.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/>',
    salario: '<rect x="2.5" y="6" width="19" height="12" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M6 8v0M18 16v0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    outros: '<path d="M11.3 3.7 20 12.4a1.5 1.5 0 0 1 0 2.1l-5.5 5.5a1.5 1.5 0 0 1-2.1 0L3.7 11.3a1.5 1.5 0 0 1-.44-1.06V5a1.5 1.5 0 0 1 1.5-1.5h5.5a1.5 1.5 0 0 1 1.06.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/><circle cx="7.3" cy="7.3" r="1.1" fill="currentColor"/>'
  };

  const CATEGORIES = {
    alimentacao: { label: 'Alimentação', color: 'var(--cat-alimentacao)' },
    transporte:  { label: 'Transporte',  color: 'var(--cat-transporte)' },
    moradia:     { label: 'Moradia',     color: 'var(--cat-moradia)' },
    lazer:       { label: 'Lazer',       color: 'var(--cat-lazer)' },
    saude:       { label: 'Saúde',       color: 'var(--cat-saude)' },
    salario:     { label: 'Salário',     color: 'var(--cat-salario)' },
    outros:      { label: 'Outros',      color: 'var(--cat-outros)' }
  };

  /* ---------------- Estado ---------------- */
  let profiles = [];
  let currentProfileId = null;
  let entries = [];
  let editingId = null;

  /* ---------------- DOM refs ---------------- */
  const $ = (id) => document.getElementById(id);
  const themeToggle = $('themeToggle');
  const iconSun = $('iconSun');
  const iconMoon = $('iconMoon');

  const profileSelect = $('profileSelect');
  const profileAdd = $('profileAdd');
  const profileRename = $('profileRename');
  const profileDelete = $('profileDelete');

  const statSaldo = $('statSaldo');
  const statReceitas = $('statReceitas');
  const statDespesas = $('statDespesas');

  const filterMonth = $('filterMonth');
  const filterCategory = $('filterCategory');
  const filterSearch = $('filterSearch');

  const tableBodyReceitas = $('tableBodyReceitas');
  const countReceitas = $('countReceitas');
  const emptyReceitas = $('emptyReceitas');
  const tableReceitas = $('tableReceitas');

  const tableBodyDespesas = $('tableBodyDespesas');
  const countDespesas = $('countDespesas');
  const emptyDespesas = $('emptyDespesas');
  const tableDespesas = $('tableDespesas');

  const btnNovo = $('btnNovo');
  const emptyReceitasBtn = $('emptyReceitasBtn');
  const emptyDespesasBtn = $('emptyDespesasBtn');

  const modalOverlay = $('modalOverlay');
  const modalTitle = $('modalTitle');
  const modalClose = $('modalClose');
  const btnCancelar = $('btnCancelar');
  const entryForm = $('entryForm');
  const entryId = $('entryId');
  const entryDesc = $('entryDesc');
  const entryValor = $('entryValor');
  const entryData = $('entryData');
  const entryCategoria = $('entryCategoria');
  const typeSegment = $('typeSegment');

  const toast = $('toast');
  const chartCanvas = $('chartCanvas');

  // Navegação
  const tabs = document.querySelectorAll('.tab');
  const viewPainel = $('viewPainel');
  const viewInvestimentos = $('viewInvestimentos');

  // Investimentos
  const investForm = $('investForm');
  const investTipo = $('investTipo');
  const investValorInicial = $('investValorInicial');
  const investAporte = $('investAporte');
  const investMeses = $('investMeses');
  const investIR = $('investIR');
  const investCdiTaxa = $('investCdiTaxa');
  const investCdiPercentual = $('investCdiPercentual');
  const investTaxaAnual = $('investTaxaAnual');
  const investIpca = $('investIpca');
  const investIpcaSpread = $('investIpcaSpread');
  const investMensal = $('investMensal');
  const investResults = $('investResults');
  const investResumoHint = $('investResumoHint');
  const investFinalBruto = $('investFinalBruto');
  const investIRStat = $('investIRStat');
  const investIRValor = $('investIRValor');
  const investFinalLiquido = $('investFinalLiquido');
  const investUltimoMes = $('investUltimoMes');
  const investTableBody = $('investTableBody');

  const INVEST_MODES = {
    cdb: 'cdi',
    tesouro_selic: 'annual',
    tesouro_pre: 'annual',
    tesouro_ipca: 'ipca',
    acoes: 'monthly'
  };

  let currentType = 'despesa';

  /* ---------------- Persistência: lançamentos ---------------- */
  function loadEntries() {
    try {
      const raw = localStorage.getItem(entriesKeyFor(currentProfileId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Não foi possível ler os dados salvos.', e);
      return [];
    }
  }

  function saveEntries() {
    localStorage.setItem(entriesKeyFor(currentProfileId), JSON.stringify(entries));
  }

  /* ---------------- Persistência: perfis ---------------- */
  function loadProfiles() {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveProfiles() {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }

  function initProfiles() {
    let loaded = loadProfiles();

    if (!loaded || loaded.length === 0) {
      // migração: dados antigos gravados sem separação por perfil
      const legacyRaw = localStorage.getItem(ENTRIES_PREFIX);
      const firstId = uid();
      profiles = [{ id: firstId, name: 'Usuário 1' }, { id: uid(), name: 'Usuário 2' }];
      saveProfiles();
      if (legacyRaw) {
        localStorage.setItem(entriesKeyFor(firstId), legacyRaw);
        localStorage.removeItem(ENTRIES_PREFIX);
      }
      currentProfileId = firstId;
    } else {
      profiles = loaded;
      currentProfileId = localStorage.getItem(CURRENT_PROFILE_KEY) || profiles[0].id;
      if (!profiles.some((p) => p.id === currentProfileId)) currentProfileId = profiles[0].id;
    }
    localStorage.setItem(CURRENT_PROFILE_KEY, currentProfileId);
  }

  function populateProfileSelect() {
    profileSelect.innerHTML = profiles.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    profileSelect.value = currentProfileId;
    profileDelete.disabled = profiles.length <= 1;
  }

  function switchProfile(id) {
    currentProfileId = id;
    localStorage.setItem(CURRENT_PROFILE_KEY, id);
    editingId = null;
    entries = loadEntries();
    renderAll();
  }

  profileSelect.addEventListener('change', () => switchProfile(profileSelect.value));

  profileAdd.addEventListener('click', () => {
    const name = prompt('Nome do novo perfil:', `Usuário ${profiles.length + 1}`);
    if (!name || !name.trim()) return;
    const id = uid();
    profiles.push({ id, name: name.trim() });
    saveProfiles();
    localStorage.setItem(entriesKeyFor(id), JSON.stringify([]));
    populateProfileSelect();
    switchProfile(id);
    showToast('Perfil criado.');
  });

  profileRename.addEventListener('click', () => {
    const current = profiles.find((p) => p.id === currentProfileId);
    if (!current) return;
    const name = prompt('Renomear perfil:', current.name);
    if (!name || !name.trim()) return;
    current.name = name.trim();
    saveProfiles();
    populateProfileSelect();
    showToast('Perfil renomeado.');
  });

  profileDelete.addEventListener('click', () => {
    if (profiles.length <= 1) { showToast('É preciso manter ao menos um perfil.'); return; }
    const current = profiles.find((p) => p.id === currentProfileId);
    if (!current) return;
    if (!confirm(`Excluir o perfil "${current.name}" e todos os seus lançamentos?`)) return;
    localStorage.removeItem(entriesKeyFor(currentProfileId));
    profiles = profiles.filter((p) => p.id !== currentProfileId);
    saveProfiles();
    populateProfileSelect();
    switchProfile(profiles[0].id);
    showToast('Perfil excluído.');
  });

  /* ---------------- Utilidades ---------------- */
  const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatCurrency = (v) => currencyFmt.format(v);

  function formatDateDisplay(isoDate) {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  function uid() {
    return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function catIcon(catId, size = 14) {
    const svg = ICONS[catId] || ICONS.outros;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${svg}</svg>`;
  }

  /* ---------------- Categorias em selects ---------------- */
  function populateCategorySelects() {
    entryCategoria.innerHTML = Object.entries(CATEGORIES)
      .map(([id, c]) => `<option value="${id}">${c.label}</option>`)
      .join('');

    filterCategory.innerHTML = '<option value="">Todas categorias</option>' +
      Object.entries(CATEGORIES)
        .map(([id, c]) => `<option value="${id}">${c.label}</option>`)
        .join('');
  }

  /* ---------------- Tema ---------------- */
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    iconSun.style.display = theme === 'dark' ? 'none' : 'block';
    iconMoon.style.display = theme === 'dark' ? 'block' : 'none';
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
    renderChart(); // recolore o gráfico para o novo tema
  });

  /* ---------------- Filtros ---------------- */
  function getFilteredEntries() {
    const month = filterMonth.value; // 'YYYY-MM' ou ''
    const cat = filterCategory.value;
    const term = filterSearch.value.trim().toLowerCase();

    return entries.filter((e) => {
      if (month && !e.data.startsWith(month)) return false;
      if (cat && e.categoria !== cat) return false;
      if (term && !e.descricao.toLowerCase().includes(term)) return false;
      return true;
    });
  }

  [filterMonth, filterCategory].forEach((el) => el.addEventListener('change', renderAll));
  filterSearch.addEventListener('input', renderAll);

  /* ---------------- Render: Dashboard ---------------- */
  function renderDashboard(list) {
    let receitas = 0, despesas = 0;
    list.forEach((e) => {
      if (e.tipo === 'receita') receitas += e.valor;
      else despesas += e.valor;
    });
    const saldo = receitas - despesas;

    statSaldo.textContent = formatCurrency(saldo);
    statSaldo.style.color = saldo < 0 ? 'var(--expense)' : '';
    statReceitas.textContent = formatCurrency(receitas);
    statDespesas.textContent = formatCurrency(despesas);
  }

  /* ---------------- Render: Tabelas (receitas e despesas separadas) ---------------- */
  function buildRow(e) {
    const cat = CATEGORIES[e.categoria] || CATEGORIES.outros;
    return `
      <tr data-id="${e.id}">
        <td>${formatDateDisplay(e.data)}</td>
        <td>${escapeHtml(e.descricao)}</td>
        <td><span class="cat-pill" style="color:${cat.color}">${catIcon(e.categoria)} ${cat.label}</span></td>
        <td class="col-right"><span class="amount ${e.tipo === 'receita' ? 'income' : 'expense'}">${formatCurrency(e.valor)}</span></td>
        <td class="col-actions">
          <div class="row-actions">
            <button class="edit" data-action="edit" aria-label="Editar">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </button>
            <button class="del" data-action="del" aria-label="Excluir">
              <svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  function renderSingleTable(list, tbodyEl, countEl, emptyEl, tableEl) {
    const sorted = [...list].sort((a, b) => (a.data < b.data ? 1 : -1));
    countEl.textContent = `${sorted.length} lançamento${sorted.length === 1 ? '' : 's'}`;

    if (sorted.length === 0) {
      tableEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    tableEl.hidden = false;
    emptyEl.hidden = true;
    tbodyEl.innerHTML = sorted.map(buildRow).join('');
  }

  function renderTables(list) {
    renderSingleTable(list.filter((e) => e.tipo === 'receita'), tableBodyReceitas, countReceitas, emptyReceitas, tableReceitas);
    renderSingleTable(list.filter((e) => e.tipo === 'despesa'), tableBodyDespesas, countDespesas, emptyDespesas, tableDespesas);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function handleRowClick(ev) {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const row = ev.target.closest('tr');
    const id = row.dataset.id;
    if (btn.dataset.action === 'edit') openModalEdit(id);
    if (btn.dataset.action === 'del') handleDelete(id);
  }
  tableBodyReceitas.addEventListener('click', handleRowClick);
  tableBodyDespesas.addEventListener('click', handleRowClick);

  /* ---------------- Render: Gráfico ---------------- */
  function renderChart() {
    const ctx = chartCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = chartCanvas.clientWidth || 600;
    const cssHeight = 200;
    chartCanvas.width = cssWidth * dpr;
    chartCanvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // últimos 6 meses (com base em hoje)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') });
    }

    const totals = months.map((m) => {
      let receita = 0, despesa = 0;
      entries.forEach((e) => {
        if (e.data.startsWith(m.key)) {
          if (e.tipo === 'receita') receita += e.valor; else despesa += e.valor;
        }
      });
      return { ...m, receita, despesa };
    });

    const maxVal = Math.max(1, ...totals.map((t) => Math.max(t.receita, t.despesa)));
    const styles = getComputedStyle(document.body);
    const colorIncome = styles.getPropertyValue('--income').trim();
    const colorExpense = styles.getPropertyValue('--expense').trim();
    const colorMuted = styles.getPropertyValue('--text-muted').trim();
    const colorBorder = styles.getPropertyValue('--border').trim();

    const padLeft = 6, padRight = 6, padBottom = 24, padTop = 10;
    const chartW = cssWidth - padLeft - padRight;
    const chartH = cssHeight - padTop - padBottom;
    const groupW = chartW / totals.length;
    const barW = Math.min(20, groupW * 0.28);

    // linha base
    ctx.strokeStyle = colorBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + chartH);
    ctx.lineTo(padLeft + chartW, padTop + chartH);
    ctx.stroke();

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = colorMuted;
    ctx.textAlign = 'center';

    totals.forEach((t, i) => {
      const groupCenter = padLeft + groupW * i + groupW / 2;
      const hReceita = (t.receita / maxVal) * chartH;
      const hDespesa = (t.despesa / maxVal) * chartH;

      drawBar(ctx, groupCenter - barW - 3, padTop + chartH - hReceita, barW, hReceita, colorIncome);
      drawBar(ctx, groupCenter + 3, padTop + chartH - hDespesa, barW, hDespesa, colorExpense);

      ctx.fillStyle = colorMuted;
      ctx.fillText(t.label, groupCenter, cssHeight - 6);
    });
  }

  function drawBar(ctx, x, y, w, h, color) {
    const r = Math.min(4, w / 2);
    ctx.fillStyle = color;
    if (h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------------- Render geral ---------------- */
  function renderAll() {
    const filtered = getFilteredEntries();
    renderDashboard(filtered);
    renderTables(filtered);
    renderChart();
  }

  /* ---------------- Modal ---------------- */
  function setType(type) {
    currentType = type;
    [...typeSegment.children].forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
  }

  typeSegment.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.segment');
    if (btn) setType(btn.dataset.type);
  });

  function openModalNew(type) {
    editingId = null;
    modalTitle.textContent = 'Nova movimentação';
    entryForm.reset();
    entryId.value = '';
    entryData.value = new Date().toISOString().slice(0, 10);
    setType(type === 'receita' ? 'receita' : 'despesa');
    populateCategorySelects();
    entryCategoria.value = type === 'receita' ? 'salario' : 'outros';
    modalOverlay.hidden = false;
    setTimeout(() => entryDesc.focus(), 30);
  }

  function openModalEdit(id) {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    editingId = id;
    modalTitle.textContent = 'Editar movimentação';
    entryId.value = e.id;
    entryDesc.value = e.descricao;
    entryValor.value = e.valor;
    entryData.value = e.data;
    populateCategorySelects();
    entryCategoria.value = e.categoria;
    setType(e.tipo);
    modalOverlay.hidden = false;
    setTimeout(() => entryDesc.focus(), 30);
  }

  function closeModal() {
    modalOverlay.hidden = true;
  }

  btnNovo.addEventListener('click', () => openModalNew());
  emptyReceitasBtn.addEventListener('click', () => openModalNew('receita'));
  emptyDespesasBtn.addEventListener('click', () => openModalNew('despesa'));
  modalClose.addEventListener('click', closeModal);
  btnCancelar.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (ev) => { if (ev.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !modalOverlay.hidden) closeModal(); });

  entryForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const valor = parseFloat(entryValor.value);
    if (isNaN(valor) || valor <= 0) { showToast('Informe um valor válido.'); return; }
    const desc = entryDesc.value.trim();
    if (!desc) { showToast('Informe uma descrição.'); return; }

    const payload = {
      descricao: desc,
      valor: Math.round(valor * 100) / 100,
      data: entryData.value,
      categoria: entryCategoria.value,
      tipo: currentType
    };

    if (editingId) {
      const idx = entries.findIndex((x) => x.id === editingId);
      if (idx > -1) entries[idx] = { ...entries[idx], ...payload };
      showToast('Lançamento atualizado.');
    } else {
      entries.push({ id: uid(), ...payload });
      showToast('Lançamento adicionado.');
    }

    saveEntries();
    closeModal();
    renderAll();
  });

  function handleDelete(id) {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    if (!confirm(`Excluir "${e.descricao}"?`)) return;
    entries = entries.filter((x) => x.id !== id);
    saveEntries();
    showToast('Lançamento excluído.');
    renderAll();
  }

  /* ---------------- Navegação por abas ---------------- */
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((b) => b.classList.toggle('active', b === btn));
      const isPainel = btn.dataset.view === 'painel';
      viewPainel.hidden = !isPainel;
      viewInvestimentos.hidden = isPainel;
      if (isPainel) renderChart();
    });
  });

  /* ---------------- Investimentos ---------------- */
  function updateInvestFieldsVisibility() {
    const mode = INVEST_MODES[investTipo.value];
    investForm.querySelectorAll('[data-mode]').forEach((row) => {
      row.hidden = row.dataset.mode !== mode;
    });
    // IR só faz sentido para renda fixa
    investIRStat.style.display = mode === 'monthly' ? 'none' : '';
    $('investIR').closest('.invest-ir-field').style.display = mode === 'monthly' ? 'none' : '';
  }

  investTipo.addEventListener('change', updateInvestFieldsVisibility);

  function taxaMensalDoInvestimento(mode) {
    let anual = 0;
    if (mode === 'cdi') {
      const cdi = parseFloat(investCdiTaxa.value) || 0;
      const perc = parseFloat(investCdiPercentual.value) || 0;
      anual = (cdi / 100) * (perc / 100);
    } else if (mode === 'annual') {
      anual = (parseFloat(investTaxaAnual.value) || 0) / 100;
    } else if (mode === 'ipca') {
      const ipca = (parseFloat(investIpca.value) || 0) / 100;
      const spread = (parseFloat(investIpcaSpread.value) || 0) / 100;
      anual = (1 + ipca) * (1 + spread) - 1;
    } else if (mode === 'monthly') {
      return (parseFloat(investMensal.value) || 0) / 100;
    }
    return Math.pow(1 + anual, 1 / 12) - 1;
  }

  function aliquotaIR(dias) {
    if (dias <= 180) return 0.225;
    if (dias <= 360) return 0.20;
    if (dias <= 720) return 0.175;
    return 0.15;
  }

  function simulateInvestimento({ valorInicial, aporteMensal, meses, taxaMensal, aplicarIR }) {
    let saldo = valorInicial;
    let totalAportado = valorInicial;
    const rows = [];
    for (let m = 1; m <= meses; m++) {
      const rendimento = saldo * taxaMensal;
      saldo += rendimento;
      if (m < meses || aporteMensal > 0) saldo += aporteMensal;
      totalAportado += aporteMensal;
      rows.push({ mes: m, aporte: aporteMensal, rendimento, saldo });
    }
    const rendimentoTotalBruto = saldo - totalAportado;
    let ir = 0;
    if (aplicarIR && rendimentoTotalBruto > 0) {
      ir = rendimentoTotalBruto * aliquotaIR(meses * 30);
    }
    return { rows, saldoBruto: saldo, rendimentoTotalBruto, ir, saldoLiquido: saldo - ir, totalAportado };
  }

  investForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const mode = INVEST_MODES[investTipo.value];
    const valorInicial = Math.max(0, parseFloat(investValorInicial.value) || 0);
    const aporteMensal = Math.max(0, parseFloat(investAporte.value) || 0);
    const meses = Math.max(1, parseInt(investMeses.value, 10) || 1);
    const taxaMensal = taxaMensalDoInvestimento(mode);
    const aplicarIR = mode !== 'monthly' && investIR.checked;

    const result = simulateInvestimento({ valorInicial, aporteMensal, meses, taxaMensal, aplicarIR });

    investResumoHint.textContent = `${meses} ${meses === 1 ? 'mês' : 'meses'} · taxa de ${(taxaMensal * 100).toFixed(2)}% a.m.`;
    investFinalBruto.textContent = formatCurrency(result.saldoBruto);
    investIRValor.textContent = '− ' + formatCurrency(result.ir);
    investIRStat.style.display = aplicarIR ? '' : 'none';
    investFinalLiquido.textContent = formatCurrency(aplicarIR ? result.saldoLiquido : result.saldoBruto);
    const ultimoMes = result.rows[result.rows.length - 1];
    investUltimoMes.textContent = formatCurrency(ultimoMes ? ultimoMes.rendimento : 0);

    investTableBody.innerHTML = result.rows.map((r) => `
      <tr>
        <td>${r.mes}</td>
        <td class="col-right">${formatCurrency(r.aporte)}</td>
        <td class="col-right"><span class="amount income">${formatCurrency(r.rendimento)}</span></td>
        <td class="col-right">${formatCurrency(r.saldo)}</td>
      </tr>`).join('');

    investResults.hidden = false;
    investResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ---------------- Init ---------------- */
  window.addEventListener('resize', debounce(renderChart, 150));

  function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function init() {
    initTheme();
    initProfiles();
    populateProfileSelect();
    entries = loadEntries();
    populateCategorySelects();
    updateInvestFieldsVisibility();
    renderAll();
  }

  init();
})();
