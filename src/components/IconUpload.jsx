import { useRef, useState } from 'react';
import { mutateProject } from '../state/storage';
import { t } from '../i18n';

// Project-level App Store icon uploader.
// Stores { dataUrl, name } on project.icon. Accepts click-to-upload AND
// drag-and-drop. Recommended size: 1024×1024 (App Store Connect spec).
export default function IconUpload({ project, lang }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const ingest = (f) => {
    if (!f || !f.type?.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      mutateProject(project.id, (p) => {
        p.icon = { dataUrl: String(reader.result), name: f.name };
      });
    };
    reader.readAsDataURL(f);
  };

  const onFile = (e) => {
    ingest(e.target.files?.[0]);
    e.target.value = '';
  };

  const onDragOver = (e) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  };
  const onDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    ingest(e.dataTransfer?.files?.[0]);
  };

  const remove = () => {
    mutateProject(project.id, (p) => {
      p.icon = null;
    });
  };

  return (
    <div className="icon-upload">
      <div
        className={'icon-slot' + (dragOver ? ' drag-over' : '')}
        onClick={() => fileRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={onFile}
        />
        {project.icon?.dataUrl ? (
          <img src={project.icon.dataUrl} alt="App icon" />
        ) : (
          <div className="ph">
            <div className="big">+</div>
            <div className="hint">1024 × 1024</div>
          </div>
        )}
      </div>
      <div className="icon-info">
        <div className="lab">{t(lang, 'meta.appIcon')}</div>
        <div className="hint">{t(lang, 'meta.appIconHint')}</div>
        <div className="actions">
          <button onClick={() => fileRef.current?.click()}>
            {project.icon ? t(lang, 'meta.replace') : t(lang, 'meta.upload')}
          </button>
          {project.icon && (
            <button className="ghost" onClick={remove}>
              {t(lang, 'meta.remove')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
