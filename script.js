(function () {
  'use strict';

  const ENTRIES_PREFIX = 'meudinheiro.entries.v1'; // legado: chave sem perfil
  const PROFILES_KEY = 'meudinheiro.profiles.v1';
  const CURRENT_PROFILE_KEY = 'meudinheiro.currentProfile.v1';
  const THEME_KEY = 'meudinheiro.theme.v1';
  const CARDS_PREFIX = 'meudinheiro.cards.v1';
  const RECURRING_PREFIX = 'meudinheiro.recurring.v1';
  const GOALS_PREFIX = 'meudinheiro.goals.v1';
  const DEBTS_PREFIX = 'meudinheiro.debts.v1';
  const BUDGETS_PREFIX = 'meudinheiro.budgets.v1';
  const IGNORED_SUGGESTIONS_PREFIX = 'meudinheiro.ignoredSuggestions.v1';
  const ACCOUNTS_PREFIX = 'meudinheiro.accounts.v1';

  const entriesKeyFor = (profileId) => `${ENTRIES_PREFIX}.${profileId}`;
  const cardsKeyFor = (profileId) => `${CARDS_PREFIX}.${profileId}`;
  const recurringKeyFor = (profileId) => `${RECURRING_PREFIX}.${profileId}`;
  const goalsKeyFor = (profileId) => `${GOALS_PREFIX}.${profileId}`;
  const debtsKeyFor = (profileId) => `${DEBTS_PREFIX}.${profileId}`;
  const budgetsKeyFor = (profileId) => `${BUDGETS_PREFIX}.${profileId}`;
  const ignoredSuggestionsKeyFor = (profileId) => `${IGNORED_SUGGESTIONS_PREFIX}.${profileId}`;
  const accountsKeyFor = (profileId) => `${ACCOUNTS_PREFIX}.${profileId}`;

  const APP_ID = 'meudinheiro';
  const BACKUP_VERSION = 1;
  const LAST_BACKUP_KEY = 'meudinheiro.lastBackup.v1';

  /* ---------------- Camada de armazenamento ----------------
     Todo acesso ao localStorage passa por aqui. Se um dia isso virar
     uma API + banco de dados, só este objeto precisa mudar — o resto
     do app continua chamando Storage.read/write/remove normalmente. */
  const Storage = {
    read(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch (e) {
        console.warn(`Storage: falha ao ler "${key}".`, e);
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn(`Storage: falha ao gravar "${key}" (armazenamento cheio?).`, e);
        return false;
      }
    },
    remove(key) {
      localStorage.removeItem(key);
    },
    readRaw(key) {
      return localStorage.getItem(key);
    },
    writeRaw(key, str) {
      localStorage.setItem(key, str);
    }
  };

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

  const ACCOUNT_ICONS = {
    carteira: '<rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.6"/><circle cx="16.5" cy="14.5" r="1" fill="currentColor"/>',
    banco: '<path d="M3 10 12 4l9 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    dinheiro: '<rect x="2.5" y="6" width="19" height="12" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    investimento: '<path d="M4 19V9M10 19V5M16 19v-7M4 19h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    cartao: '<rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M2.5 9.5h19" stroke="currentColor" stroke-width="1.6"/>',
    outro: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  // Agrupa os tipos de conta nas 4 categorias da composição do patrimônio
  const ACCOUNT_GROUP_MAP = {
    banco: 'Bancos',
    carteira: 'Carteira',
    dinheiro: 'Carteira',
    investimento: 'Investimentos',
    cartao: 'Outros ativos',
    outro: 'Outros ativos'
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
  let cards = [];
  let recurring = [];
  let goals = [];
  let accounts = [];
  let debts = [];
  let budgets = [];
  let ignoredSuggestions = [];
  let editingId = null;
  let editingCardId = null;
  let editingRecId = null;
  let editingGoalId = null;
  let editingAccountId = null;
  let editingDebtId = null;
  let editingBudgetId = null;

  /* ---------------- DOM refs ---------------- */
  const $ = (id) => document.getElementById(id);
  const themeToggle = $('themeToggle');
  const iconSun = $('iconSun');
  const iconMoon = $('iconMoon');

  const profileSelect = $('profileSelect');
  const profileAdd = $('profileAdd');
  const profileRename = $('profileRename');
  const profileDelete = $('profileDelete');

  const statPatrimonioTotal = $('statPatrimonioTotal');
  const statPatrimonioLiquido = $('statPatrimonioLiquido');
  const statPatrimonioLiquidoSub = $('statPatrimonioLiquidoSub');
  const toggleComposicaoBtn = $('toggleComposicaoBtn');
  const composicaoPanel = $('composicaoPanel');
  const composicaoList = $('composicaoList');
  const ultimasMovList = $('ultimasMovList');
  const topCategoriasList = $('topCategoriasList');
  const statReceitas = $('statReceitas');
  const statDespesas = $('statDespesas');
  const statEconomia = $('statEconomia');
  const statEconomiaCard = $('statEconomiaCard');
  const statPercentual = $('statPercentual');
  const statPercentualBar = $('statPercentualBar');

  const filterPeriod = $('filterPeriod');
  const customPeriodWrap = $('customPeriodWrap');
  const filterDateStart = $('filterDateStart');
  const filterDateEnd = $('filterDateEnd');
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
  const entryConta = $('entryConta');
  const typeSegment = $('typeSegment');
  const entryComprovanteInput = $('entryComprovanteInput');
  const comprovantePreviewWrap = $('comprovantePreviewWrap');
  const comprovantePreviewImg = $('comprovantePreviewImg');
  const comprovanteRemoveBtn = $('comprovanteRemoveBtn');
  const lightboxOverlay = $('lightboxOverlay');
  const lightboxImg = $('lightboxImg');
  const lightboxClose = $('lightboxClose');
  let currentComprovante = null;

  const backupBtn = $('backupBtn');
  const backupOverlay = $('backupOverlay');
  const backupClose = $('backupClose');
  const backupLastDate = $('backupLastDate');
  const backupLastVersion = $('backupLastVersion');
  const backupLastCount = $('backupLastCount');
  const backupCurrentHint = $('backupCurrentHint');
  const backupExportBtn = $('backupExportBtn');
  const backupImportInput = $('backupImportInput');

  const toast = $('toast');
  const chartCanvas = $('chartCanvas');

  // Navegação
  const tabs = document.querySelectorAll('.tab');
  const views = {
    painel: $('viewPainel'),
    contas: $('viewContas'),
    recorrentes: $('viewRecorrentes'),
    cartao: $('viewCartao'),
    metas: $('viewMetas'),
    orcamento: $('viewOrcamento'),
    insights: $('viewInsights'),
    resumo: $('viewResumo'),
    investimentos: $('viewInvestimentos')
  };

  // Contas
  const accountForm = $('accountForm');
  const accountId = $('accountId');
  const accountNome = $('accountNome');
  const accountSaldoInicial = $('accountSaldoInicial');
  const accountIcone = $('accountIcone');
  const accountCor = $('accountCor');
  const accountSubmitBtn = $('accountSubmitBtn');
  const accountList = $('accountList');
  const accountCount = $('accountCount');
  const emptyAccounts = $('emptyAccounts');

  // Recorrências
  const recForm = $('recForm');
  const recId = $('recId');
  const recDesc = $('recDesc');
  const recValor = $('recValor');
  const recCategoria = $('recCategoria');
  const recDia = $('recDia');
  const recConta = $('recConta');
  const recTypeSegment = $('recTypeSegment');
  const recSubmitBtn = $('recSubmitBtn');
  const recList = $('recList');
  const recCount = $('recCount');
  const emptyRec = $('emptyRec');
  const suggestionsCard = $('suggestionsCard');
  const suggestionsList = $('suggestionsList');
  let recCurrentType = 'despesa';

  // Cartões
  const cardForm = $('cardForm');
  const cardId = $('cardId');
  const cardNome = $('cardNome');
  const cardLimite = $('cardLimite');
  const cardUsado = $('cardUsado');
  const cardFechamento = $('cardFechamento');
  const cardVencimento = $('cardVencimento');
  const cardSubmitBtn = $('cardSubmitBtn');
  const cardList = $('cardList');
  const cardCount = $('cardCount');
  const emptyCards = $('emptyCards');

  // Dívidas
  const debtForm = $('debtForm');
  const debtId = $('debtId');
  const debtNome = $('debtNome');
  const debtValor = $('debtValor');
  const debtSubmitBtn = $('debtSubmitBtn');
  const debtList = $('debtList');
  const debtCount = $('debtCount');
  const emptyDebts = $('emptyDebts');

  // Orçamentos
  const budgetForm = $('budgetForm');
  const budgetId = $('budgetId');
  const budgetCategoria = $('budgetCategoria');
  const budgetLimite = $('budgetLimite');
  const budgetSubmitBtn = $('budgetSubmitBtn');
  const budgetList = $('budgetList');
  const budgetCount = $('budgetCount');
  const emptyBudgets = $('emptyBudgets');

  // Insights
  const insightsList = $('insightsList');

  // Resumo mensal
  const resumoMesInput = $('resumoMesInput');
  const resumoReceitas = $('resumoReceitas');
  const resumoDespesas = $('resumoDespesas');
  const resumoEconomia = $('resumoEconomia');
  const resumoQuantidade = $('resumoQuantidade');
  const resumoEvolucaoList = $('resumoEvolucaoList');
  const resumoMediaHint = $('resumoMediaHint');
  const resumoDestaques = $('resumoDestaques');
  const resumoCategoriasUsadas = $('resumoCategoriasUsadas');

  // Previsão do mês
  const previsaoHint = $('previsaoHint');
  const previsaoContent = $('previsaoContent');
  const previsaoEmpty = $('previsaoEmpty');
  const previsaoSaldoFinal = $('previsaoSaldoFinal');
  const previsaoPodeGastar = $('previsaoPodeGastar');
  const previsaoEconomia = $('previsaoEconomia');

  // Metas
  const goalForm = $('goalForm');
  const goalId = $('goalId');
  const goalNome = $('goalNome');
  const goalAlvo = $('goalAlvo');
  const goalAtual = $('goalAtual');
  const goalPrazo = $('goalPrazo');
  const goalSubmitBtn = $('goalSubmitBtn');
  const goalList = $('goalList');
  const goalCount = $('goalCount');
  const emptyGoals = $('emptyGoals');

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
    return Storage.read(entriesKeyFor(currentProfileId), []);
  }

  function saveEntries() {
    Storage.write(entriesKeyFor(currentProfileId), entries);
  }

  function loadList(keyFn) {
    return Storage.read(keyFn(currentProfileId), []);
  }

  const loadCards = () => loadList(cardsKeyFor);
  const saveCards = () => Storage.write(cardsKeyFor(currentProfileId), cards);
  const loadRecurring = () => loadList(recurringKeyFor);
  const saveRecurring = () => Storage.write(recurringKeyFor(currentProfileId), recurring);
  const loadGoals = () => loadList(goalsKeyFor);
  const saveGoals = () => Storage.write(goalsKeyFor(currentProfileId), goals);
  const loadAccounts = () => loadList(accountsKeyFor);
  const saveAccounts = () => Storage.write(accountsKeyFor(currentProfileId), accounts);
  const loadDebts = () => loadList(debtsKeyFor);
  const saveDebts = () => Storage.write(debtsKeyFor(currentProfileId), debts);
  const loadBudgets = () => loadList(budgetsKeyFor);
  const saveBudgets = () => Storage.write(budgetsKeyFor(currentProfileId), budgets);
  const loadIgnoredSuggestions = () => loadList(ignoredSuggestionsKeyFor);
  const saveIgnoredSuggestions = () => Storage.write(ignoredSuggestionsKeyFor(currentProfileId), ignoredSuggestions);

  /* ---------------- Migração: garante ao menos 1 conta e vincula dados antigos ---------------- */
  function ensureAccountsForProfile() {
    if (accounts.length === 0) {
      accounts.push({ id: uid(), nome: 'Carteira', saldoInicial: 0, cor: '#1F6F5C', icone: 'carteira' });
      saveAccounts();
    }
    const defaultAccountId = accounts[0].id;

    let entriesChanged = false;
    entries.forEach((e) => { if (!e.conta) { e.conta = defaultAccountId; entriesChanged = true; } });
    if (entriesChanged) saveEntries();

    let recChanged = false;
    recurring.forEach((r) => { if (!r.conta) { r.conta = defaultAccountId; recChanged = true; } });
    if (recChanged) saveRecurring();
  }

  /* ---------------- Persistência: perfis ---------------- */
  function loadProfiles() {
    return Storage.read(PROFILES_KEY, null);
  }

  function saveProfiles() {
    Storage.write(PROFILES_KEY, profiles);
  }

  function initProfiles() {
    let loaded = loadProfiles();

    if (!loaded || loaded.length === 0) {
      // migração: dados antigos gravados sem separação por perfil
      const legacyRaw = Storage.readRaw(ENTRIES_PREFIX);
      const firstId = uid();
      profiles = [{ id: firstId, name: 'Usuário 1' }, { id: uid(), name: 'Usuário 2' }];
      saveProfiles();
      if (legacyRaw) {
        Storage.writeRaw(entriesKeyFor(firstId), legacyRaw);
        Storage.remove(ENTRIES_PREFIX);
      }
      currentProfileId = firstId;
    } else {
      profiles = loaded;
      currentProfileId = Storage.readRaw(CURRENT_PROFILE_KEY) || profiles[0].id;
      if (!profiles.some((p) => p.id === currentProfileId)) currentProfileId = profiles[0].id;
    }
    Storage.writeRaw(CURRENT_PROFILE_KEY, currentProfileId);
  }

  function populateProfileSelect() {
    profileSelect.innerHTML = profiles.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    profileSelect.value = currentProfileId;
    profileDelete.disabled = profiles.length <= 1;
  }

  function switchProfile(id) {
    currentProfileId = id;
    Storage.writeRaw(CURRENT_PROFILE_KEY, id);
    editingId = null;
    entries = loadEntries();
    cards = loadCards();
    recurring = loadRecurring();
    goals = loadGoals();
    accounts = loadAccounts();
    debts = loadDebts();
    budgets = loadBudgets();
    ignoredSuggestions = loadIgnoredSuggestions();
    ensureAccountsForProfile();
    generateRecurringEntries();
    populateAccountSelects();
    populateBudgetCategoriaSelect();
    renderAll();
    renderCards();
    renderRecurring();
    renderGoals();
    renderAccounts();
    renderDebts();
  }

  profileSelect.addEventListener('change', () => switchProfile(profileSelect.value));

  profileAdd.addEventListener('click', () => {
    const name = prompt('Nome do novo perfil:', `Usuário ${profiles.length + 1}`);
    if (!name || !name.trim()) return;
    const id = uid();
    profiles.push({ id, name: name.trim() });
    saveProfiles();
    Storage.write(entriesKeyFor(id), []);
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
    Storage.remove(entriesKeyFor(currentProfileId));
    Storage.remove(cardsKeyFor(currentProfileId));
    Storage.remove(recurringKeyFor(currentProfileId));
    Storage.remove(goalsKeyFor(currentProfileId));
    Storage.remove(accountsKeyFor(currentProfileId));
    Storage.remove(debtsKeyFor(currentProfileId));
    Storage.remove(budgetsKeyFor(currentProfileId));
    Storage.remove(ignoredSuggestionsKeyFor(currentProfileId));
    profiles = profiles.filter((p) => p.id !== currentProfileId);
    saveProfiles();
    populateProfileSelect();
    switchProfile(profiles[0].id);
    showToast('Perfil excluído.');
  });

  /* ---------------- Backup e restauração ---------------- */
  function formatDateTimeDisplay(iso) {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function computeTotalsForProfiles(profileList) {
    let totalEntries = 0, totalCards = 0, totalRecurring = 0, totalGoals = 0, totalAccounts = 0, totalDebts = 0, totalBudgets = 0;
    profileList.forEach((p) => {
      totalEntries += Storage.read(entriesKeyFor(p.id), []).length;
      totalCards += Storage.read(cardsKeyFor(p.id), []).length;
      totalRecurring += Storage.read(recurringKeyFor(p.id), []).length;
      totalGoals += Storage.read(goalsKeyFor(p.id), []).length;
      totalAccounts += Storage.read(accountsKeyFor(p.id), []).length;
      totalDebts += Storage.read(debtsKeyFor(p.id), []).length;
      totalBudgets += Storage.read(budgetsKeyFor(p.id), []).length;
    });
    return { entries: totalEntries, cards: totalCards, recurring: totalRecurring, goals: totalGoals, accounts: totalAccounts, debts: totalDebts, budgets: totalBudgets, profiles: profileList.length };
  }

  function totalsToRecordCount(totals) {
    return totals.entries + totals.cards + totals.recurring + totals.goals + (totals.accounts || 0) + (totals.debts || 0) + (totals.budgets || 0);
  }

  function buildBackupPayload() {
    const data = {};
    profiles.forEach((p) => {
      data[p.id] = {
        entries: Storage.read(entriesKeyFor(p.id), []),
        cards: Storage.read(cardsKeyFor(p.id), []),
        recurring: Storage.read(recurringKeyFor(p.id), []),
        goals: Storage.read(goalsKeyFor(p.id), []),
        accounts: Storage.read(accountsKeyFor(p.id), []),
        debts: Storage.read(debtsKeyFor(p.id), []),
        budgets: Storage.read(budgetsKeyFor(p.id), [])
      };
    });
    return {
      app: APP_ID,
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      theme: document.body.getAttribute('data-theme'),
      currentProfileId,
      profiles,
      data
    };
  }

  function validateBackupPayload(payload) {
    const problems = [];
    if (!payload || typeof payload !== 'object') { problems.push('o arquivo não tem o formato esperado.'); return problems; }
    if (payload.app !== APP_ID) problems.push('este arquivo não parece ser um backup do Meu Dinheiro.');
    if (typeof payload.backupVersion !== 'number' || payload.backupVersion > BACKUP_VERSION) problems.push('este backup foi feito em uma versão não suportada do app.');
    if (!Array.isArray(payload.profiles) || payload.profiles.length === 0) problems.push('o arquivo não contém nenhum perfil.');
    if (!payload.data || typeof payload.data !== 'object') problems.push('o arquivo não contém dados de lançamentos.');
    return problems;
  }

  function renderBackupInfo() {
    const info = Storage.read(LAST_BACKUP_KEY, null);
    backupLastDate.textContent = info ? formatDateTimeDisplay(info.date) : 'Nunca realizado';
    backupLastVersion.textContent = info ? `v${info.version}` : '—';
    backupLastCount.textContent = info ? `${info.records} registro(s)` : '—';

    const totals = computeTotalsForProfiles(profiles);
    backupCurrentHint.textContent = `Este backup incluirá ${totals.profiles} perfil(is): ${totals.accounts} conta(s), ${totals.entries} lançamento(s), ${totals.cards} cartão(ões), ${totals.recurring} recorrência(s), ${totals.goals} meta(s), ${totals.debts} dívida(s) e ${totals.budgets} orçamento(s).`;
  }

  function openBackupModal() {
    renderBackupInfo();
    backupOverlay.hidden = false;
  }
  function closeBackupModal() { backupOverlay.hidden = true; }

  backupBtn.addEventListener('click', openBackupModal);
  backupClose.addEventListener('click', closeBackupModal);
  backupOverlay.addEventListener('click', (ev) => { if (ev.target === backupOverlay) closeBackupModal(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !backupOverlay.hidden) closeBackupModal(); });

  backupExportBtn.addEventListener('click', () => {
    const payload = buildBackupPayload();
    const totals = computeTotalsForProfiles(profiles);
    const totalRecords = totalsToRecordCount(totals);

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meudinheiro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    Storage.write(LAST_BACKUP_KEY, { date: payload.exportedAt, version: BACKUP_VERSION, records: totalRecords });
    renderBackupInfo();
    showToast('Backup exportado com sucesso.');
  });

  backupImportInput.addEventListener('change', async () => {
    const file = backupImportInput.files[0];
    backupImportInput.value = '';
    if (!file) return;

    let payload;
    try {
      const text = await file.text();
      payload = JSON.parse(text);
    } catch (e) {
      showToast('Arquivo inválido: não é um JSON legível.');
      return;
    }

    const problems = validateBackupPayload(payload);
    if (problems.length > 0) {
      showToast('Backup inválido: ' + problems[0]);
      return;
    }

    const totals = { profiles: payload.profiles.length, ...(() => {
      let e = 0, c = 0, r = 0, g = 0, a = 0, dv = 0, bu = 0;
      Object.values(payload.data).forEach((d) => {
        e += (d.entries || []).length; c += (d.cards || []).length;
        r += (d.recurring || []).length; g += (d.goals || []).length;
        a += (d.accounts || []).length; dv += (d.debts || []).length;
        bu += (d.budgets || []).length;
      });
      return { entries: e, cards: c, recurring: r, goals: g, accounts: a, debts: dv, budgets: bu };
    })() };
    const totalRecords = totalsToRecordCount(totals);

    const confirmMsg = `Este backup foi feito em ${formatDateTimeDisplay(payload.exportedAt)} e contém ${totalRecords} registro(s) em ${totals.profiles} perfil(is).\n\nIsso vai SUBSTITUIR todos os dados atuais deste navegador. Deseja continuar?`;
    if (!confirm(confirmMsg)) return;

    profiles = payload.profiles;
    saveProfiles();
    Object.entries(payload.data).forEach(([pid, d]) => {
      Storage.write(entriesKeyFor(pid), d.entries || []);
      Storage.write(cardsKeyFor(pid), d.cards || []);
      Storage.write(recurringKeyFor(pid), d.recurring || []);
      Storage.write(goalsKeyFor(pid), d.goals || []);
      Storage.write(accountsKeyFor(pid), d.accounts || []); // backups antigos (v1 sem contas) chegam aqui vazios e ganham a conta padrão logo abaixo
      Storage.write(debtsKeyFor(pid), d.debts || []);
      Storage.write(budgetsKeyFor(pid), d.budgets || []);
    });

    currentProfileId = profiles.some((p) => p.id === payload.currentProfileId) ? payload.currentProfileId : profiles[0].id;
    Storage.writeRaw(CURRENT_PROFILE_KEY, currentProfileId);
    if (payload.theme) applyTheme(payload.theme);

    populateProfileSelect();
    entries = loadEntries();
    cards = loadCards();
    recurring = loadRecurring();
    goals = loadGoals();
    accounts = loadAccounts();
    debts = loadDebts();
    budgets = loadBudgets();
    ensureAccountsForProfile();
    populateCategorySelects();
    populateAccountSelects();
    populateBudgetCategoriaSelect();
    renderAll();
    renderCards();
    renderRecurring();
    renderGoals();
    renderDebts();
    renderAccounts();
    updateInvestFieldsVisibility();
    renderBackupInfo();

    showToast('Backup importado com sucesso.');
    closeBackupModal();
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

  function accIcon(iconKey, size = 14) {
    const svg = ACCOUNT_ICONS[iconKey] || ACCOUNT_ICONS.outro;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${svg}</svg>`;
  }

  /* ---------------- Helpers de CRUD compartilhados ----------------
     Contas, cartões, dívidas, metas e recorrências seguem sempre o mesmo
     padrão (criar/editar, listar com estado vazio, excluir). Esses helpers
     evitam repetir essa lógica em cada seção. */
  const ICON_EDIT_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const ICON_DELETE_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function rowActionsHtml(extraButtonsHtml = '') {
    return `
          <div class="row-actions">
            ${extraButtonsHtml}
            <button class="edit" data-action="edit" aria-label="Editar">${ICON_EDIT_SVG}</button>
            <button class="del" data-action="del" aria-label="Excluir">${ICON_DELETE_SVG}</button>
          </div>`;
  }

  function listItemActionsHtml(extraButtonsHtml = '') {
    return `
          <div class="list-item-actions">
            ${extraButtonsHtml}
            <button data-action="edit" aria-label="Editar">${ICON_EDIT_SVG}</button>
            <button class="del" data-action="del" aria-label="Excluir">${ICON_DELETE_SVG}</button>
          </div>`;
  }

  // Insere um item novo (com id gerado) ou atualiza um existente in-place. Retorna true se foi inserção.
  function upsertById(list, editingId, payload) {
    if (editingId) {
      const idx = list.findIndex((x) => x.id === editingId);
      if (idx > -1) list[idx] = { ...list[idx], ...payload };
      return false;
    }
    list.push({ id: uid(), ...payload });
    return true;
  }

  // Extrai o id do .list-item mais próximo do elemento clicado (usado nos handlers de clique das listas)
  function getClickedItemId(ev) {
    const item = ev.target.closest('.list-item');
    return item ? item.dataset.id : null;
  }

  // Renderiza uma coleção simples (contador + estado vazio + itens), padrão repetido em contas/cartões/dívidas/metas/recorrências
  function renderCollection({ list, listEl, countEl, emptyEl, singular, plural, itemHtml }) {
    countEl.textContent = `${list.length} ${list.length === 1 ? singular : plural}`;
    if (list.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    listEl.innerHTML = list.map(itemHtml).join('');
  }

  /* ---------------- Categorias em selects ---------------- */
  function populateCategorySelects() {
    const optionsHtml = Object.entries(CATEGORIES)
      .map(([id, c]) => `<option value="${id}">${c.label}</option>`)
      .join('');

    entryCategoria.innerHTML = optionsHtml;
    recCategoria.innerHTML = optionsHtml;

    filterCategory.innerHTML = '<option value="">Todas categorias</option>' + optionsHtml;
  }

  /* ---------------- Contas em selects ---------------- */
  function populateAccountSelects() {
    const optionsHtml = accounts.map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join('');
    const prevEntryConta = entryConta.value;
    const prevRecConta = recConta.value;
    entryConta.innerHTML = optionsHtml;
    recConta.innerHTML = optionsHtml;
    if (accounts.some((a) => a.id === prevEntryConta)) entryConta.value = prevEntryConta;
    if (accounts.some((a) => a.id === prevRecConta)) recConta.value = prevRecConta;
  }

  /* ---------------- Tema ---------------- */
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    iconSun.style.display = theme === 'dark' ? 'none' : 'block';
    iconMoon.style.display = theme === 'dark' ? 'block' : 'none';
    Storage.writeRaw(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = Storage.readRaw(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
    renderChart(); // recolore o gráfico para o novo tema
  });

  /* ---------------- Filtros ---------------- */
  function pad2(n) { return String(n).padStart(2, '0'); }

  // Retorna 'YYYY-MM' do mês atual (offset 0), anterior (-1), etc. Usado no dashboard e nos insights.
  function mesString(offsetMeses = 0) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offsetMeses, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }
  function toISODate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

  function getPeriodRange(period) {
    const now = new Date();
    const today = toISODate(now);

    if (period === 'hoje') return { start: today, end: today };

    if (period === 'semana') {
      const dow = (now.getDay() + 6) % 7; // 0 = segunda
      const monday = new Date(now); monday.setDate(now.getDate() - dow);
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      return { start: toISODate(monday), end: toISODate(sunday) };
    }

    if (period === 'mes') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toISODate(first), end: toISODate(last) };
    }

    if (period === 'ano') {
      return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
    }

    if (period === 'personalizado') {
      return { start: filterDateStart.value || '0000-01-01', end: filterDateEnd.value || '9999-12-31' };
    }

    return null; // 'todos'
  }

  function getFilteredEntries() {
    const range = getPeriodRange(filterPeriod.value);
    const cat = filterCategory.value;
    const term = filterSearch.value.trim().toLowerCase();

    return entries.filter((e) => {
      if (range && (e.data < range.start || e.data > range.end)) return false;
      if (cat && e.categoria !== cat) return false;
      if (term) {
        const catLabel = (CATEGORIES[e.categoria] || CATEGORIES.outros).label.toLowerCase();
        const valorStr = String(e.valor).replace('.', ',');
        const matches = e.descricao.toLowerCase().includes(term)
          || catLabel.includes(term)
          || valorStr.includes(term)
          || formatCurrency(e.valor).toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }

  filterPeriod.addEventListener('change', () => {
    customPeriodWrap.hidden = filterPeriod.value !== 'personalizado';
    renderAll();
  });
  [filterDateStart, filterDateEnd, filterCategory].forEach((el) => el.addEventListener('change', renderAll));
  filterSearch.addEventListener('input', renderAll);

  /* ---------------- Render: Dashboard ---------------- */
  function computePatrimonioTotal() {
    return accounts.reduce((sum, a) => sum + computeAccountBalance(a), 0);
  }

  function computeDividasTotal() {
    const faturas = cards.reduce((sum, c) => sum + (c.usado || 0), 0);
    const outras = debts.reduce((sum, d) => sum + (d.valor || 0), 0);
    return faturas + outras;
  }

  function renderDashboard(list) {
    // Patrimônio total: soma do saldo de todas as contas (saldo inicial + receitas − despesas de cada uma)
    const patrimonioTotal = computePatrimonioTotal();
    statPatrimonioTotal.textContent = formatCurrency(patrimonioTotal);
    statPatrimonioTotal.style.color = patrimonioTotal < 0 ? 'var(--expense)' : '';

    // Patrimônio líquido: patrimônio total menos fatura do cartão e outras dívidas
    const dividasTotal = computeDividasTotal();
    const patrimonioLiquido = patrimonioTotal - dividasTotal;
    statPatrimonioLiquido.textContent = formatCurrency(patrimonioLiquido);
    statPatrimonioLiquido.style.color = patrimonioLiquido < 0 ? 'var(--expense)' : '';
    statPatrimonioLiquidoSub.textContent = dividasTotal > 0 ? `− ${formatCurrency(dividasTotal)} em dívidas` : 'sem dívidas cadastradas';

    if (!composicaoPanel.hidden) renderComposicao();

    // Indicadores "do mês": sempre o mês corrente, independente do filtro selecionado
    const mesAtual = mesString();
    let receitasMes = 0, despesasMes = 0;
    entries.forEach((e) => {
      if (!e.data.startsWith(mesAtual)) return;
      if (e.tipo === 'receita') receitasMes += e.valor;
      else despesasMes += e.valor;
    });
    const economia = receitasMes - despesasMes;
    const percentual = receitasMes > 0 ? (despesasMes / receitasMes) * 100 : (despesasMes > 0 ? 100 : 0);

    statReceitas.textContent = formatCurrency(receitasMes);
    statDespesas.textContent = formatCurrency(despesasMes);
    statEconomia.textContent = formatCurrency(economia);
    statEconomiaCard.querySelector('.stat-value').style.color = economia < 0 ? 'var(--expense)' : 'var(--income)';

    const percentClamped = Math.min(100, percentual);
    statPercentual.textContent = `${percentual.toFixed(0)}%`;
    statPercentualBar.style.width = `${percentClamped}%`;
    statPercentualBar.style.background = percentual >= 100 ? 'var(--expense)' : percentual >= 70 ? '#D9A441' : 'var(--income)';

    renderUltimasMovimentacoes();
    renderTopCategorias(mesAtual);
  }

  /* ---------------- Composição do patrimônio ---------------- */
  function renderComposicao() {
    const grupos = {};
    accounts.forEach((a) => {
      const nomeGrupo = ACCOUNT_GROUP_MAP[a.icone] || 'Outros ativos';
      grupos[nomeGrupo] = (grupos[nomeGrupo] || 0) + computeAccountBalance(a);
    });
    const total = Object.values(grupos).reduce((s, v) => s + v, 0);

    const ordem = ['Bancos', 'Carteira', 'Investimentos', 'Outros ativos'];
    const linhas = ordem.filter((nome) => grupos[nome] !== undefined);

    if (linhas.length === 0) {
      composicaoList.innerHTML = '<p class="mini-list-empty">Cadastre contas para ver a composição do seu patrimônio.</p>';
      return;
    }

    composicaoList.innerHTML = linhas.map((nome) => {
      const valor = grupos[nome];
      const pct = total > 0 ? Math.max(0, (valor / total) * 100) : 0;
      return `
        <div>
          <div class="composicao-row-top"><span>${nome}</span><span>${formatCurrency(valor)} · ${pct.toFixed(0)}%</span></div>
          <div class="composicao-bar"><div class="composicao-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  toggleComposicaoBtn.addEventListener('click', () => {
    const abrir = composicaoPanel.hidden;
    composicaoPanel.hidden = !abrir;
    toggleComposicaoBtn.classList.toggle('open', abrir);
    if (abrir) renderComposicao();
  });

  /* ---------------- Últimas movimentações ---------------- */
  function renderUltimasMovimentacoes() {
    const ultimas = [...entries].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 5);
    if (ultimas.length === 0) {
      ultimasMovList.innerHTML = '<p class="mini-list-empty">Nenhuma movimentação registrada ainda.</p>';
      return;
    }
    ultimasMovList.innerHTML = ultimas.map((e) => {
      const cat = CATEGORIES[e.categoria] || CATEGORIES.outros;
      return `
        <div class="mini-list-item">
          <div class="mini-list-left">
            <span style="color:${cat.color}; display:flex;">${catIcon(e.categoria, 16)}</span>
            <div>
              <div class="desc">${escapeHtml(e.descricao)}</div>
              <div class="mini-list-sub">${formatDateDisplay(e.data)}</div>
            </div>
          </div>
          <span class="mini-list-value ${e.tipo === 'receita' ? 'income' : 'expense'}">${formatCurrency(e.valor)}</span>
        </div>`;
    }).join('');
  }

  /* ---------------- Categorias com maior gasto (mês atual) ---------------- */
  // Soma as despesas de cada categoria dentro de um mês (formato 'YYYY-MM'). Usado no widget de
  // "categorias com maior gasto" e no acompanhamento de orçamento mensal.
  function computeDespesasPorCategoria(mesAtual) {
    const totals = {};
    entries.forEach((e) => {
      if (e.tipo !== 'despesa' || !e.data.startsWith(mesAtual)) return;
      totals[e.categoria] = (totals[e.categoria] || 0) + e.valor;
    });
    return totals;
  }

  function renderTopCategorias(mesAtual) {
    const totals = computeDespesasPorCategoria(mesAtual);
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (top.length === 0) {
      topCategoriasList.innerHTML = '<p class="mini-list-empty">Nenhuma despesa registrada este mês.</p>';
      return;
    }
    const max = top[0][1];
    topCategoriasList.innerHTML = top.map(([catId, valor]) => {
      const cat = CATEGORIES[catId] || CATEGORIES.outros;
      const pct = max > 0 ? (valor / max) * 100 : 0;
      return `
        <div class="mini-cat-row">
          <div class="mini-cat-top">
            <span class="cat-pill" style="color:${cat.color}">${catIcon(catId)} ${cat.label}</span>
            <span class="amount expense">${formatCurrency(valor)}</span>
          </div>
          <div class="mini-cat-bar"><div class="mini-cat-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  /* ---------------- Insights financeiros ---------------- */
  const INSIGHT_ICONS = {
    up: '<path d="M4 16 10 10l4 4 6-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M16 6h4v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    down: '<path d="M4 8l6 6 4-4 6 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M16 18h4v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    category: '<path d="M11.3 3.7 20 12.4a1.5 1.5 0 0 1 0 2.1l-5.5 5.5a1.5 1.5 0 0 1-2.1 0L3.7 11.3a1.5 1.5 0 0 1-.44-1.06V5a1.5 1.5 0 0 1 1.5-1.5h5.5a1.5 1.5 0 0 1 1.06.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/><circle cx="7.3" cy="7.3" r="1.1" fill="currentColor"/>',
    star: '<path d="M12 3.5l2.4 5 5.5.6-4 3.8 1 5.5-4.9-2.7-4.9 2.7 1-5.5-4-3.8 5.5-.6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>',
    info: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 11v5M12 8v0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  };

  function pctChange(atual, anterior) {
    if (anterior === 0) return atual === 0 ? 0 : null; // sem base de comparação
    return ((atual - anterior) / anterior) * 100;
  }

  function computeInsights() {
    const mesAtual = mesString(0);
    const mesAnterior = mesString(-1);

    function somarMes(mes) {
      let receitas = 0, despesas = 0;
      entries.forEach((e) => {
        if (!e.data.startsWith(mes)) return;
        if (e.tipo === 'receita') receitas += e.valor; else despesas += e.valor;
      });
      return { receitas, despesas };
    }

    const atual = somarMes(mesAtual);
    const anterior = somarMes(mesAnterior);
    const temDadosAtual = atual.receitas > 0 || atual.despesas > 0;
    const temDadosAnterior = anterior.receitas > 0 || anterior.despesas > 0;

    if (!temDadosAtual) {
      return [{ icon: 'info', tone: 'neutral', text: 'Ainda não há lançamentos este mês para gerar insights.' }];
    }

    const insights = [];

    if (temDadosAnterior) {
      const economiaAtual = atual.receitas - atual.despesas;
      const economiaAnterior = anterior.receitas - anterior.despesas;
      if (economiaAtual > economiaAnterior) {
        insights.push({ icon: 'up', tone: 'positive', text: `Você economizou mais este mês (${formatCurrency(economiaAtual)}) do que no mês passado (${formatCurrency(economiaAnterior)}).` });
      } else if (economiaAtual < economiaAnterior) {
        insights.push({ icon: 'down', tone: 'negative', text: `Sua economia caiu em relação ao mês passado: de ${formatCurrency(economiaAnterior)} para ${formatCurrency(economiaAtual)}.` });
      }

      const variacaoDespesas = pctChange(atual.despesas, anterior.despesas);
      if (variacaoDespesas !== null && Math.abs(variacaoDespesas) >= 1) {
        if (variacaoDespesas > 0) {
          insights.push({ icon: 'down', tone: 'negative', text: `Seus gastos aumentaram ${variacaoDespesas.toFixed(0)}% em relação ao mês anterior.` });
        } else {
          insights.push({ icon: 'up', tone: 'positive', text: `Seus gastos diminuíram ${Math.abs(variacaoDespesas).toFixed(0)}% em relação ao mês anterior.` });
        }
      }
    }

    const totaisCategoria = computeDespesasPorCategoria(mesAtual);
    const categoriasOrdenadas = Object.entries(totaisCategoria).sort((a, b) => b[1] - a[1]);
    if (categoriasOrdenadas.length > 0 && atual.despesas > 0) {
      const [catId, valor] = categoriasOrdenadas[0];
      const pct = (valor / atual.despesas) * 100;
      const label = (CATEGORIES[catId] || CATEGORIES.outros).label;
      insights.push({ icon: 'category', tone: 'neutral', text: `${label} representa ${pct.toFixed(0)}% das suas despesas este mês.` });
    }

    if (temDadosAnterior) {
      const totaisAnterior = computeDespesasPorCategoria(mesAnterior);
      let maiorQueda = null, maiorAlta = null;
      Object.keys(CATEGORIES).forEach((catId) => {
        const valorAtual = totaisCategoria[catId] || 0;
        const valorAnterior = totaisAnterior[catId] || 0;
        if (valorAnterior === 0) return; // sem base de comparação pra essa categoria
        const variacao = pctChange(valorAtual, valorAnterior);
        if (variacao === null) return;
        if (variacao < 0 && (!maiorQueda || variacao < maiorQueda.variacao)) maiorQueda = { catId, variacao };
        if (variacao > 0 && (!maiorAlta || variacao > maiorAlta.variacao)) maiorAlta = { catId, variacao };
      });
      if (maiorQueda) {
        const label = (CATEGORIES[maiorQueda.catId] || CATEGORIES.outros).label;
        insights.push({ icon: 'down', tone: 'positive', text: `${label} diminuiu ${Math.abs(maiorQueda.variacao).toFixed(0)}% este mês.` });
      }
      if (maiorAlta) {
        const label = (CATEGORIES[maiorAlta.catId] || CATEGORIES.outros).label;
        insights.push({ icon: 'up', tone: 'negative', text: `${label} aumentou ${maiorAlta.variacao.toFixed(0)}% este mês.` });
      }
    }

    const despesasDoMes = entries.filter((e) => e.tipo === 'despesa' && e.data.startsWith(mesAtual));
    const receitasDoMes = entries.filter((e) => e.tipo === 'receita' && e.data.startsWith(mesAtual));
    if (despesasDoMes.length > 0) {
      const maior = despesasDoMes.reduce((a, b) => (b.valor > a.valor ? b : a));
      insights.push({ icon: 'star', tone: 'neutral', text: `Esta foi sua maior despesa do mês: "${maior.descricao}", de ${formatCurrency(maior.valor)}.` });
    }
    if (receitasDoMes.length > 0) {
      const maior = receitasDoMes.reduce((a, b) => (b.valor > a.valor ? b : a));
      insights.push({ icon: 'star', tone: 'positive', text: `Esta foi sua maior receita do mês: "${maior.descricao}", de ${formatCurrency(maior.valor)}.` });
    }

    return insights;
  }

  function renderInsights() {
    const insights = computeInsights();
    insightsList.innerHTML = insights.map((ins) => `
      <div class="insight-item ${ins.tone}">
        <svg class="insight-icon" viewBox="0 0 24 24">${INSIGHT_ICONS[ins.icon] || INSIGHT_ICONS.info}</svg>
        <span>${ins.text}</span>
      </div>`).join('');
  }

  /* ---------------- Previsão do mês ----------------
     Projeção simples por regra de três: mantém o ritmo médio de gastos por dia
     e projeta para os dias restantes do mês. Não tenta prever receitas futuras
     (salário já recebido é tratado como definitivo, não se projeta mais renda). */
  function computePrevisaoMes() {
    const now = new Date();
    const diaAtual = now.getDate();
    const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const diasRestantes = Math.max(0, diasNoMes - diaAtual);
    const mesAtual = mesString(0);

    let despesasAteAgora = 0, receitasAteAgora = 0;
    entries.forEach((e) => {
      if (!e.data.startsWith(mesAtual)) return;
      if (e.tipo === 'receita') receitasAteAgora += e.valor; else despesasAteAgora += e.valor;
    });

    if (despesasAteAgora === 0 && receitasAteAgora === 0) return null;

    const mediaGastoDiario = despesasAteAgora / diaAtual;
    const despesaProjetadaTotal = mediaGastoDiario * diasNoMes;
    const despesaFutura = despesaProjetadaTotal - despesasAteAgora;

    const patrimonioAtual = computePatrimonioTotal();
    const saldoPrevistoFimDoMes = patrimonioAtual - despesaFutura;
    const economiaPrevista = receitasAteAgora - despesaProjetadaTotal;
    const podeGastar = Math.max(0, receitasAteAgora - despesasAteAgora);

    return { diasRestantes, mediaGastoDiario, saldoPrevistoFimDoMes, economiaPrevista, podeGastar };
  }

  function renderPrevisao() {
    const p = computePrevisaoMes();
    if (!p) {
      previsaoContent.hidden = true;
      previsaoEmpty.hidden = false;
      previsaoHint.textContent = '';
      return;
    }
    previsaoContent.hidden = false;
    previsaoEmpty.hidden = true;
    previsaoHint.textContent = `com base em ${formatCurrency(p.mediaGastoDiario)}/dia · ${p.diasRestantes} dia(s) restante(s)`;

    previsaoSaldoFinal.textContent = formatCurrency(p.saldoPrevistoFimDoMes);
    previsaoSaldoFinal.className = `previsao-value ${p.saldoPrevistoFimDoMes < 0 ? 'expense' : ''}`;

    previsaoPodeGastar.textContent = formatCurrency(p.podeGastar);

    previsaoEconomia.textContent = formatCurrency(p.economiaPrevista);
    previsaoEconomia.className = `previsao-value ${p.economiaPrevista < 0 ? 'expense' : 'income'}`;
  }

  /* ---------------- Resumo mensal (fechamento do mês) ---------------- */
  function shiftMes(mesStr, offsetMeses) {
    const [y, m] = mesStr.split('-').map(Number);
    const d = new Date(y, m - 1 + offsetMeses, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function ultimoDiaDoMes(mesStr) {
    const [y, m] = mesStr.split('-').map(Number);
    const d = new Date(y, m, 0); // dia 0 do mês seguinte = último dia deste mês
    return `${y}-${pad2(m)}-${pad2(d.getDate())}`;
  }

  // Reconstrói o patrimônio total como ele estava até uma data (soma apenas lançamentos até lá)
  function computePatrimonioAteData(dataLimite) {
    return accounts.reduce((total, a) => {
      let saldo = a.saldoInicial || 0;
      entries.forEach((e) => {
        if (e.conta === a.id && e.data <= dataLimite) saldo += e.tipo === 'receita' ? e.valor : -e.valor;
      });
      return total + saldo;
    }, 0);
  }

  // Média histórica de despesas por mês, considerando todos os meses com algum lançamento
  function computeMediaMensalDespesas() {
    const porMes = {};
    entries.forEach((e) => { if (e.tipo === 'despesa') porMes[e.data.slice(0, 7)] = (porMes[e.data.slice(0, 7)] || 0) + e.valor; });
    const valores = Object.values(porMes);
    return valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : 0;
  }

  function topCategoriaPorValor(lista) {
    const totals = {};
    lista.forEach((e) => { totals[e.categoria] = (totals[e.categoria] || 0) + e.valor; });
    const ordenadas = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return ordenadas[0] || null;
  }

  function computeResumoMensal(mesRef) {
    const mesAnterior = shiftMes(mesRef, -1);
    const doMes = entries.filter((e) => e.data.startsWith(mesRef));
    const doMesAnterior = entries.filter((e) => e.data.startsWith(mesAnterior));

    const receitasLista = doMes.filter((e) => e.tipo === 'receita');
    const despesasLista = doMes.filter((e) => e.tipo === 'despesa');
    const receitas = receitasLista.reduce((s, e) => s + e.valor, 0);
    const despesas = despesasLista.reduce((s, e) => s + e.valor, 0);

    const receitasAnt = doMesAnterior.filter((e) => e.tipo === 'receita').reduce((s, e) => s + e.valor, 0);
    const despesasAnt = doMesAnterior.filter((e) => e.tipo === 'despesa').reduce((s, e) => s + e.valor, 0);

    const freqCategorias = {};
    doMes.forEach((e) => { freqCategorias[e.categoria] = (freqCategorias[e.categoria] || 0) + 1; });

    return {
      mesRef,
      receitas, despesas, economia: receitas - despesas, quantidade: doMes.length,
      receitasAnt, despesasAnt, economiaAnt: receitasAnt - despesasAnt,
      topReceitaCat: topCategoriaPorValor(receitasLista),
      topDespesaCat: topCategoriaPorValor(despesasLista),
      categoriasMaisUsadas: Object.entries(freqCategorias).sort((a, b) => b[1] - a[1]).slice(0, 5),
      maiorDespesa: despesasLista.length ? despesasLista.reduce((a, b) => (b.valor > a.valor ? b : a)) : null,
      maiorReceita: receitasLista.length ? receitasLista.reduce((a, b) => (b.valor > a.valor ? b : a)) : null,
      patrimonioFimMes: computePatrimonioAteData(ultimoDiaDoMes(mesRef)),
      patrimonioFimMesAnterior: computePatrimonioAteData(ultimoDiaDoMes(mesAnterior)),
      mediaMensalDespesas: computeMediaMensalDespesas()
    };
  }

  function evolucaoRow(label, atual, anterior, positivoQuandoMaior) {
    const variacao = pctChange(atual, anterior);
    let deltaTexto, tone;
    if (variacao === null) {
      deltaTexto = 'sem dados do mês anterior';
      tone = '';
    } else {
      const subiu = variacao > 0;
      tone = subiu === positivoQuandoMaior ? 'income' : 'expense';
      if (variacao === 0) tone = '';
      deltaTexto = `${subiu ? '+' : ''}${variacao.toFixed(0)}%`;
    }
    return `<div class="evolucao-row"><span>${label}</span><span class="evolucao-delta ${tone}">${deltaTexto}</span></div>`;
  }

  function renderResumo() {
    const mesRef = resumoMesInput.value || mesString(0);
    const r = computeResumoMensal(mesRef);

    resumoReceitas.textContent = formatCurrency(r.receitas);
    resumoDespesas.textContent = formatCurrency(r.despesas);
    resumoEconomia.textContent = formatCurrency(r.economia);
    resumoEconomia.className = `previsao-value ${r.economia < 0 ? 'expense' : 'income'}`;
    resumoQuantidade.textContent = r.quantidade;

    resumoEvolucaoList.innerHTML = [
      evolucaoRow('Receitas', r.receitas, r.receitasAnt, true),
      evolucaoRow('Despesas', r.despesas, r.despesasAnt, false),
      evolucaoRow('Economia', r.economia, r.economiaAnt, true),
      evolucaoRow('Patrimônio', r.patrimonioFimMes, r.patrimonioFimMesAnterior, true)
    ].join('');

    resumoMediaHint.textContent = `Média histórica de despesas por mês: ${formatCurrency(r.mediaMensalDespesas)}. Patrimônio ao fim deste mês: ${formatCurrency(r.patrimonioFimMes)}.`;

    const destaques = [];
    if (r.topReceitaCat) {
      const [catId, valor] = r.topReceitaCat;
      const cat = CATEGORIES[catId] || CATEGORIES.outros;
      destaques.push({ label: 'Categoria que mais recebeu', value: cat.label, sub: formatCurrency(valor) });
    }
    if (r.topDespesaCat) {
      const [catId, valor] = r.topDespesaCat;
      const cat = CATEGORIES[catId] || CATEGORIES.outros;
      destaques.push({ label: 'Categoria que mais gastou', value: cat.label, sub: formatCurrency(valor) });
    }
    if (r.maiorReceita) {
      destaques.push({ label: 'Maior receita', value: formatCurrency(r.maiorReceita.valor), sub: `${escapeHtml(r.maiorReceita.descricao)} · ${formatDateDisplay(r.maiorReceita.data)}` });
    }
    if (r.maiorDespesa) {
      destaques.push({ label: 'Maior despesa', value: formatCurrency(r.maiorDespesa.valor), sub: `${escapeHtml(r.maiorDespesa.descricao)} · ${formatDateDisplay(r.maiorDespesa.data)}` });
    }

    resumoDestaques.innerHTML = destaques.length
      ? destaques.map((d) => `
          <div class="destaque-item">
            <div class="destaque-label">${d.label}</div>
            <div class="destaque-value">${d.value}</div>
            <div class="destaque-sub">${d.sub}</div>
          </div>`).join('')
      : '<p class="mini-list-empty">Nenhuma movimentação neste mês.</p>';

    resumoCategoriasUsadas.innerHTML = r.categoriasMaisUsadas.length
      ? r.categoriasMaisUsadas.map(([catId, qtd]) => {
          const cat = CATEGORIES[catId] || CATEGORIES.outros;
          return `
            <div class="mini-list-item">
              <div class="mini-list-left">
                <span style="color:${cat.color}; display:flex;">${catIcon(catId, 16)}</span>
                <span class="desc">${cat.label}</span>
              </div>
              <span class="mini-list-value">${qtd} lançamento${qtd === 1 ? '' : 's'}</span>
            </div>`;
        }).join('')
      : '<p class="mini-list-empty">Nenhuma movimentação neste mês.</p>';
  }

  resumoMesInput.addEventListener('change', renderResumo);

  /* ---------------- Render: Tabelas (receitas e despesas separadas) ---------------- */
  function buildRow(e) {
    const cat = CATEGORIES[e.categoria] || CATEGORIES.outros;
    const acc = accounts.find((a) => a.id === e.conta);
    const receiptBtn = e.comprovante
      ? `<button class="receipt-btn" data-action="ver" aria-label="Ver comprovante">
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 3v4a1 1 0 0 0 1 1h4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>`
      : '';
    return `
      <tr data-id="${e.id}">
        <td>${formatDateDisplay(e.data)}</td>
        <td>${escapeHtml(e.descricao)}</td>
        <td>
          <span class="cat-pill" style="color:${cat.color}">${catIcon(e.categoria)} ${cat.label}</span>
          ${acc ? `<span class="acc-badge" style="color:${acc.cor}">${accIcon(acc.icone, 12)} ${escapeHtml(acc.nome)}</span>` : ''}
        </td>
        <td class="col-right"><span class="amount ${e.tipo === 'receita' ? 'income' : 'expense'}">${formatCurrency(e.valor)}</span></td>
        <td class="col-actions">${rowActionsHtml(receiptBtn)}</td>
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
    if (btn.dataset.action === 'ver') {
      const e = entries.find((x) => x.id === id);
      if (e && e.comprovante) openLightbox(e.comprovante);
    }
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
    renderOrcamento();
    renderInsights();
    renderPrevisao();
    renderSuggestions();
    renderResumo();
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
    populateAccountSelects();
    entryCategoria.value = type === 'receita' ? 'salario' : 'outros';
    if (accounts.length > 0) entryConta.value = accounts[0].id;
    clearComprovante();
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
    populateAccountSelects();
    entryCategoria.value = e.categoria;
    entryConta.value = e.conta || (accounts[0] && accounts[0].id) || '';
    setType(e.tipo);
    if (e.comprovante) setComprovantePreview(e.comprovante); else clearComprovante();
    modalOverlay.hidden = false;
    setTimeout(() => entryDesc.focus(), 30);
  }

  /* ---------------- Comprovante (anexo de imagem) ---------------- */
  function resizeImageFile(file, maxWidth = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        img.src = ev.target.result;
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  function setComprovantePreview(dataUrl) {
    currentComprovante = dataUrl;
    comprovantePreviewImg.src = dataUrl;
    comprovantePreviewWrap.hidden = false;
  }

  function clearComprovante() {
    currentComprovante = null;
    comprovantePreviewWrap.hidden = true;
    comprovantePreviewImg.src = '';
    entryComprovanteInput.value = '';
  }

  entryComprovanteInput.addEventListener('change', async () => {
    const file = entryComprovanteInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Envie uma imagem (foto ou print do comprovante).');
      entryComprovanteInput.value = '';
      return;
    }
    try {
      const dataUrl = await resizeImageFile(file);
      setComprovantePreview(dataUrl);
    } catch (err) {
      showToast('Não foi possível processar a imagem.');
    }
  });

  comprovanteRemoveBtn.addEventListener('click', clearComprovante);

  function openLightbox(dataUrl) {
    lightboxImg.src = dataUrl;
    lightboxOverlay.hidden = false;
  }
  function closeLightbox() {
    lightboxOverlay.hidden = true;
    lightboxImg.src = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', (ev) => { if (ev.target === lightboxOverlay) closeLightbox(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !lightboxOverlay.hidden) closeLightbox(); });

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
      tipo: currentType,
      conta: entryConta.value,
      comprovante: currentComprovante
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
      const target = btn.dataset.view;
      Object.entries(views).forEach(([name, el]) => { el.hidden = name !== target; });
      if (target === 'painel') renderChart();
    });
  });

  /* ---------------- Contas ---------------- */
  function resetAccountForm() {
    editingAccountId = null;
    accountForm.reset();
    accountId.value = '';
    accountSaldoInicial.value = 0;
    accountCor.value = '#1F6F5C';
    accountSubmitBtn.textContent = 'Adicionar conta';
  }

  function computeAccountBalance(account) {
    let total = account.saldoInicial || 0;
    entries.forEach((e) => {
      if (e.conta !== account.id) return;
      total += e.tipo === 'receita' ? e.valor : -e.valor;
    });
    return total;
  }

  accountForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = accountNome.value.trim();
    if (!nome) { showToast('Informe o nome da conta.'); return; }
    const saldoInicial = parseFloat(accountSaldoInicial.value) || 0;

    const payload = { nome, saldoInicial: Math.round(saldoInicial * 100) / 100, icone: accountIcone.value, cor: accountCor.value };
    const isNew = upsertById(accounts, editingAccountId, payload);
    showToast(isNew ? 'Conta adicionada.' : 'Conta atualizada.');

    saveAccounts();
    resetAccountForm();
    populateAccountSelects();
    renderAccounts();
    renderAll(); // saldo geral do dashboard depende do saldo inicial das contas
  });

  function buildAccountItem(a) {
    const saldo = computeAccountBalance(a);
    return `
        <div class="list-item" data-id="${a.id}">
          <div class="list-item-top">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:${a.cor}; display:flex;">${accIcon(a.icone, 22)}</span>
              <div>
                <div class="list-item-title">${escapeHtml(a.nome)}</div>
                <div class="list-item-sub">Saldo inicial: ${formatCurrency(a.saldoInicial || 0)}</div>
              </div>
            </div>
            <span class="list-item-value ${saldo < 0 ? 'amount expense' : 'amount income'}">${formatCurrency(saldo)}</span>
          </div>${listItemActionsHtml()}
        </div>`;
  }

  function renderAccounts() {
    renderCollection({
      list: accounts, listEl: accountList, countEl: accountCount, emptyEl: emptyAccounts,
      singular: 'conta', plural: 'contas', itemHtml: buildAccountItem
    });
  }

  accountList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = getClickedItemId(ev);
    const a = accounts.find((x) => x.id === id);
    if (!a) return;
    if (btn.dataset.action === 'edit') {
      editingAccountId = id;
      accountId.value = id;
      accountNome.value = a.nome;
      accountSaldoInicial.value = a.saldoInicial || 0;
      accountIcone.value = a.icone;
      accountCor.value = a.cor;
      accountSubmitBtn.textContent = 'Salvar conta';
      accountNome.focus();
    } else if (btn.dataset.action === 'del') {
      if (accounts.length <= 1) { showToast('É preciso manter ao menos uma conta.'); return; }
      const vinculados = entries.filter((e) => e.conta === id).length;
      const msg = vinculados > 0
        ? `A conta "${a.nome}" tem ${vinculados} lançamento(s). Eles serão movidos para outra conta. Continuar?`
        : `Excluir a conta "${a.nome}"?`;
      if (!confirm(msg)) return;

      const fallbackId = accounts.find((x) => x.id !== id).id;
      entries.forEach((e) => { if (e.conta === id) e.conta = fallbackId; });
      recurring.forEach((r) => { if (r.conta === id) r.conta = fallbackId; });
      saveEntries();
      saveRecurring();

      accounts = accounts.filter((x) => x.id !== id);
      saveAccounts();
      populateAccountSelects();
      renderAccounts();
      renderRecurring();
      renderAll();
      showToast('Conta excluída.');
    }
  });

  /* ---------------- Despesas recorrentes ---------------- */
  function setRecType(type) {
    recCurrentType = type;
    [...recTypeSegment.children].forEach((btn) => btn.classList.toggle('active', btn.dataset.type === type));
  }

  recTypeSegment.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.segment');
    if (btn) setRecType(btn.dataset.type);
  });

  function resetRecForm() {
    editingRecId = null;
    recForm.reset();
    recId.value = '';
    recDia.value = 5;
    setRecType('despesa');
    recCategoria.value = 'outros';
    if (accounts.length > 0) recConta.value = accounts[0].id;
    recSubmitBtn.textContent = 'Adicionar recorrência';
  }

  recForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const desc = recDesc.value.trim();
    const valor = parseFloat(recValor.value);
    const dia = Math.min(28, Math.max(1, parseInt(recDia.value, 10) || 1));
    if (!desc) { showToast('Informe uma descrição.'); return; }
    if (isNaN(valor) || valor <= 0) { showToast('Informe um valor válido.'); return; }

    const payload = { descricao: desc, valor: Math.round(valor * 100) / 100, categoria: recCategoria.value, dia, tipo: recCurrentType, conta: recConta.value, ativo: true };
    const isNew = upsertById(recurring, editingRecId, payload);
    showToast(isNew ? 'Recorrência adicionada.' : 'Recorrência atualizada.');

    saveRecurring();
    resetRecForm();
    generateRecurringEntries();
    renderRecurring();
    renderAll();
  });

  function buildRecItem(r) {
    const cat = CATEGORIES[r.categoria] || CATEGORIES.outros;
    const acc = accounts.find((a) => a.id === r.conta);
    return `
        <div class="list-item" data-id="${r.id}">
          <div class="list-item-top">
            <div>
              <div class="list-item-title">${escapeHtml(r.descricao)}</div>
              <div class="list-item-sub">
                <span class="cat-pill" style="color:${cat.color}">${catIcon(r.categoria)} ${cat.label}</span>
                · todo dia ${r.dia}${acc ? ` · ${escapeHtml(acc.nome)}` : ''}
              </div>
            </div>
            <span class="list-item-value ${r.tipo === 'receita' ? 'amount income' : 'amount expense'}">${formatCurrency(r.valor)}</span>
          </div>${listItemActionsHtml()}
        </div>`;
  }

  function renderRecurring() {
    renderCollection({
      list: recurring, listEl: recList, countEl: recCount, emptyEl: emptyRec,
      singular: 'recorrência', plural: 'recorrências', itemHtml: buildRecItem
    });
    renderSuggestions();
  }

  recList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = getClickedItemId(ev);
    const r = recurring.find((x) => x.id === id);
    if (!r) return;
    if (btn.dataset.action === 'edit') {
      editingRecId = id;
      recId.value = id;
      recDesc.value = r.descricao;
      recValor.value = r.valor;
      recCategoria.value = r.categoria;
      recDia.value = r.dia;
      recConta.value = r.conta || (accounts[0] && accounts[0].id) || '';
      setRecType(r.tipo);
      recSubmitBtn.textContent = 'Salvar recorrência';
      recDesc.focus();
    } else if (btn.dataset.action === 'del') {
      if (!confirm(`Excluir a recorrência "${r.descricao}"? Lançamentos já criados não serão apagados.`)) return;
      recurring = recurring.filter((x) => x.id !== id);
      saveRecurring();
      renderRecurring();
      showToast('Recorrência excluída.');
    }
  });

  function generateRecurringEntries() {
    if (recurring.length === 0) return;
    const mesStr = mesString(0);
    let changed = false;

    recurring.forEach((r) => {
      if (!r.ativo) return;
      const jaExiste = entries.some((e) => e.recorrenteId === r.id && e.data.startsWith(mesStr));
      if (jaExiste) return;
      entries.push({
        id: uid(),
        descricao: r.descricao,
        valor: r.valor,
        data: `${mesStr}-${pad2(Math.min(r.dia, 28))}`,
        categoria: r.categoria,
        tipo: r.tipo,
        conta: r.conta,
        recorrenteId: r.id
      });
      changed = true;
    });

    if (changed) saveEntries();
  }

  /* ---------------- Detecção automática de gastos recorrentes ----------------
     Regra simples: mesma descrição aparecendo nos 3 últimos meses, com valores
     parecidos entre si (variação de até 30%), e que ainda não virou recorrência. */
  function normalizeDesc(str) {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function computeRecurringSuggestions() {
    const meses = [mesString(0), mesString(-1), mesString(-2)];
    const jaRecorrentes = new Set(recurring.map((r) => normalizeDesc(r.descricao)));
    const ignoradas = new Set(ignoredSuggestions);

    const grupos = {}; // descNorm -> { 'YYYY-MM': [entries] }
    entries.forEach((e) => {
      if (e.tipo !== 'despesa' || e.recorrenteId) return;
      const mesDaEntrada = e.data.slice(0, 7);
      if (!meses.includes(mesDaEntrada)) return;
      const key = normalizeDesc(e.descricao);
      if (!grupos[key]) grupos[key] = {};
      (grupos[key][mesDaEntrada] = grupos[key][mesDaEntrada] || []).push(e);
    });

    const sugestoes = [];
    Object.entries(grupos).forEach(([key, porMes]) => {
      if (jaRecorrentes.has(key) || ignoradas.has(key)) return;
      if (!meses.every((m) => porMes[m] && porMes[m].length > 0)) return; // precisa aparecer nos 3 meses

      const valoresPorMes = meses.map((m) => porMes[m].reduce((s, e) => s + e.valor, 0));
      const minValor = Math.min(...valoresPorMes);
      const maxValor = Math.max(...valoresPorMes);
      if (minValor <= 0 || maxValor / minValor > 1.3) return; // valores muito diferentes, não parece fixo

      const todasOcorrencias = Object.values(porMes).flat().sort((a, b) => (a.data < b.data ? 1 : -1));
      const maisRecente = todasOcorrencias[0];
      const valorMedio = valoresPorMes.reduce((s, v) => s + v, 0) / valoresPorMes.length;

      sugestoes.push({
        descNorm: key,
        descricao: maisRecente.descricao,
        valorMedio: Math.round(valorMedio * 100) / 100,
        categoria: maisRecente.categoria,
        conta: maisRecente.conta,
        dia: Math.min(28, parseInt(maisRecente.data.slice(8, 10), 10) || 5)
      });
    });

    return sugestoes;
  }

  function renderSuggestions() {
    const sugestoes = computeRecurringSuggestions();
    if (sugestoes.length === 0) {
      suggestionsCard.hidden = true;
      return;
    }
    suggestionsCard.hidden = false;
    suggestionsList.innerHTML = sugestoes.map((s) => `
      <div class="suggestion-item" data-key="${escapeHtml(s.descNorm)}">
        <div>
          <div class="list-item-title">${escapeHtml(s.descricao)}</div>
          <div class="list-item-sub">Detectamos esse gasto nos últimos 3 meses · ~${formatCurrency(s.valorMedio)}/mês</div>
        </div>
        <div class="suggestion-actions">
          <button type="button" class="btn btn-ghost" data-action="ignore">Ignorar</button>
          <button type="button" class="btn btn-primary" data-action="accept">Transformar em recorrência</button>
        </div>
      </div>`).join('');
  }

  suggestionsList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const item = ev.target.closest('.suggestion-item');
    const descNorm = item.dataset.key;
    const sugestao = computeRecurringSuggestions().find((s) => s.descNorm === descNorm);
    if (!sugestao) return;

    if (btn.dataset.action === 'accept') {
      const payload = {
        descricao: sugestao.descricao,
        valor: sugestao.valorMedio,
        categoria: sugestao.categoria,
        dia: sugestao.dia,
        tipo: 'despesa',
        conta: sugestao.conta || (accounts[0] && accounts[0].id) || '',
        ativo: true
      };
      upsertById(recurring, null, payload);
      saveRecurring();
      renderRecurring();
      showToast('Recorrência criada a partir da sugestão.');
    } else if (btn.dataset.action === 'ignore') {
      if (!ignoredSuggestions.includes(descNorm)) {
        ignoredSuggestions.push(descNorm);
        saveIgnoredSuggestions();
      }
      renderSuggestions();
    }
  });

  /* ---------------- Cartões de crédito ---------------- */
  function resetCardForm() {
    editingCardId = null;
    cardForm.reset();
    cardId.value = '';
    cardUsado.value = 0;
    cardSubmitBtn.textContent = 'Adicionar cartão';
  }

  cardForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = cardNome.value.trim();
    const limite = parseFloat(cardLimite.value);
    const usado = parseFloat(cardUsado.value) || 0;
    if (!nome) { showToast('Informe o nome do cartão.'); return; }
    if (isNaN(limite) || limite <= 0) { showToast('Informe um limite válido.'); return; }

    const payload = {
      nome, limite: Math.round(limite * 100) / 100, usado: Math.round(usado * 100) / 100,
      fechamento: parseInt(cardFechamento.value, 10) || null,
      vencimento: parseInt(cardVencimento.value, 10) || null
    };
    const isNew = upsertById(cards, editingCardId, payload);
    showToast(isNew ? 'Cartão adicionado.' : 'Cartão atualizado.');

    saveCards();
    resetCardForm();
    renderCards();
    renderAll(); // fatura do cartão afeta o patrimônio líquido
  });

  function buildCardItem(c) {
    const pct = c.limite > 0 ? Math.min(100, (c.usado / c.limite) * 100) : 0;
    const barColor = pct >= 90 ? 'var(--expense)' : pct >= 70 ? '#D9A441' : 'var(--income)';
    const disponivel = Math.max(0, c.limite - c.usado);
    return `
        <div class="list-item" data-id="${c.id}">
          <div class="list-item-top">
            <div>
              <div class="list-item-title">${escapeHtml(c.nome)}</div>
              <div class="list-item-sub">Disponível: ${formatCurrency(disponivel)}</div>
            </div>
            <span class="list-item-value">${formatCurrency(c.usado)} / ${formatCurrency(c.limite)}</span>
          </div>
          <div class="list-item-bar"><div class="list-item-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
          <div class="list-item-meta">
            ${c.fechamento ? `<span>Fecha dia ${c.fechamento}</span>` : ''}
            ${c.vencimento ? `<span>Vence dia ${c.vencimento}</span>` : ''}
          </div>${listItemActionsHtml()}
        </div>`;
  }

  function renderCards() {
    renderCollection({
      list: cards, listEl: cardList, countEl: cardCount, emptyEl: emptyCards,
      singular: 'cartão', plural: 'cartões', itemHtml: buildCardItem
    });
  }

  cardList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = getClickedItemId(ev);
    const c = cards.find((x) => x.id === id);
    if (!c) return;
    if (btn.dataset.action === 'edit') {
      editingCardId = id;
      cardId.value = id;
      cardNome.value = c.nome;
      cardLimite.value = c.limite;
      cardUsado.value = c.usado;
      cardFechamento.value = c.fechamento || '';
      cardVencimento.value = c.vencimento || '';
      cardSubmitBtn.textContent = 'Salvar cartão';
      cardNome.focus();
    } else if (btn.dataset.action === 'del') {
      if (!confirm(`Excluir o cartão "${c.nome}"?`)) return;
      cards = cards.filter((x) => x.id !== id);
      saveCards();
      renderCards();
      renderAll();
      showToast('Cartão excluído.');
    }
  });

  /* ---------------- Outras dívidas ---------------- */
  function resetDebtForm() {
    editingDebtId = null;
    debtForm.reset();
    debtId.value = '';
    debtSubmitBtn.textContent = 'Adicionar dívida';
  }

  debtForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = debtNome.value.trim();
    const valor = parseFloat(debtValor.value);
    if (!nome) { showToast('Informe o nome da dívida.'); return; }
    if (isNaN(valor) || valor <= 0) { showToast('Informe um valor válido.'); return; }

    const payload = { nome, valor: Math.round(valor * 100) / 100 };
    const isNew = upsertById(debts, editingDebtId, payload);
    showToast(isNew ? 'Dívida adicionada.' : 'Dívida atualizada.');

    saveDebts();
    resetDebtForm();
    renderDebts();
    renderAll();
  });

  function buildDebtItem(d) {
    return `
      <div class="list-item" data-id="${d.id}">
        <div class="list-item-top">
          <div class="list-item-title">${escapeHtml(d.nome)}</div>
          <span class="list-item-value amount expense">${formatCurrency(d.valor)}</span>
        </div>${listItemActionsHtml()}
      </div>`;
  }

  function renderDebts() {
    renderCollection({
      list: debts, listEl: debtList, countEl: debtCount, emptyEl: emptyDebts,
      singular: 'dívida', plural: 'dívidas', itemHtml: buildDebtItem
    });
  }

  debtList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = getClickedItemId(ev);
    const d = debts.find((x) => x.id === id);
    if (!d) return;
    if (btn.dataset.action === 'edit') {
      editingDebtId = id;
      debtId.value = id;
      debtNome.value = d.nome;
      debtValor.value = d.valor;
      debtSubmitBtn.textContent = 'Salvar dívida';
      debtNome.focus();
    } else if (btn.dataset.action === 'del') {
      if (!confirm(`Excluir a dívida "${d.nome}"?`)) return;
      debts = debts.filter((x) => x.id !== id);
      saveDebts();
      renderDebts();
      renderAll();
      showToast('Dívida excluída.');
    }
  });

  /* ---------------- Orçamento mensal por categoria ---------------- */
  function populateBudgetCategoriaSelect() {
    const prev = budgetCategoria.value;
    const jaOrcadas = new Set(budgets.map((b) => b.categoria));
    budgetCategoria.innerHTML = Object.entries(CATEGORIES).map(([id, c]) => {
      const editandoEstaCategoria = editingBudgetId && budgets.find((b) => b.id === editingBudgetId)?.categoria === id;
      const bloqueada = jaOrcadas.has(id) && id !== prev && !editandoEstaCategoria;
      return `<option value="${id}" ${bloqueada ? 'disabled' : ''}>${c.label}${jaOrcadas.has(id) ? ' (já tem orçamento)' : ''}</option>`;
    }).join('');
  }

  function resetBudgetForm() {
    editingBudgetId = null;
    budgetForm.reset();
    budgetId.value = '';
    budgetSubmitBtn.textContent = 'Adicionar orçamento';
    populateBudgetCategoriaSelect();
  }

  budgetForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const categoria = budgetCategoria.value;
    const limite = parseFloat(budgetLimite.value);
    if (isNaN(limite) || limite <= 0) { showToast('Informe um limite válido.'); return; }

    // Evita dois orçamentos para a mesma categoria: se já existir um (e não for o que está sendo editado), atualiza-o em vez de duplicar
    const existente = budgets.find((b) => b.categoria === categoria && b.id !== editingBudgetId);
    const idParaSalvar = editingBudgetId || (existente ? existente.id : null);

    const payload = { categoria, limite: Math.round(limite * 100) / 100 };
    const isNew = upsertById(budgets, idParaSalvar, payload);
    showToast(isNew ? 'Orçamento adicionado.' : 'Orçamento atualizado.');

    saveBudgets();
    resetBudgetForm();
    renderOrcamento();
  });

  function buildBudgetItem(b) {
    const cat = CATEGORIES[b.categoria] || CATEGORIES.outros;
    const mesAtual = mesString();
    const gasto = computeDespesasPorCategoria(mesAtual)[b.categoria] || 0;
    const pct = b.limite > 0 ? Math.min(100, (gasto / b.limite) * 100) : 0;
    const estourou = gasto > b.limite;
    const barColor = estourou ? 'var(--expense)' : pct >= 70 ? '#D9A441' : 'var(--income)';
    const sub = estourou
      ? `Estourou em ${formatCurrency(gasto - b.limite)}`
      : `Restam ${formatCurrency(b.limite - gasto)}`;

    return `
        <div class="list-item" data-id="${b.id}">
          <div class="list-item-top">
            <div>
              <span class="cat-pill" style="color:${cat.color}">${catIcon(b.categoria)} ${cat.label}</span>
              <div class="list-item-sub${estourou ? ' warn' : ''}">${sub}</div>
            </div>
            <span class="list-item-value">${formatCurrency(gasto)} / ${formatCurrency(b.limite)}</span>
          </div>
          <div class="list-item-bar"><div class="list-item-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>${listItemActionsHtml()}
        </div>`;
  }

  function renderOrcamento() {
    renderCollection({
      list: budgets, listEl: budgetList, countEl: budgetCount, emptyEl: emptyBudgets,
      singular: 'orçamento', plural: 'orçamentos', itemHtml: buildBudgetItem
    });
  }

  budgetList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = getClickedItemId(ev);
    const b = budgets.find((x) => x.id === id);
    if (!b) return;
    if (btn.dataset.action === 'edit') {
      editingBudgetId = id;
      budgetId.value = id;
      populateBudgetCategoriaSelect();
      budgetCategoria.value = b.categoria;
      budgetLimite.value = b.limite;
      budgetSubmitBtn.textContent = 'Salvar orçamento';
    } else if (btn.dataset.action === 'del') {
      if (!confirm(`Excluir o orçamento de "${(CATEGORIES[b.categoria] || CATEGORIES.outros).label}"?`)) return;
      budgets = budgets.filter((x) => x.id !== id);
      saveBudgets();
      populateBudgetCategoriaSelect();
      renderOrcamento();
      showToast('Orçamento excluído.');
    }
  });

  /* ---------------- Metas financeiras ---------------- */
  function resetGoalForm() {
    editingGoalId = null;
    goalForm.reset();
    goalId.value = '';
    goalAtual.value = 0;
    goalSubmitBtn.textContent = 'Adicionar meta';
  }

  goalForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = goalNome.value.trim();
    const alvo = parseFloat(goalAlvo.value);
    const atual = parseFloat(goalAtual.value) || 0;
    if (!nome) { showToast('Informe o nome da meta.'); return; }
    if (isNaN(alvo) || alvo <= 0) { showToast('Informe um valor alvo válido.'); return; }

    const payload = { nome, alvo: Math.round(alvo * 100) / 100, atual: Math.round(atual * 100) / 100, prazo: goalPrazo.value || null };
    const isNew = upsertById(goals, editingGoalId, payload);
    showToast(isNew ? 'Meta adicionada.' : 'Meta atualizada.');

    saveGoals();
    resetGoalForm();
    renderGoals();
  });

  const ICON_ADD_VALUE_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function buildGoalItem(g) {
    const pct = g.alvo > 0 ? Math.min(100, (g.atual / g.alvo) * 100) : 0;
    const falta = Math.max(0, g.alvo - g.atual);
    const addValueBtn = `<button class="add-value" data-action="add" aria-label="Guardar valor">${ICON_ADD_VALUE_SVG}</button>`;
    return `
        <div class="list-item" data-id="${g.id}">
          <div class="list-item-top">
            <div>
              <div class="list-item-title">${escapeHtml(g.nome)}</div>
              <div class="list-item-sub">${pct >= 100 ? 'Meta concluída! 🎉' : `Faltam ${formatCurrency(falta)}`}${g.prazo ? ` · até ${formatDateDisplay(g.prazo)}` : ''}</div>
            </div>
            <span class="list-item-value">${formatCurrency(g.atual)} / ${formatCurrency(g.alvo)}</span>
          </div>
          <div class="list-item-bar"><div class="list-item-bar-fill" style="width:${pct}%"></div></div>${listItemActionsHtml(addValueBtn)}
        </div>`;
  }

  function renderGoals() {
    renderCollection({
      list: goals, listEl: goalList, countEl: goalCount, emptyEl: emptyGoals,
      singular: 'meta', plural: 'metas', itemHtml: buildGoalItem
    });
  }

  goalList.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = getClickedItemId(ev);
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    if (btn.dataset.action === 'add') {
      const valorStr = prompt(`Quanto deseja guardar para "${g.nome}"?`, '');
      const valor = parseFloat((valorStr || '').replace(',', '.'));
      if (!valorStr || isNaN(valor) || valor <= 0) return;
      g.atual = Math.round((g.atual + valor) * 100) / 100;
      saveGoals();
      renderGoals();
      showToast('Valor adicionado à meta.');
    } else if (btn.dataset.action === 'edit') {
      editingGoalId = id;
      goalId.value = id;
      goalNome.value = g.nome;
      goalAlvo.value = g.alvo;
      goalAtual.value = g.atual;
      goalPrazo.value = g.prazo || '';
      goalSubmitBtn.textContent = 'Salvar meta';
      goalNome.focus();
    } else if (btn.dataset.action === 'del') {
      if (!confirm(`Excluir a meta "${g.nome}"?`)) return;
      goals = goals.filter((x) => x.id !== id);
      saveGoals();
      renderGoals();
      showToast('Meta excluída.');
    }
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
    cards = loadCards();
    recurring = loadRecurring();
    goals = loadGoals();
    accounts = loadAccounts();
    debts = loadDebts();
    budgets = loadBudgets();
    ignoredSuggestions = loadIgnoredSuggestions();
    ensureAccountsForProfile();
    generateRecurringEntries();
    populateCategorySelects();
    populateAccountSelects();
    resetRecForm();
    resetCardForm();
    resetGoalForm();
    resetAccountForm();
    resetDebtForm();
    resetBudgetForm();
    resumoMesInput.value = mesString(0);
    updateInvestFieldsVisibility();
    renderAll();
    renderCards();
    renderRecurring();
    renderGoals();
    renderAccounts();
    renderDebts();
  }

  init();
})();
