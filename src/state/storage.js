// LocalStorage-backed store for ConnectStore.
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
//   theme: { keyColor: '#1a2f66' },
//   appName: { [locale]: { main, accent } },
//   posters: [{
//     id, device, locale, copy: { eyebrow, headline, body },
//     screenshot: { dataUrl, name } | null
//   }]
// }

const KEY = 'connectstore.v1';

const EMPTY = {
  version: 1,
  uiLang: 'zh',
  currentProjectId: null,
  projects: {},
};

let cache = null;
const listeners = new Set();

function read() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (err) {
    console.error('[connectstore] failed to persist:', err);
  }
  for (const fn of listeners) fn(next);
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
