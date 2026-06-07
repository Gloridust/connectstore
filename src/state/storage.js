// Store for ConnectStore.
//
// Source of truth is a synchronous in-memory tree (so React + tests stay
// simple). Persistence is IndexedDB — its quota is typically hundreds of MB
// to GBs, vs localStorage's ~5–10 MB, which matters because screenshots and
// app icons are stored inline as base64. When IndexedDB is unavailable
// (old browsers, jsdom in tests) we transparently fall back to localStorage.
//
// Schema:
// {
//   version: 1,
//   uiLang: 'zh' | 'en',
//   currentProjectId: string | null,
//   projects: Record<id, Project>
// }
//
// Project shape:
// {
//   id, name, createdAt, updatedAt,
//   locales: ['en-US', 'zh-Hans', ...],
//   fields: [{ id, label: { [lang]: string }, type, max?, custom?: bool }],
//   values: { [fieldId]: { [locale]: string } },
//   icon: { dataUrl, name } | null,
//   theme: { bgColor, accentColor },
//   appName: { [locale]: { main, accent } },
//   posters: [{ id, device, locale, copy, screenshot, layout }]
// }

import { hasIndexedDB, idbGet, idbSet } from './idb';

const KEY = 'connectstore.v1';
const IDB_KEY = 'state';

const EMPTY = {
  version: 1,
  uiLang: 'zh',
  currentProjectId: null,
  projects: {},
};

let cache = null;
let hydrated = false;
const listeners = new Set();

// `_hydrated` rides along on the snapshot so the UI can show a boot splash
// until IndexedDB has loaded, but it is stripped before persisting.
function withMeta(state) {
  return { ...state, _hydrated: hydrated };
}

function persistShape(state) {
  const clone = JSON.parse(JSON.stringify(state));
  delete clone._hydrated;
  return clone;
}

function read() {
  if (cache) return cache;
  if (hasIndexedDB) {
    // Real persistence arrives asynchronously via hydrate(); until then the
    // UI renders a splash gated on `_hydrated`.
    cache = withMeta({ ...EMPTY });
  } else {
    // Synchronous localStorage fallback (also the path used by unit tests).
    try {
      const raw = localStorage.getItem(KEY);
      cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
    } catch {
      cache = { ...EMPTY };
    }
    hydrated = true;
    cache._hydrated = true;
  }
  return cache;
}

let persistTimer = null;

function schedulePersist() {
  if (!hasIndexedDB) {
    try {
      localStorage.setItem(KEY, JSON.stringify(persistShape(cache)));
    } catch (err) {
      console.error('[connectstore] localStorage persist failed:', err);
    }
    return;
  }
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flush, 250);
}

export async function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!hasIndexedDB || !cache) return;
  try {
    await idbSet(IDB_KEY, persistShape(cache));
  } catch (err) {
    console.error('[connectstore] IndexedDB persist failed:', err);
  }
}

function notify() {
  for (const fn of listeners) fn(cache);
}

function write(next) {
  cache = withMeta(next);
  schedulePersist();
  notify();
}

// Load persisted state from IndexedDB, migrating any legacy localStorage data
// on first run. Safe to call once at module load.
export async function hydrate() {
  if (!hasIndexedDB) {
    read();
    return;
  }
  let stored = null;
  try {
    stored = await idbGet(IDB_KEY);
    if (!stored) {
      // One-time migration from the old localStorage-backed store.
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          stored = JSON.parse(raw);
          await idbSet(IDB_KEY, persistShape(stored));
          localStorage.removeItem(KEY);
          console.info('[connectstore] migrated localStorage data to IndexedDB');
        }
      } catch (err) {
        console.error('[connectstore] migration failed:', err);
      }
    }
  } catch (err) {
    console.error('[connectstore] IndexedDB hydrate failed:', err);
  }
  hydrated = true;
  cache = withMeta({ ...EMPTY, ...(stored || {}) });
  notify();
}

export function isHydrated() {
  return hydrated;
}

export function getState() {
  return read();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(mutator) {
  const prev = read();
  const draft = JSON.parse(JSON.stringify(prev));
  delete draft._hydrated;
  const out = mutator(draft);
  write(out || draft);
}

export function uid(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

// ---- Project helpers ----

export function defaultProject(name) {
  const now = Date.now();
  return {
    id: uid('p'),
    name,
    createdAt: now,
    updatedAt: now,
    locales: ['en-US', 'zh-Hans'],
    fields: [], // default fields are merged in at read time via fields.js
    values: {},
    icon: null, // { dataUrl, name } | null — App Store Connect 1024x1024 icon
    theme: { bgColor: '#f4ecd8', accentColor: '#1a2f66' },
    appName: {
      'en-US': { main: name, accent: '' },
      'zh-Hans': { main: name, accent: '' },
    },
    posters: [],
  };
}

export function setUiLang(lang) {
  update((s) => {
    s.uiLang = lang;
  });
}

export function setCurrentProject(id) {
  update((s) => {
    s.currentProjectId = id;
  });
}

export function createProject(name) {
  const p = defaultProject(name);
  update((s) => {
    s.projects[p.id] = p;
    s.currentProjectId = p.id;
  });
  return p.id;
}

export function deleteProject(id) {
  update((s) => {
    delete s.projects[id];
    if (s.currentProjectId === id) {
      const remaining = Object.keys(s.projects);
      s.currentProjectId = remaining[0] || null;
    }
  });
}

export function renameProject(id, name) {
  update((s) => {
    const p = s.projects[id];
    if (!p) return;
    p.name = name;
    p.updatedAt = Date.now();
  });
}

export function patchProject(id, patch) {
  update((s) => {
    const p = s.projects[id];
    if (!p) return;
    Object.assign(p, patch);
    p.updatedAt = Date.now();
  });
}

export function mutateProject(id, mutator) {
  update((s) => {
    const p = s.projects[id];
    if (!p) return;
    mutator(p);
    p.updatedAt = Date.now();
  });
}

export function duplicateProjectById(id) {
  let newId = null;
  update((s) => {
    const src = s.projects[id];
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid('p');
    copy.name = src.name + ' copy';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    s.projects[copy.id] = copy;
    s.currentProjectId = copy.id;
    newId = copy.id;
  });
  return newId;
}

// ---- Backup / restore (whole-store JSON) ----

export function serializeState() {
  return JSON.stringify(persistShape(read()), null, 2);
}

// Import a previously exported state. mode 'replace' overwrites everything;
// mode 'merge' keeps existing projects and adds imported ones (new ids on clash).
export function importState(json, mode = 'merge') {
  let parsed;
  try {
    parsed = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    return { ok: false, error: 'invalid-json' };
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.projects) {
    return { ok: false, error: 'not-a-connectstore-backup' };
  }
  update((s) => {
    if (mode === 'replace') {
      s.projects = {};
    }
    let last = null;
    for (const key of Object.keys(parsed.projects)) {
      const proj = parsed.projects[key];
      if (!proj || typeof proj !== 'object') continue;
      let pid = proj.id || key;
      if (s.projects[pid]) pid = uid('p'); // avoid clobbering on merge
      s.projects[pid] = { ...proj, id: pid };
      last = pid;
    }
    if (mode === 'replace' && parsed.uiLang) s.uiLang = parsed.uiLang;
    s.currentProjectId = (mode === 'replace' && parsed.currentProjectId) || last || s.currentProjectId;
  });
  return { ok: true };
}

// ---- Sample project for first-run onboarding ----

export function createSampleProject() {
  const now = Date.now();
  const mk = (n, copy, layout) => ({
    id: uid('shot'),
    device: 'iphone-6.9',
    locale: 'en-US',
    copy,
    screenshot: null,
    layout,
  });
  const p = {
    id: uid('p'),
    name: 'Sample — Read Later',
    createdAt: now,
    updatedAt: now,
    locales: ['en-US', 'zh-Hans'],
    fields: [],
    values: {
      name: { 'en-US': 'Read Later', 'zh-Hans': '稍后读' },
      subtitle: { 'en-US': 'Save what is worth reading', 'zh-Hans': '收藏值得读的文章' },
      promotionalText: {
        'en-US': 'Paste any link, keep only the parts that earn your time.',
        'zh-Hans': '粘贴任意网页，留下值得读的部分。',
      },
      keywords: { 'en-US': 'read later,reader,bookmarks,offline,articles', 'zh-Hans': '稍后读,阅读器,收藏,离线' },
    },
    icon: null,
    theme: { bgColor: '#f4ecd8', accentColor: '#1a2f66' },
    appName: {
      'en-US': { main: 'Read', accent: 'Later' },
      'zh-Hans': { main: '稍后', accent: '读' },
    },
    posters: [
      mk(
        1,
        { eyebrow: 'Read it later. Beautifully.', headline: 'Save what is <em>worth</em> reading.', body: 'Paste any link. Keep only the parts that earn your time.' },
        { textPos: 'top', bgStyle: 'gradient', deviceScale: 1, rotation: 0 },
      ),
      mk(
        2,
        { eyebrow: 'One tap from Safari', headline: 'Catch <em>articles</em>, not tabs.', body: 'Links that will never go missing — tucked into your shelf.' },
        { textPos: 'top', bgStyle: 'gradient', deviceScale: 0.96, rotation: -4 },
      ),
      mk(
        3,
        { eyebrow: 'Built for long reads', headline: 'Made <em>to be read</em>.', body: 'Serif type, paper-warm tones, your sizing — finally finished.' },
        { textPos: 'bottom', bgStyle: 'radial', deviceScale: 1, rotation: 0 },
      ),
    ],
  };
  update((s) => {
    s.projects[p.id] = p;
    s.currentProjectId = p.id;
  });
  return p.id;
}

// ---- Boot ----
// Hydrate from IndexedDB once at startup, and flush pending (debounced) writes
// before the page goes away so the last edits aren't lost.
if (hasIndexedDB) {
  hydrate();
  if (typeof window !== 'undefined') {
    const onLeave = () => flush();
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onLeave();
    });
  }
}
