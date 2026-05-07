import { useState } from 'react';
import { useStore } from '../state/useStore';
import {
  createProject,
  deleteProject,
  setCurrentProject,
  setUiLang,
} from '../state/storage';
import { t, UI_LANGS } from '../i18n';

export default function Sidebar() {
  const s = useStore();
  const [showNew, setShowNew] = useState(false);

  // Sort by createdAt to keep ordering stable while users type into project name.
  const projects = Object.values(s.projects).sort((a, b) => a.createdAt - b.createdAt);
  const lang = s.uiLang;

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
              <span
                className="swatch"
                style={{
                  background:
                    p.theme?.accentColor || p.theme?.keyColor || '#1a2f66',
                }}
              />
              <span className="name">{p.name || '—'}</span>
              <button
                className="del"
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
