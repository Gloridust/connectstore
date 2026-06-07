import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MetadataTab from './components/MetadataTab';
import ScreenshotsTab from './components/ScreenshotsTab';
import { useStore, useCurrentProject } from './state/useStore';
import { renameProject, createProject, createSampleProject } from './state/storage';
import { t } from './i18n';

export default function App() {
  const s = useStore();
  const project = useCurrentProject();
  const lang = s.uiLang;
  const [tab, setTab] = useState('screenshots');
  const [showNew, setShowNew] = useState(false);

  // Wait for IndexedDB to hydrate before first paint so we don't flash an
  // empty "no projects" state over data that is about to load.
  if (!s._hydrated) {
    return (
      <div className="boot">
        <div className="boot-mark">ConnectStore</div>
        <div className="boot-spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        {project ? (
          <>
            <div className="main-toolbar">
              <input
                className="project-name-input"
                value={project.name}
                onChange={(e) => renameProject(project.id, e.target.value)}
              />
              <div className="grow" />
              <div className="seg">
                <button
                  className={tab === 'screenshots' ? 'on' : ''}
                  onClick={() => setTab('screenshots')}
                >
                  {t(lang, 'tab.screenshots')}
                </button>
                <button
                  className={tab === 'metadata' ? 'on' : ''}
                  onClick={() => setTab('metadata')}
                >
                  {t(lang, 'tab.metadata')}
                </button>
              </div>
            </div>
            <div className="main-content">
              {tab === 'metadata' ? (
                <MetadataTab project={project} lang={lang} />
              ) : (
                <ScreenshotsTab project={project} lang={lang} />
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-mark">📱</div>
            <h2>{t(lang, 'app.title')}</h2>
            <p>{t(lang, 'app.subtitle')}</p>
            <p style={{ opacity: 0.8 }}>{t(lang, 'sidebar.empty')}</p>
            <div className="empty-actions">
              <button className="primary" onClick={() => setShowNew(true)}>
                + {t(lang, 'sidebar.newProject')}
              </button>
              <button className="ghost" onClick={() => createSampleProject()}>
                {t(lang, 'sidebar.loadSample')}
              </button>
            </div>
          </div>
        )}
      </main>
      {showNew && (
        <NewProjectModal
          lang={lang}
          onClose={() => setShowNew(false)}
          onCreate={(name) => {
            createProject(name);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function NewProjectModal({ lang, onClose, onCreate }) {
  const [name, setName] = useState('');
  const submit = () => {
    const v = name.trim();
    if (!v) return;
    onCreate(v);
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
