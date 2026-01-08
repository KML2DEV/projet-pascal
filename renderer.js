// Renderer logic for memo, weather and calendar

// ---------- THÈME SOMBRE ----------
const themeToggle = document.getElementById('themeToggle');
const THEME_KEY = 'dashboard_theme_mode';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }
}

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark-mode');
  const isDark = document.documentElement.classList.contains('dark-mode');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
});

initTheme();

// ---------- MÉMO ----------
const memoInput = document.getElementById('memoInput');
const saveMemoBtn = document.getElementById('saveMemo');
const clearMemoBtn = document.getElementById('clearMemo');
const memoStatus = document.getElementById('memoStatus');

// Fond d'écran
const bgToggle = document.getElementById('bgToggle');
const bgMenu = document.getElementById('bgMenu');
const bgUrlInput = document.getElementById('bgUrl');
const bgApplyBtn = document.getElementById('bgApply');
const bgResetBtn = document.getElementById('bgReset');
const BG_KEY = 'dashboard_bg_image_v1';

const MEMO_KEY = 'dashboard_memo_v1';
const MEMO_MAX = 5000;

// Fallback si localStorage indisponible (quota, permissions, etc.)
let memoCache = '';

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage.getItem a échoué:', e);
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('localStorage.setItem a échoué:', e);
    return false;
  }
}

// ---------- FOND D'ÉCRAN ----------
function applyBackground(value, persist = true) {
  const root = document.documentElement;
  if (!value) {
    root.style.setProperty('--bg-image', 'none');
    root.style.setProperty('--bg-size', 'cover');
    root.style.setProperty('--bg-repeat', 'no-repeat');
    root.style.setProperty('--bg-position', 'center');
    if (persist) safeSetItem(BG_KEY, '');
    return;
  }
  const isPattern = value.includes('radial-gradient');
  root.style.setProperty('--bg-image', value);
  root.style.setProperty('--bg-size', isPattern ? '12px 12px' : 'cover');
  root.style.setProperty('--bg-repeat', isPattern ? 'repeat' : 'no-repeat');
  root.style.setProperty('--bg-position', 'center');
  if (persist) safeSetItem(BG_KEY, value);
}

function loadBackground() {
  const saved = safeGetItem(BG_KEY);
  if (saved) {
    applyBackground(saved, false);
    if (bgUrlInput) {
      const match = saved.match(/url\(["']?(.*?)["']?\)/);
      if (match && match[1]) {
        bgUrlInput.value = match[1];
      }
    }
  }
}

function closeBgMenuIfOutside(e) {
  if (!bgMenu || !bgToggle) return;
  if (!bgMenu.contains(e.target) && !bgToggle.contains(e.target)) {
    bgMenu.style.display = 'none';
  }
}

function initBackgroundPicker() {
  if (!bgToggle || !bgMenu) return;

  bgToggle.addEventListener('click', () => {
    bgMenu.style.display = bgMenu.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', closeBgMenuIfOutside);

  const presets = document.querySelectorAll('[data-bg-preset]');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.bgPreset;
      let value = null;
      if (preset === 'gradient1') value = 'linear-gradient(135deg, #0f172a, #1e293b, #2563eb)';
      else if (preset === 'gradient2') value = 'linear-gradient(135deg, #0f172a, #312e81, #6d28d9)';
      else if (preset === 'gradient3') value = 'linear-gradient(135deg, #0f766e, #0ea5e9, #38bdf8)';
      else if (preset === 'paper') value = 'linear-gradient(180deg, #f8fafc, #f1f5f9)';
      else if (preset === 'dots') value = 'radial-gradient(#e5e7eb 1px, transparent 1px)';
      else value = null;
      applyBackground(value);
    });
  });

  if (bgApplyBtn && bgUrlInput) {
    bgApplyBtn.addEventListener('click', () => {
      const url = bgUrlInput.value.trim();
      if (!url) return;
      applyBackground(`url("${url}")`);
    });
  }

  if (bgResetBtn && bgUrlInput) {
    bgResetBtn.addEventListener('click', () => {
      bgUrlInput.value = '';
      applyBackground(null);
    });
  }

  loadBackground();
}

initBackgroundPicker();

function loadMemo() {
  const stored = safeGetItem(MEMO_KEY);
  const text = stored !== null ? stored : memoCache || '';
  memoInput.value = text;
}

function saveMemo() {
  const val = memoInput.value;
  if (val.length > MEMO_MAX) {
    memoStatus.textContent = `Trop long (${val.length}/${MEMO_MAX})`;
    return;
  }
  const ok = safeSetItem(MEMO_KEY, val);
  if (!ok) {
    memoCache = val; // fallback en mémoire
    memoStatus.textContent = 'Stockage indisponible — mémo gardé temporairement';
  } else {
    memoStatus.textContent = 'Enregistré';
  }
  setTimeout(() => memoStatus.textContent = '', 1500);
}

saveMemoBtn.addEventListener('click', saveMemo);
clearMemoBtn.addEventListener('click', () => {
  memoInput.value = '';
  saveMemo();
});

memoInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveMemo();
  }
});

loadMemo();

// La fonctionnalité météo a été supprimée.

// ---------- CALENDRIER ----------
const calendarGrid = document.getElementById('calendarGrid');
const calTitle = document.getElementById('calTitle');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const upcomingList = document.getElementById('upcomingList');

let current = new Date(); // will show this month

// Événements du calendrier (stockés en local)
const EVENTS_KEY = 'dashboard_events_v1';
let events = {};

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadEvents() {
  try {
    const raw = safeGetItem(EVENTS_KEY);
    events = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Impossible de charger les événements:', e);
    events = {};
  }
}

function saveEvents() {
  try {
    safeSetItem(EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn('Impossible de sauvegarder les événements:', e);
  }
}

function editEvent(dateKey) {
  const existing = (events[dateKey] && events[dateKey][0]) ? events[dateKey][0] : '';
  const label = existing ? 'Modifier l\'événement (laisser vide pour supprimer)' : 'Ajouter un événement';
  const input = window.prompt(label, existing);
  if (input === null) return; // annulé
  const val = input.trim();
  if (!val) {
    delete events[dateKey];
  } else {
    events[dateKey] = [val];
  }
  saveEvents();
  buildCalendar(current);
  renderUpcoming();
}

function buildCalendar(dt) {
  calendarGrid.innerHTML = '';
  const year = dt.getFullYear();
  const month = dt.getMonth();
  calTitle.textContent = dt.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  // header weekdays
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const headerRow = document.createElement('div');
  headerRow.className = 'cal-row header';
  days.forEach(d => { const el = document.createElement('div'); el.className = 'cal-cell header'; el.textContent = d; headerRow.appendChild(el); });
  calendarGrid.appendChild(headerRow);

  // first day of month and number of days
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // weekday index in JS: 0=Sun,1=Mon... we want Monday-first index
  let startIndex = first.getDay(); // 0=Sun
  startIndex = (startIndex === 0) ? 6 : startIndex - 1; // convert to 0=Mon..6=Sun

  let cells = [];
  for (let i = 0; i < startIndex; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));

  // Assurer un calendrier à hauteur fixe: toujours 6 semaines (42 cases)
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  // create rows of 7
  for (let r = 0; r < Math.ceil(cells.length / 7); r++) {
    const row = document.createElement('div');
    row.className = 'cal-row';
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      const dayVal = cells[idx];
      if (dayVal) {
        const dateKey = formatDateKey(dayVal);
        cell.dataset.date = dateKey;

        const numberEl = document.createElement('span');
        numberEl.className = 'day-number';
        numberEl.textContent = dayVal.getDate();
        cell.appendChild(numberEl);

        // afficher événement (premier) et point indicateur
        const evt = events[dateKey];
        if (evt && evt.length > 0) {
          const dot = document.createElement('span');
          dot.className = 'event-dot';
          cell.appendChild(dot);

          const title = document.createElement('div');
          title.className = 'event-title';
          title.textContent = evt[0];
          cell.appendChild(title);
        }

        // clic pour ajouter/modifier
        cell.addEventListener('click', () => editEvent(dateKey));
        // highlight today
        const today = new Date();
        if (dayVal.getFullYear() === today.getFullYear() && dayVal.getMonth() === today.getMonth() && dayVal.getDate() === today.getDate()) {
          cell.classList.add('today');
        }
      }
      else {
        cell.classList.add('empty');
      }
      row.appendChild(cell);
    }
    calendarGrid.appendChild(row);
  }
}

prevMonthBtn.addEventListener('click', () => {
  current.setMonth(current.getMonth() - 1);
  buildCalendar(current);
});
nextMonthBtn.addEventListener('click', () => {
  current.setMonth(current.getMonth() + 1);
  buildCalendar(current);
});

loadEvents();
buildCalendar(current);
renderUpcoming();

// --------- Jours fériés France + Alsace ---------
const holidaysList = document.getElementById('holidaysList');
const holidaysRefresh = document.getElementById('holidaysRefresh');

async function fetchFrenchHolidays(year, zone = 'metropole') {
  const url = `https://calendrier.api.gouv.fr/jours-feries/${zone}/${year}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getUpcomingFrenchHolidays() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const y = today.getFullYear();
  
  try {
    const [metro, alsace] = await Promise.all([
      fetchFrenchHolidays(y, 'metropole'),
      fetchFrenchHolidays(y, 'alsace-moselle')
    ]);
    
    const [metroNext, alsaceNext] = await Promise.all([
      fetchFrenchHolidays(y + 1, 'metropole'),
      fetchFrenchHolidays(y + 1, 'alsace-moselle')
    ]);
    
    const items = [];
    
    // Jours métropole
    Object.entries({...metro, ...metroNext}).forEach(([dateStr, name]) => {
      const dt = new Date(dateStr);
      dt.setHours(0,0,0,0);
      if (dt >= today) {
        items.push({ date: dt, name, region: 'France' });
      }
    });
    
    // Jours Alsace-Moselle uniquement (ceux qui ne sont pas en métropole)
    Object.entries({...alsace, ...alsaceNext}).forEach(([dateStr, name]) => {
      const dt = new Date(dateStr);
      dt.setHours(0,0,0,0);
      if (dt >= today) {
        // Vérifier si ce jour existe déjà dans métropole
        const metroAll = {...metro, ...metroNext};
        if (!metroAll[dateStr]) {
          items.push({ date: dt, name, region: 'Alsace' });
        }
      }
    });
    
    items.sort((a,b) => a.date - b.date);
    return items.slice(0, 8);
  } catch (e) {
    console.warn('Erreur fetch jours fériés:', e);
    return [];
  }
}

async function renderHolidays() {
  if (!holidaysList) return;
  holidaysList.innerHTML = '';
  
  try {
    const holidays = await getUpcomingFrenchHolidays();
    if (!holidays.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-holidays';
      empty.textContent = 'Aucun jour férié à venir.';
      holidaysList.appendChild(empty);
      return;
    }
    
    const locale = 'fr-FR';
    for (const item of holidays) {
      const row = document.createElement('div');
      row.className = 'holiday-item';
      
      const date = document.createElement('div');
      date.className = 'holiday-date';
      date.textContent = item.date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
      
      const title = document.createElement('div');
      title.className = 'holiday-title';
      title.textContent = item.name;
      
      row.appendChild(date);
      row.appendChild(title);
      
      if (item.region === 'Alsace') {
        const region = document.createElement('span');
        region.className = 'holiday-region';
        region.textContent = 'Alsace';
        row.appendChild(region);
      }
      
      holidaysList.appendChild(row);
    }
  } catch (e) {
    const empty = document.createElement('div');
    empty.className = 'empty-holidays';
    empty.textContent = 'Erreur de chargement.';
    holidaysList.appendChild(empty);
    console.warn('Erreur rendu jours fériés:', e);
  }
}

if (holidaysRefresh) {
  holidaysRefresh.addEventListener('click', () => renderHolidays());
}

renderHolidays();

// --------- Système de cartes flexibles avec positionnement libre ---------
let draggedCard = null;
let offsetX = 0;
let offsetY = 0;
const LAYOUT_KEY = 'dashboard-layout';

// Positions par défaut des cartes
const defaultPositions = {
  'card-memo': { x: 20, y: 20, width: '400px', height: '450px' },
  'card-calendar': { x: 440, y: 20, width: '400px', height: '450px' },
  'card-events': { x: 860, y: 20, width: '360px', height: '210px' },
  'card-holidays': { x: 860, y: 250, width: '360px', height: '210px' },
  'card-fr-news': { x: 20, y: 490, width: '800px', height: '280px' },
  'card-weather': { x: 840, y: 490, width: '380px', height: '280px' }
};

// Charger la disposition sauvegardée
function loadLayout() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    const layout = saved ? JSON.parse(saved) : {};
    
    document.querySelectorAll('.card').forEach(card => {
      const id = card.id;
      const config = layout[id] || defaultPositions[id] || { x: 20, y: 20, width: '400px', height: '400px' };
      
      // Toujours définir une position
      card.style.left = (config.x || 20) + 'px';
      card.style.top = (config.y || 20) + 'px';
      card.style.width = config.width || '400px';
      card.style.height = config.height || '400px';
      
      if (config.hidden) {
        card.classList.add('hidden');
      } else {
        card.classList.remove('hidden');
      }
    });
  } catch (e) {
    console.warn('Erreur chargement layout:', e);
    applyDefaultLayout();
  }
}

// Appliquer la disposition par défaut
function applyDefaultLayout() {
  document.querySelectorAll('.card').forEach(card => {
    const id = card.id;
    const pos = defaultPositions[id];
    if (pos) {
      card.style.left = pos.x + 'px';
      card.style.top = pos.y + 'px';
      card.style.width = pos.width;
      card.style.height = pos.height;
    }
  });
  saveLayout();
}

// Sauvegarder la disposition
function saveLayout() {
  try {
    const layout = {};
    
    document.querySelectorAll('.card').forEach(card => {
      if (card.id) {
        layout[card.id] = {
          x: parseInt(card.style.left) || 0,
          y: parseInt(card.style.top) || 0,
          width: card.style.width || '',
          height: card.style.height || '',
          hidden: card.classList.contains('hidden')
        };
      }
    });
    
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch (e) {
    console.warn('Erreur sauvegarde layout:', e);
  }
}

// Initialiser le système de cartes
function initDraggableCards() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    // Ajouter un ID basé sur les classes
    if (!card.id) {
      const mainClass = Array.from(card.classList).find(c => c !== 'card') || 'unknown';
      card.id = `card-${mainClass}`;
    }
    
    // Ajouter poignée de fermeture
    const closeBtn = document.createElement('div');
    closeBtn.className = 'card-close';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Masquer cette carte';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.add('hidden');
      updateCardToggles();
      saveLayout();
    });
    card.insertBefore(closeBtn, card.firstChild);
    
    // Ajouter poignée de drag
    const handle = document.createElement('div');
    handle.className = 'card-drag-handle';
    handle.title = 'Glisser pour déplacer';
    card.insertBefore(handle, card.firstChild);
    
    // Drag & Drop libre
    handle.addEventListener('mousedown', startDrag);
    
    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      saveLayout();
    });
    resizeObserver.observe(card);
  });
  
  // Charger la disposition
  loadLayout();
  
  // Initialiser le menu de gestion
  initCardsManager();
}

function startDrag(e) {
  e.preventDefault();
  e.stopPropagation();
  
  draggedCard = e.target.closest('.card');
  const rect = draggedCard.getBoundingClientRect();
  
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  draggedCard.style.zIndex = '100';
  draggedCard.style.cursor = 'grabbing';
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
  if (!draggedCard) return;
  
  const grid = document.querySelector('.grid');
  const gridRect = grid.getBoundingClientRect();
  
  let newX = e.clientX - gridRect.left - offsetX;
  let newY = e.clientY - gridRect.top - offsetY;
  
  // Limites pour ne pas sortir du conteneur
  newX = Math.max(0, Math.min(newX, gridRect.width - draggedCard.offsetWidth));
  newY = Math.max(0, Math.min(newY, gridRect.height - draggedCard.offsetHeight));
  
  draggedCard.style.left = newX + 'px';
  draggedCard.style.top = newY + 'px';
}

function stopDrag() {
  if (draggedCard) {
    draggedCard.style.zIndex = '';
    draggedCard.style.cursor = '';
    saveLayout();
    draggedCard = null;
  }
  
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// Gestion du menu des cartes
function initCardsManager() {
  const managerBtn = document.getElementById('cardsManager');
  const menu = document.getElementById('cardsMenu');
  const resetBtn = document.getElementById('resetLayout');
  
  // Toggle menu
  managerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    updateCardToggles();
  });
  
  // Fermer menu si clic ailleurs
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== managerBtn) {
      menu.style.display = 'none';
    }
  });
  
  // Gérer les checkboxes
  ['memo', 'calendar', 'events', 'holidays', 'fr-news', 'weather'].forEach(name => {
    const checkbox = document.getElementById(`toggle-${name}`);
    const card = document.getElementById(`card-${name}`);
    
    if (checkbox && card) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
        saveLayout();
      });
    }
  });
  
  // Réinitialiser
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(LAYOUT_KEY);
    document.querySelectorAll('.card').forEach(c => c.classList.remove('hidden'));
    applyDefaultLayout();
    updateCardToggles();
    menu.style.display = 'none';
  });
}

// Mettre à jour l'état des checkboxes
function updateCardToggles() {
  ['memo', 'calendar', 'events', 'holidays', 'fr-news', 'weather'].forEach(name => {
    const checkbox = document.getElementById(`toggle-${name}`);
    const card = document.getElementById(`card-${name}`);
    
    if (checkbox && card) {
      checkbox.checked = !card.classList.contains('hidden');
    }
  });
}

// --------- Météo avec Open-Meteo (API gratuite, pas de clé requise) ---------
const weatherDisplay = document.getElementById('weatherDisplay');
const postalCodeInput = document.getElementById('postalCode');
const weatherSearchBtn = document.getElementById('weatherSearch');
const weatherAutoBtn = document.getElementById('weatherAuto');

// Géocodage inversé : obtenir lat/lon à partir d'un nom de ville
async function geocodeCity(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},France&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Géocodage échoué');
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return {
      city: data[0].name || query,
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch (e) {
    console.error('Erreur géocodage:', e);
    return null;
  }
}

// Détecter automatiquement la ville via IP
async function detectLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('Erreur géolocalisation');
    const data = await res.json();
    return {
      city: data.city,
      lat: data.latitude,
      lon: data.longitude
    };
  } catch (e) {
    console.warn('Géolocalisation échouée:', e);
    return null;
  }
}

// Récupérer météo par ville ou code postal (Open-Meteo)
async function fetchWeatherByQuery(query) {
  if (!query || query.length < 3) {
    return { error: 'Recherche trop courte' };
  }
  
  try {
    let lat, lon, cityName;
    
    // Si code postal français (5 chiffres), géocoder
    if (/^\d{5}$/.test(query)) {
      // Code postal → recherche nominatim
      const geo = await geocodeCity(query);
      if (!geo) return { error: 'Code postal non trouvé' };
      lat = geo.lat; lon = geo.lon; cityName = geo.city;
    } else {
      // Nom de ville → géocoder
      const geo = await geocodeCity(query);
      if (!geo) return { error: 'Ville non trouvée' };
      lat = geo.lat; lon = geo.lon; cityName = geo.city;
    }
    
    // Récupérer météo Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Europe/Paris`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current_weather;
    
    // Mapper les codes WMO vers descriptions
    const wmoDesc = {
      0: '☀️ Dégagé', 1: '🌤️ Peu nuageux', 2: '⛅ Nuageux', 3: '☁️ Couvert',
      45: '🌫️ Brouillard', 48: '🌫️ Brouillard givrant',
      51: '🌧️ Léger crachin', 53: '🌧️ Crachin', 55: '🌧️ Crachin dense',
      61: '🌧️ Légère pluie', 63: '🌧️ Pluie', 65: '🌧️ Pluie dense',
      71: '🌨️ Légère neige', 73: '🌨️ Neige', 75: '🌨️ Neige dense',
      80: '⛈️ Averses légères', 81: '⛈️ Averses', 82: '⛈️ Averses violentes',
      95: '⛈️ Orage', 96: '⛈️ Orage avec grêle', 99: '⛈️ Orage violent'
    };
    
    return {
      city: cityName,
      temp: Math.round(current.temperature),
      feels: Math.round(current.temperature - 2),
      description: wmoDesc[current.weather_code] || 'Météo',
      wmoCode: current.weather_code,
      humidity: '-',
      wind: Math.round(current.wind_speed)
    };
  } catch (e) {
    console.error('Erreur météo:', e);
    return { error: 'Impossible de récupérer la météo' };
  }
}

// Récupérer météo par coordonnées (Open-Meteo)
async function fetchWeatherByCoords(lat, lon, cityName = 'Localisation') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Europe/Paris`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current_weather;
    
    const wmoDesc = {
      0: '☀️ Dégagé', 1: '🌤️ Peu nuageux', 2: '⛅ Nuageux', 3: '☁️ Couvert',
      45: '🌫️ Brouillard', 48: '🌫️ Brouillard givrant',
      51: '🌧️ Léger crachin', 53: '🌧️ Crachin', 55: '🌧️ Crachin dense',
      61: '🌧️ Légère pluie', 63: '🌧️ Pluie', 65: '🌧️ Pluie dense',
      71: '🌨️ Légère neige', 73: '🌨️ Neige', 75: '🌨️ Neige dense',
      80: '⛈️ Averses légères', 81: '⛈️ Averses', 82: '⛈️ Averses violentes',
      95: '⛈️ Orage', 96: '⛈️ Orage avec grêle', 99: '⛈️ Orage violent'
    };
    
    return {
      city: cityName,
      temp: Math.round(current.temperature),
      feels: Math.round(current.temperature - 2),
      description: wmoDesc[current.weather_code] || 'Météo',
      wmoCode: current.weather_code,
      humidity: '-',
      wind: Math.round(current.wind_speed)
    };
  } catch (e) {
    return { error: 'Impossible de récupérer la météo' };
  }
}

// Obtenir une illustration SVG basée sur le code WMO
function getWeatherSVG(wmoCode) {
  const svgs = {
    0: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><circle cx="50" cy="50" r="35" fill="#FFD700"/></svg>',
    1: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><circle cx="50" cy="50" r="35" fill="#FFD700"/><path d="M 70 35 Q 80 35 85 40 Q 85 48 75 50" fill="#E8E8E8"/></svg>',
    2: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="40" cy="45" rx="18" ry="15" fill="#D3D3D3"/><ellipse cx="60" cy="40" rx="20" ry="17" fill="#D3D3D3"/></svg>',
    3: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="35" cy="50" rx="22" ry="18" fill="#A9A9A9"/><ellipse cx="60" cy="45" rx="25" ry="20" fill="#A9A9A9"/></svg>',
    45: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="50" cy="50" rx="30" ry="20" fill="#C0C0C0" opacity="0.7"/><text x="50" y="60" font-size="30" text-anchor="middle" fill="#808080">≈</text></svg>',
    48: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="50" cy="50" rx="30" ry="20" fill="#A9A9A9" opacity="0.8"/><text x="50" y="60" font-size="28" text-anchor="middle" fill="#FFFFFF">❄</text></svg>',
    51: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="45" cy="40" rx="18" ry="14" fill="#B0C4DE"/><path d="M 30 60 L 32 70 M 50 65 L 52 75 M 70 60 L 72 70" stroke="#4682B4" stroke-width="2"/></svg>',
    53: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="45" cy="35" rx="20" ry="16" fill="#87CEEB"/><path d="M 25 55 L 28 70 M 50 60 L 53 75 M 75 55 L 78 70" stroke="#1E90FF" stroke-width="2.5"/></svg>',
    55: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="40" cy="30" rx="22" ry="18" fill="#4682B4"/><path d="M 20 50 L 24 72 M 45 55 L 50 77 M 70 50 L 75 72" stroke="#00008B" stroke-width="3"/></svg>',
    61: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="45" cy="35" rx="20" ry="16" fill="#B0C4DE"/><path d="M 30 58 L 33 73 M 52 62 L 55 77 M 72 58 L 75 73" stroke="#4169E1" stroke-width="2.5"/></svg>',
    63: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="40" cy="30" rx="22" ry="18" fill="#6495ED"/><path d="M 20 55 L 25 75 M 45 60 L 52 80 M 70 55 L 76 75" stroke="#00008B" stroke-width="3"/></svg>',
    65: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="35" cy="25" rx="25" ry="20" fill="#1E90FF"/><path d="M 15 52 L 22 80 M 42 58 L 52 85 M 68 52 L 78 80" stroke="#000080" stroke-width="3.5"/></svg>',
    71: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="45" cy="35" rx="20" ry="16" fill="#F0F8FF"/><text x="25" y="70" font-size="16" fill="#87CEEB">❄</text><text x="50" y="75" font-size="16" fill="#87CEEB">❄</text><text x="72" y="70" font-size="16" fill="#87CEEB">❄</text></svg>',
    73: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="40" cy="30" rx="22" ry="18" fill="#E0F4FF"/><text x="20" y="65" font-size="18" fill="#87CEEB">❄</text><text x="48" y="70" font-size="18" fill="#87CEEB">❄</text><text x="75" y="65" font-size="18" fill="#87CEEB">❄</text></svg>',
    75: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="35" cy="25" rx="25" ry="20" fill="#B0E0E6"/><text x="15" y="65" font-size="20" fill="#00008B">❄</text><text x="45" y="72" font-size="20" fill="#00008B">❄</text><text x="75" y="65" font-size="20" fill="#00008B">❄</text></svg>',
    80: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="45" cy="35" rx="20" ry="16" fill="#87CEEB"/><path d="M 30 58 L 34 78 M 52 62 L 57 82 M 72 58 L 77 78" stroke="#4169E1" stroke-width="2.5"/><path d="M 35 68 Q 40 65 45 68" stroke="#FFD700" stroke-width="1.5"/></svg>',
    81: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="40" cy="30" rx="22" ry="18" fill="#6495ED"/><path d="M 22 55 L 28 78 M 48 60 L 55 82 M 75 55 L 82 78" stroke="#00008B" stroke-width="3"/><path d="M 28 68 Q 35 63 42 68" stroke="#FFD700" stroke-width="1.5"/></svg>',
    82: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="35" cy="25" rx="25" ry="20" fill="#1E90FF"/><path d="M 18 52 L 26 80 M 45 58 L 55 85 M 72 52 L 82 80" stroke="#000080" stroke-width="3.5"/><path d="M 25 70 Q 33 63 42 70" stroke="#FFD700" stroke-width="2"/></svg>',
    95: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="40" cy="28" rx="24" ry="20" fill="#2F4F4F"/><path d="M 20 55 L 28 80 M 48 62 L 57 87 M 75 55 L 84 80" stroke="#000080" stroke-width="3"/><path d="M 28 72 Q 36 65 45 72" stroke="#FFD700" stroke-width="2.5"/><text x="50" y="50" font-size="24" fill="#FFD700" opacity="0.7">⚡</text></svg>',
    96: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="38" cy="25" rx="26" ry="22" fill="#2F4F4F"/><text x="20" y="70" font-size="16" fill="#87CEEB">❄</text><text x="48" y="78" font-size="16" fill="#87CEEB">❄</text><text x="75" y="70" font-size="16" fill="#87CEEB">❄</text><path d="M 30 68 Q 38 62 48 68" stroke="#FFD700" stroke-width="2"/></svg>',
    99: '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><ellipse cx="35" cy="22" rx="28" ry="24" fill="#1a1a2e"/><path d="M 18 52 L 28 82 M 48 60 L 60 88 M 78 52 L 88 82" stroke="#000080" stroke-width="3.5"/><text x="45" y="48" font-size="26" fill="#FFD700">⚡</text><text x="65" y="35" font-size="26" fill="#FFD700">⚡</text></svg>'
  };
  
  return svgs[wmoCode] || svgs[0];
}

function renderWeather(data) {
  if (!weatherDisplay) return;
  
  if (data.error) {
    weatherDisplay.innerHTML = `<div style="color:var(--muted);padding:20px;text-align:center;">${data.error}</div>`;
    return;
  }
  
  const svg = data.wmoCode !== undefined ? getWeatherSVG(data.wmoCode) : '<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><circle cx="50" cy="50" r="35" fill="#FFD700"/></svg>';
  
  weatherDisplay.innerHTML = `
    <div style="padding:15px;text-align:center;">
      <div style="margin-bottom:15px;">${svg}</div>
      <div style="font-size:32px;font-weight:600;color:var(--text);">${data.temp}°C</div>
      <div style="color:var(--text);font-size:14px;font-weight:500;margin:8px 0;">${data.city}</div>
      <div style="color:var(--muted);font-size:12px;margin-bottom:15px;">${data.description.substring(data.description.indexOf(' ') + 1)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px;color:var(--muted);">
        <div><div style="font-weight:600;color:var(--text);">${data.feels}°C</div>Ressenti</div>
        <div><div style="font-weight:600;color:var(--text);">${data.wind} km/h</div>Vent</div>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:12px;">Open-Meteo API (gratuit, sans clé)</div>
    </div>
  `;
}

// Recherche manuelle
if (weatherSearchBtn && postalCodeInput) {
  weatherSearchBtn.addEventListener('click', async () => {
    const query = postalCodeInput.value.trim();
    if (!query) return;
    
    weatherDisplay.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);">Chargement...</div>';
    const data = await fetchWeatherByQuery(query);
    renderWeather(data);
    
    if (!data.error) {
      try { localStorage.setItem('weather-query', query); } catch (e) {}
    }
  });
  
  postalCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') weatherSearchBtn.click();
  });
}

// Détection automatique
if (weatherAutoBtn) {
  weatherAutoBtn.addEventListener('click', async () => {
    weatherDisplay.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);">Détection de votre position...</div>';
    
    const location = await detectLocation();
    if (location) {
      postalCodeInput.value = location.city;
      const data = await fetchWeatherByCoords(location.lat, location.lon);
      renderWeather(data);
      
      if (!data.error) {
        try { localStorage.setItem('weather-query', location.city); } catch (e) {}
      }
    } else {
      weatherDisplay.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;">Impossible de détecter votre position</div>';
    }
  });
}

// Chargement initial
try {
  const savedQuery = localStorage.getItem('weather-query');
  if (savedQuery) {
    postalCodeInput.value = savedQuery;
    fetchWeatherByQuery(savedQuery).then(renderWeather);
  } else {
    // Essayer détection auto au premier lancement
    detectLocation().then(location => {
      if (location) {
        postalCodeInput.value = location.city;
        fetchWeatherByCoords(location.lat, location.lon, location.city).then(renderWeather);
      }
    });
  }
} catch (e) {
  console.warn('Erreur chargement initial météo:', e);
}

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initDraggableCards, 100);
  });
} else {
  setTimeout(initDraggableCards, 100);
}

// --------- Actualités AFP ---------
const newsList = document.getElementById('newsList');
const newsRefresh = document.getElementById('newsRefresh');

// Parse un flux RSS XML directement (VRAIES actualités, AUCUNE clé requise)
async function parseRSSFeed(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    const articles = [];
    
    items.forEach((item, i) => {
      if (i < 6) {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '#';
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
        
        if (title) articles.push({ title, link, pubDate });
      }
    });
    
    return articles;
  } catch (e) {
    console.warn(`Erreur RSS ${url}:`, e);
    return [];
  }
}

// Récupère les VRAIES actualités depuis les flux RSS français
async function fetchFrenchNews() {
  const sources = [
    { url: 'https://www.lemonde.fr/rss/une.xml', name: 'Le Monde' },
    { url: 'https://www.francetvinfo.fr/titres.rss', name: 'France Info' },
    { url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/', name: 'Libération' },
    { url: 'https://www.20minutes.fr/feeds/rss-une.xml', name: '20 Minutes' }
  ];
  
  console.log('🔄 Chargement des actualités RÉELLES depuis RSS...');
  
  for (const source of sources) {
    try {
      const articles = await parseRSSFeed(source.url);
      if (articles.length > 0) {
        console.log(`✅ ${articles.length} actualités RÉELLES de ${source.name}`);
        return articles.map(art => ({
          title: art.title,
          link: art.link,
          pubDate: art.pubDate,
          source: source.name
        }));
      }
    } catch (e) {
      console.warn(`❌ ${source.name} non disponible`);
    }
  }
  
  console.warn('⚠️ Tous les flux RSS ont échoué, mode démo');
  return fetchDemoNews();
}

// Actualités de démonstration (utilisées si pas de clé API)
function fetchDemoNews() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const hour = now.getHours();
  
  const newsPool = {
    politique: [
      'Assemblée nationale : Débat houleux autour de la réforme',
      'Élysée : Le président reçoit les partenaires sociaux',
      'Gouvernement : Annonce de nouvelles mesures sociales',
      'Sénat : Vote crucial prévu cette semaine',
      'Municipales : Première polémique de l\'année'
    ],
    economie: [
      'Bourse de Paris : Le CAC 40 en hausse ce matin',
      'Inflation : Les prix restent sous surveillance',
      'Emploi : Baisse du chômage confirmée en décembre',
      'Entreprises : Plan de relance pour les PME',
      'Consommation : Les Français changent leurs habitudes'
    ],
    societe: [
      'Éducation : Grève annoncée dans plusieurs académies',
      'Santé : Nouvelle campagne de vaccination lancée',
      'Transports : Perturbations prévues en Île-de-France',
      'Justice : Verdict attendu dans une affaire médiatisée',
      'Environnement : Mobilisation citoyenne ce week-end'
    ],
    international: [
      'Union européenne : Sommet crucial à Bruxelles',
      'Relations franco-allemandes : Entretien bilatéral',
      'Crise au Moyen-Orient : La France appelle au dialogue',
      'G7 : Préparatifs du prochain sommet',
      'ONU : La France défend sa position sur le climat'
    ],
    meteo: [
      'Météo : Temps hivernal sur la moitié nord',
      'Vigilance orange : Pluies intenses attendues',
      'Températures : Douceur inhabituelle pour la saison',
      'Neige : Plusieurs départements en alerte',
      'Canicule : Record de chaleur pour un mois de janvier'
    ],
    sport: [
      'Équipe de France : Préparation du prochain match',
      'Ligue 1 : Le PSG cartonne, l\'OM résiste',
      'Tennis : Un Français en finale à Melbourne',
      'Rugby : Tournoi des Six Nations approche',
      'JO 2026 : La délégation française en préparation'
    ]
  };
  
  const sources = [
    'France Info', 'Le Monde', 'AFP', 'Libération', 
    'France 24', 'Le Figaro', 'L\'Équipe', 'BFM TV'
  ];
  
  const categories = Object.keys(newsPool);
  const selected = [];
  
  for (let i = 0; i < 6; i++) {
    const catIndex = (day + i + month + hour) % categories.length;
    const category = categories[catIndex];
    const newsIndex = (day * 7 + i + hour) % newsPool[category].length;
    const sourceIndex = (day + i * 3 + month) % sources.length;
    
    selected.push({
      title: newsPool[category][newsIndex],
      link: '#',
      pubDate: new Date(now.getTime() - i * 1800000).toISOString(),
      source: sources[sourceIndex]
    });
  }
  
  return Promise.resolve(selected);
}

async function renderNews() {
  if (!newsList) return;
  newsList.innerHTML = '<div class="empty-news">Chargement des actualités...</div>';
  
  try {
    const news = await fetchFrenchNews();
    newsList.innerHTML = '';
    
    if (!news.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-news';
      empty.textContent = 'Aucune actualité disponible.';
      newsList.appendChild(empty);
      return;
    }
    
    for (const item of news) {
      const row = document.createElement('div');
      row.className = 'news-item';
      
      const title = document.createElement('div');
      title.className = 'news-title';
      title.textContent = item.title;
      
      const pubDate = new Date(item.pubDate);
      const timeEl = document.createElement('div');
      timeEl.className = 'news-time';
      const timeStr = pubDate.toLocaleString('fr-FR', { 
        day: '2-digit',
        month: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
      timeEl.textContent = `${item.source} • ${timeStr}`;
      
      row.appendChild(title);
      row.appendChild(timeEl);
      
      // Clic pour ouvrir
      row.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.link && item.link !== '#') {
          window.open(item.link, '_blank');
        } else {
          console.log('Article sans lien externe:', item.title);
        }
      };
      
      newsList.appendChild(row);
    }
  } catch (e) {
    newsList.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-news';
    empty.textContent = 'Erreur de chargement.';
    newsList.appendChild(empty);
    console.error('Erreur rendu actualités:', e);
  }
}

if (newsRefresh) {
  newsRefresh.addEventListener('click', () => renderNews());
}

// Défilement automatique des actualités
function startNewsAutoScroll() {
  const container = document.querySelector('.fr-news');
  if (!container) return;
  
  const list = newsList;
  if (!list) return;
  
  // Vérifier si le contenu dépasse la hauteur
  const needsScroll = list.scrollHeight > container.clientHeight;
  
  if (needsScroll) {
    list.classList.add('scrolling');
    
    // Recommencer l'animation à la fin
    list.addEventListener('animationiteration', () => {
      list.style.animation = 'none';
      setTimeout(() => {
        list.style.animation = '';
      }, 50);
    });
  } else {
    list.classList.remove('scrolling');
  }
}

// Permettre le scroll manuel (arrête l'animation si l'utilisateur scroll)
if (newsList) {
  newsList.addEventListener('wheel', (e) => {
    newsList.classList.remove('scrolling');
  }, { passive: true });
  
  newsList.addEventListener('scroll', () => {
    // Optionnel : peut réactiver l'animation après 3 secondes d'inactivité
  }, { passive: true });
}

renderNews().then(() => {
  setTimeout(startNewsAutoScroll, 1000);
}); // Charger les actualités au démarrage

// --------- À VENIR (liste latérale) ---------
function getUpcomingEvents(limit = 10) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const items = [];
  for (const key of Object.keys(events)) {
    try {
      const [y,m,d] = key.split('-').map(Number);
      const dt = new Date(y, m-1, d);
      dt.setHours(0,0,0,0);
      if (dt >= today && Array.isArray(events[key]) && events[key].length) {
        items.push({ date: dt, key, title: events[key][0] });
      }
    } catch {}
  }
  items.sort((a,b) => a.date - b.date);
  return items.slice(0, limit);
}

function renderUpcoming() {
  if (!upcomingList) return;
  const upcoming = getUpcomingEvents(12);
  upcomingList.innerHTML = '';
  if (!upcoming.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-upcoming';
    empty.textContent = 'Aucun événement à venir.';
    upcomingList.appendChild(empty);
    return;
  }
  const locale = 'fr-FR';
  for (const item of upcoming) {
    const row = document.createElement('div');
    row.className = 'upcoming-item';

    const date = document.createElement('div');
    date.className = 'upcoming-date';
    const dd = item.date.toLocaleDateString(locale, { day: '2-digit' });
    const mm = item.date.toLocaleDateString(locale, { month: 'short' });
    date.textContent = `${dd} ${mm}`;

    const title = document.createElement('div');
    title.className = 'upcoming-title';
    title.textContent = item.title;

    row.appendChild(date);
    row.appendChild(title);

    // Cliquer sur l'item permet d'éditer la date correspondante
    row.addEventListener('click', () => editEvent(item.key));

    upcomingList.appendChild(row);
  }
}
