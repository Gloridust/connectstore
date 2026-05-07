import { useEffect, useMemo, useState } from 'react';
import { mutateProject } from '../state/storage';
import { t } from '../i18n';
import { DEFAULT_FIELDS, COMMON_LOCALES, FIELD_TYPES, localeLabel } from '../utils/fields';
import IconUpload from './IconUpload';

export default function MetadataTab({ project, lang }) {
  const [showAddField, setShowAddField] = useState(false);
  const [showAddLocale, setShowAddLocale] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const hidden = project.hiddenDefaults || [];
  const fields = useMemo(
    () => mergeFields(project.fields || [], hidden),
    [project.fields, hidden],
  );
  const hiddenFields = DEFAULT_FIELDS.filter((f) => hidden.includes(f.id));

  const setValue = (fieldId, locale, val) => {
    mutateProject(project.id, (p) => {
      if (!p.values[fieldId]) p.values[fieldId] = {};
      p.values[fieldId][locale] = val;
    });
  };

  const removeLocale = (code) => {
    mutateProject(project.id, (p) => {
      p.locales = p.locales.filter((c) => c !== code);
    });
  };

  const removeCustomField = (fid) => {
    mutateProject(project.id, (p) => {
      p.fields = (p.fields || []).filter((f) => f.id !== fid);
      delete p.values[fid];
    });
  };

  const hideDefaultField = (fid) => {
    mutateProject(project.id, (p) => {
      const cur = p.hiddenDefaults || [];
      if (!cur.includes(fid)) p.hiddenDefaults = [...cur, fid];
    });
  };

  const restoreDefaultField = (fid) => {
    mutateProject(project.id, (p) => {
      p.hiddenDefaults = (p.hiddenDefaults || []).filter((x) => x !== fid);
    });
  };

  const exportJson = () => {
    const out = {
      project: project.name,
      locales: project.locales,
      fields: fields.map((f) => ({
        id: f.id,
        type: f.type,
        max: f.max,
        label: typeof f.labelKey === 'string' ? t(lang, f.labelKey) : f.label?.[lang] || f.label?.en || f.id,
      })),
      values: project.values,
    };
    const json = JSON.stringify(out, null, 2);
    setCopied(true);
    copyToClipboard(json);
  };

  return (
    <div className="meta">
      <div className="meta-head">
        <h2>{t(lang, 'tab.metadata')}</h2>
        <div className="grow" />
        <button onClick={exportJson}>
          {copied ? t(lang, 'meta.copied') : t(lang, 'meta.exportJson')}
        </button>
        <button onClick={() => setShowAddField(true)}>
          + {t(lang, 'meta.addCustomField')}
        </button>
      </div>

      <IconUpload project={project} lang={lang} />

      <div className="locale-bar">
        <span className="lab">{t(lang, 'meta.locales')}:</span>
        {project.locales.map((c) => (
          <span key={c} className="locale-pill">
            {localeLabel(c)}
            {project.locales.length > 1 && (
              <button onClick={() => removeLocale(c)} title="×">×</button>
            )}
          </span>
        ))}
        <button
          className="locale-pill"
          style={{ background: '#fff', cursor: 'pointer' }}
          onClick={() => setShowAddLocale(true)}
        >
          + {t(lang, 'meta.addLocale')}
        </button>
      </div>

      {fields.map((f) => (
        <div className="field-card" key={f.id}>
          <div className="field-head">
            <div>
              <div className="field-label">
                {f.custom ? f.label?.[lang] || f.label?.en || f.id : t(lang, f.labelKey)}
              </div>
              <div className="field-id">{f.id} · {f.type}{f.max ? ` · max ${f.max}` : ''}</div>
            </div>
            <div className="field-grow" />
            <button
              className="icon-btn"
              onClick={() => {
                if (f.custom) {
                  if (confirm(t(lang, 'meta.confirmDeleteField', { id: f.id }))) {
                    removeCustomField(f.id);
                  }
                } else {
                  hideDefaultField(f.id);
                }
              }}
              title={t(lang, f.custom ? 'meta.delete' : 'meta.hide')}
            >
              {f.custom ? t(lang, 'meta.delete') : t(lang, 'meta.hide')}
            </button>
          </div>
          <div className="field-rows">
            {project.locales.map((locale) => (
              <FieldInput
                key={locale}
                field={f}
                locale={locale}
                value={project.values?.[f.id]?.[locale] || ''}
                onChange={(v) => setValue(f.id, locale, v)}
                lang={lang}
              />
            ))}
          </div>
        </div>
      ))}

      {hiddenFields.length > 0 && (
        <div className="hidden-fields">
          <span className="lab">{t(lang, 'meta.hiddenFields')}:</span>
          {hiddenFields.map((f) => (
            <button key={f.id} onClick={() => restoreDefaultField(f.id)}>
              + {t(lang, f.labelKey)}
            </button>
          ))}
        </div>
      )}

      {showAddField && (
        <AddFieldModal
          lang={lang}
          onClose={() => setShowAddField(false)}
          onAdd={(field) => {
            mutateProject(project.id, (p) => {
              p.fields = [...(p.fields || []), field];
            });
            setShowAddField(false);
          }}
          existingIds={fields.map((f) => f.id)}
        />
      )}
      {showAddLocale && (
        <AddLocaleModal
          lang={lang}
          existing={project.locales}
          onClose={() => setShowAddLocale(false)}
          onAdd={(code) => {
            mutateProject(project.id, (p) => {
              if (!p.locales.includes(code)) p.locales.push(code);
            });
            setShowAddLocale(false);
          }}
        />
      )}
    </div>
  );
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Merge default fields with project's custom fields, preserving custom ones at the end.
// Hidden default ids are filtered out.
function mergeFields(custom, hidden = []) {
  const customIds = new Set(custom.map((f) => f.id));
  const hiddenSet = new Set(hidden);
  const base = DEFAULT_FIELDS.filter((f) => !customIds.has(f.id) && !hiddenSet.has(f.id));
  return [...base, ...custom.map((c) => ({ ...c, custom: true }))];
}

function FieldInput({ field, locale, value, onChange, lang }) {
  const isLong = field.type === 'textarea';
  const isUrl = field.type === 'url';
  const max = field.max;
  const over = max && value.length > max;

  return (
    <>
      <div className="lc">{localeLabel(locale)}</div>
      <div className="vc">
        {isLong ? (
          <textarea
            value={value}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type={isUrl ? 'url' : 'text'}
            value={value}
            placeholder={isUrl ? 'https://…' : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {max ? (
          <span className={'count' + (over ? ' over' : '')}>
            {t(lang, 'meta.charCount', { n: value.length, max })}
          </span>
        ) : null}
      </div>
    </>
  );
}

function AddFieldModal({ lang, onClose, onAdd, existingIds }) {
  const [id, setId] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [labelZh, setLabelZh] = useState('');
  const [type, setType] = useState('text');
  const [max, setMax] = useState('');

  const submit = () => {
    const cleanId = id.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    if (!cleanId) return alert('Field ID is required');
    if (existingIds.includes(cleanId)) return alert('Field ID already exists');
    onAdd({
      id: cleanId,
      label: { en: labelEn || cleanId, zh: labelZh || labelEn || cleanId },
      type,
      max: max ? Number(max) : undefined,
      custom: true,
    });
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t(lang, 'meta.addCustomField')}</h3>
        <label>{t(lang, 'meta.fieldId')}</label>
        <input type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder="myField" autoFocus />
        <label>{t(lang, 'meta.fieldLabel')} (中)</label>
        <input type="text" value={labelZh} onChange={(e) => setLabelZh(e.target.value)} />
        <label>{t(lang, 'meta.fieldLabel')} (EN)</label>
        <input type="text" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} />
        <label>{t(lang, 'meta.fieldType')}</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {FIELD_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <label>Max length (optional)</label>
        <input type="text" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ''))} />
        <div className="row">
          <button onClick={onClose}>{t(lang, 'common.cancel')}</button>
          <button className="primary" onClick={submit}>{t(lang, 'common.add')}</button>
        </div>
      </div>
    </div>
  );
}

function AddLocaleModal({ lang, existing, onClose, onAdd }) {
  const remaining = COMMON_LOCALES.filter((l) => !existing.includes(l.code));
  const [code, setCode] = useState(remaining[0]?.code || '');
  const [custom, setCustom] = useState('');
  const submit = () => {
    const c = (custom.trim() || code).trim();
    if (!c) return;
    if (existing.includes(c)) return alert('Already added');
    onAdd(c);
  };
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t(lang, 'meta.addLocale')}</h3>
        <label>Locale</label>
        <select value={code} onChange={(e) => setCode(e.target.value)}>
          {remaining.map((l) => (
            <option key={l.code} value={l.code}>
              {l.code} — {l.label}
            </option>
          ))}
        </select>
        <label>Custom locale code (optional)</label>
        <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. fr-CA" />
        <div className="row">
          <button onClick={onClose}>{t(lang, 'common.cancel')}</button>
          <button className="primary" onClick={submit}>{t(lang, 'common.add')}</button>
        </div>
      </div>
    </div>
  );
}
