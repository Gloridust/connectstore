import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/useStore';
import {
  createProject,
  deleteProject,
  duplicateProjectById,
  setCurrentProject,
  setUiLang,
  serializeState,
  importState,
} from '../state/storage';
import { storageEstimate } from '../state/idb';
import { t, UI_LANGS } from '../i18n';

function formatBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

function downloadText(text, filename, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Sidebar() {
  const s = useStore();
  const [showNew, setShowNew] = useState(false);
  const restoreRef = useRef(null);

  // Sort by createdAt to keep ordering stable while users type into project name.
  const projects = Object.values(s.projects).sort((a, b) => a.createdAt - b.createdAt);
  const lang = s.uiLang;

  // Refresh the storage estimate when the data structurally changes (a project
  // or poster added/removed), not on every keystroke.
  const [usage, setUsage] = useState(null);
  const sizeSignal = useMemo(
    () =>
      Object.values(s.projects).reduce(
        (n, p) => n + 1 + (p.posters?.length || 0) + (p.icon ? 1 : 0),
        0,
      ),
    [s.projects],
  );
  useEffect(() => {
    let alive = true;
    storageEstimate().then((est) => {
      if (alive && est) setUsage(est);
    });
    return () => {
      alive = false;
    };
  }, [sizeSignal]);

  const onBackup = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(serializeState(), `connectstore-backup-${stamp}.json`);
  };

  const onRestoreFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importState(String(reader.result), 'merge');
      if (!res.ok) alert(t(lang, 'sidebar.restoreFail'));
    };
    reader.readAsText(f);
  };

  return (
    <aside className="sidebar">
      <header>
        <div className="brand">
          ConnectStore
        </div>
        <div className="tag">{t(lang, 'app.subtitle')}</div>
      </header>

      <div className="section-head">
        <span>{t(lang, 'sidebar.projects')}</span>
        <button className="add-btn" onClick={() => setShowNew(true)}>
          + {t(lang, 'sidebar.newProject')}
        </button>
      </div>

      <div className="project-list">
        {projects.length === 0 ? (
          <div className="empty">{t(lang, 'sidebar.empty')}</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className={'project-row' + (p.id === s.currentProjectId ? ' active' : '')}
              onClick={() => setCurrentProject(p.id)}
            >
              {p.icon?.dataUrl ? (
                <img
                  className="swatch swatch-img"
                  src={p.icon.dataUrl}
                  alt=""
                />
              ) : (
                <span
                  className="swatch"
                  style={{
                    background:
                      p.theme?.accentColor || p.theme?.keyColor || '#1a2f66',
                  }}
                />
              )}
              <span className="name">{p.name || '—'}</span>
              <button
                className="row-act"
                title={t(lang, 'sidebar.duplicate')}
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateProjectById(p.id);
                }}
              >
                ⧉
              </button>
              <button
                className="row-act del"
                title={t(lang, 'sidebar.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(t(lang, 'sidebar.deleteConfirm', { name: p.name }))
                  ) {
                    deleteProject(p.id);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {usage && (
        <div className="sidebar-usage" title={t(lang, 'sidebar.storage')}>
          <span>{formatBytes(usage.usage)}</span>
          {usage.quota ? (
            <div className="bar">
              <span
                style={{
                  width:
                    Math.min(100, (usage.usage / usage.quota) * 100).toFixed(1) + '%',
                }}
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="sidebar-tools">
        <button onClick={onBackup} title={t(lang, 'sidebar.backupTitle')}>
          ↓ {t(lang, 'sidebar.backup')}
        </button>
        <button
          onClick={() => restoreRef.current?.click()}
          title={t(lang, 'sidebar.restoreTitle')}
        >
          ↑ {t(lang, 'sidebar.restore')}
        </button>
        <input
          ref={restoreRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={onRestoreFile}
        />
      </div>

      <footer>
        <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
          {t(lang, 'common.lang')}
        </span>
        <div className="lang-seg">
          {UI_LANGS.map((u) => (
            <button
              key={u.code}
              className={lang === u.code ? 'on' : ''}
              onClick={() => setUiLang(u.code)}
            >
              {u.label}
            </button>
          ))}
        </div>
      </footer>

      {showNew && (
        <NewProjectModal lang={lang} onClose={() => setShowNew(false)} />
      )}
    </aside>
  );
}

function NewProjectModal({ lang, onClose }) {
  const [name, setName] = useState('');
  const submit = () => {
    const v = name.trim();
    if (!v) return;
    createProject(v);
    onClose();
  };
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t(lang, 'sidebar.newProject')}</h3>
        <label>{t(lang, 'sidebar.createPrompt')}</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <div className="row">
          <button onClick={onClose}>{t(lang, 'common.cancel')}</button>
          <button className="primary" onClick={submit}>
            {t(lang, 'common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
