import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { mutateProject } from '../state/storage';
import { t } from '../i18n';
import { buildPalette, paletteToCssVars } from '../utils/colors';
import { DEVICE_LIST, getDevice } from '../utils/devices';
import { localeLabel } from '../utils/fields';
import { uid } from '../state/storage';
import Poster from './Poster';

const ACCENT_PRESETS = [
  '#1a2f66', // ink blue
  '#2d5e3e', // forest
  '#7a3a3a', // brick
  '#c2640f', // amber
  '#5a3a7a', // plum
  '#1f4d4a', // teal
  '#000000', // mono
];

const BG_PRESETS = [
  '#f4ecd8', // cream (default)
  '#f6f1e8', // warm paper
  '#eef2ec', // sage mist
  '#ecf0f5', // ice blue
  '#f5e8e2', // peach
  '#efe9f3', // lavender mist
  '#fffaf0', // bright ivory
];

// Accept the legacy single-color theme as the accent color, fall back to
// defaults otherwise. Returns { bgColor, accentColor }.
function resolveTheme(t) {
  const accent = t?.accentColor || t?.keyColor || '#1a2f66';
  const bg = t?.bgColor || '#f4ecd8';
  return { bgColor: bg, accentColor: accent };
}

export default function ScreenshotsTab({ project, lang }) {
  const theme = resolveTheme(project.theme);

  const palette = useMemo(
    () => buildPalette(theme.bgColor, theme.accentColor),
    [theme.bgColor, theme.accentColor],
  );

  const setBgColor = (hex) => {
    mutateProject(project.id, (p) => {
      p.theme = { ...(p.theme || {}), bgColor: hex };
      // drop legacy keyColor so future reads use bgColor/accentColor only
      if (p.theme.keyColor && !p.theme.accentColor) {
        p.theme.accentColor = p.theme.keyColor;
      }
      delete p.theme.keyColor;
    });
  };
  const setAccentColor = (hex) => {
    mutateProject(project.id, (p) => {
      p.theme = { ...(p.theme || {}), accentColor: hex };
      if (!p.theme.bgColor) p.theme.bgColor = '#f4ecd8';
      delete p.theme.keyColor;
    });
  };

  const setAppName = (locale, key, val) => {
    mutateProject(project.id, (p) => {
      if (!p.appName) p.appName = {};
      if (!p.appName[locale]) p.appName[locale] = { main: '', accent: '' };
      p.appName[locale][key] = val;
    });
  };

  const addPoster = () => {
    mutateProject(project.id, (p) => {
      const locale = p.locales[0] || 'en-US';
      p.posters = [
        ...(p.posters || []),
        {
          id: uid('shot'),
          device: 'iphone-6.9',
          locale,
          copy: { eyebrow: '', headline: '', body: '' },
          screenshot: null,
        },
      ];
    });
  };

  const updatePoster = (sid, patch) => {
    mutateProject(project.id, (p) => {
      const i = p.posters.findIndex((x) => x.id === sid);
      if (i < 0) return;
      p.posters[i] = { ...p.posters[i], ...patch };
    });
  };

  const updatePosterCopy = (sid, key, val) => {
    mutateProject(project.id, (p) => {
      const i = p.posters.findIndex((x) => x.id === sid);
      if (i < 0) return;
      p.posters[i] = { ...p.posters[i], copy: { ...p.posters[i].copy, [key]: val } };
    });
  };

  const removePoster = (sid) => {
    mutateProject(project.id, (p) => {
      p.posters = p.posters.filter((x) => x.id !== sid);
    });
  };

  const duplicatePoster = (sid) => {
    mutateProject(project.id, (p) => {
      const i = p.posters.findIndex((x) => x.id === sid);
      if (i < 0) return;
      const clone = { ...p.posters[i], id: uid('shot') };
      p.posters.splice(i + 1, 0, clone);
    });
  };

  const exportOne = async (sid) => {
    await renderAndExport(sid, project, palette);
  };

  const exportAll = async () => {
    if (!project.posters?.length) return;
    const zip = new JSZip();
    for (const p of project.posters) {
      const blob = await renderToBlob(p.id, project, palette);
      if (blob) {
        const d = getDevice(p.device);
        const fname = `${slug(project.name)}-${p.id}-${p.locale}-${d.posterW}x${d.posterH}.png`;
        zip.file(fname, blob);
      }
    }
    const out = await zip.generateAsync({ type: 'blob' });
    saveBlob(out, `${slug(project.name)}-screenshots.zip`);
  };

  const locales = project.locales;

  return (
    <div className="shots">
      <div className="shots-head">
        <h2>{t(lang, 'shots.posters')}</h2>
        <div className="grow" />
        {project.posters?.length > 0 && (
          <button onClick={exportAll}>{t(lang, 'shots.exportAll')} (ZIP)</button>
        )}
        <button className="primary" onClick={addPoster}>
          + {t(lang, 'shots.addPoster')}
        </button>
      </div>

      {/* Theme bar — bg color + accent color */}
      <div className="theme-bar">
        <ColorField
          label={t(lang, 'shots.bgColor')}
          value={theme.bgColor}
          presets={BG_PRESETS}
          onChange={setBgColor}
        />
        <ColorField
          label={t(lang, 'shots.accentColor')}
          value={theme.accentColor}
          presets={ACCENT_PRESETS}
          onChange={setAccentColor}
        />
        <span className="lab" style={{ marginLeft: 'auto' }}>{t(lang, 'shots.theme')}:</span>
        <div className="swatches">
          {['cream', 'card', 'ink', 'ink2', 'char', 'char2', 'rouge'].map((k) => (
            <span key={k} className="sw" style={{ background: palette[k] }} title={`${k} ${palette[k]}`} />
          ))}
        </div>
      </div>

      {/* App name per-locale */}
      <div className="theme-bar">
        <span className="lab">{t(lang, 'shots.appName')}:</span>
        {locales.map((loc) => (
          <div key={loc} className="footer-name">
            <span className="lab" style={{ color: '#9a9080', fontSize: 11 }}>{localeLabel(loc)}</span>
            <input
              type="text"
              placeholder={t(lang, 'shots.appName')}
              value={project.appName?.[loc]?.main || ''}
              onChange={(e) => setAppName(loc, 'main', e.target.value)}
            />
            <input
              type="text"
              placeholder={t(lang, 'shots.appNameAccent')}
              value={project.appName?.[loc]?.accent || ''}
              onChange={(e) => setAppName(loc, 'accent', e.target.value)}
              style={{ width: 90 }}
            />
          </div>
        ))}
      </div>

      {project.posters?.length === 0 || !project.posters ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#5a5040' }}>
          {t(lang, 'shots.empty')}
        </div>
      ) : (
        <div className="poster-grid">
          {project.posters.map((p, idx) => (
            <PosterCard
              key={p.id}
              poster={p}
              index={idx}
              project={project}
              palette={palette}
              lang={lang}
              onPatch={(patch) => updatePoster(p.id, patch)}
              onCopy={(k, v) => updatePosterCopy(p.id, k, v)}
              onRemove={() => removePoster(p.id)}
              onDuplicate={() => duplicatePoster(p.id)}
              onExport={() => exportOne(p.id)}
            />
          ))}
        </div>
      )}

      {/* Hidden offscreen render area used by exporter */}
      <div id="export-stage" />
    </div>
  );
}

function ColorField({ label, value, presets, onChange }) {
  return (
    <div className="color-field">
      <span className="lab">{label}:</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (/^#?[0-9a-fA-F]{3,6}$/.test(v)) onChange(v.startsWith('#') ? v : '#' + v);
        }}
      />
      <div className="preset-row">
        {presets.map((c) => {
          const on = (value || '').toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              className={'preset' + (on ? ' on' : '')}
              style={{ background: c }}
              title={c}
              onClick={() => onChange(c)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PosterCard({ poster, index, project, palette, lang, onPatch, onCopy, onRemove, onDuplicate, onExport }) {
  const device = getDevice(poster.device);
  const ar = `${device.posterW}/${device.posterH}`;
  const frameRef = useRef(null);
  const fileRef = useRef(null);
  const [scale, setScale] = useState(0.2);
  const [dragOver, setDragOver] = useState(null); // 'frame' | 'upload' | null

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(w / device.posterW, h / device.posterH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [device.posterW, device.posterH]);

  const ingestFile = (f) => {
    if (!f || !f.type?.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      onPatch({ screenshot: { dataUrl: String(reader.result), name: f.name } });
    };
    reader.readAsDataURL(f);
  };

  const onFile = (e) => {
    ingestFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const dragHandlers = (key) => ({
    onDragOver: (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (dragOver !== key) setDragOver(key);
      }
    },
    onDragLeave: (e) => {
      // only clear when leaving the element itself, not its children
      if (e.currentTarget.contains(e.relatedTarget)) return;
      setDragOver((cur) => (cur === key ? null : cur));
    },
    onDrop: (e) => {
      e.preventDefault();
      setDragOver(null);
      ingestFile(e.dataTransfer?.files?.[0]);
    },
  });

  const appName = project.appName?.[poster.locale] ||
    project.appName?.[project.locales[0]] ||
    { main: project.name, accent: '' };

  return (
    <div className="poster-card">
      <div className="pc-meta">
        <span className="pc-label">
          {String(index + 1).padStart(2, '0')} · {device.label} · {localeLabel(poster.locale)}
        </span>
        <select value={poster.device} onChange={(e) => onPatch({ device: e.target.value })}>
          {DEVICE_LIST.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <select value={poster.locale} onChange={(e) => onPatch({ locale: e.target.value })}>
          {project.locales.map((l) => (
            <option key={l} value={l}>{localeLabel(l)}</option>
          ))}
        </select>
      </div>

      <div
        className={'pc-frame' + (dragOver === 'frame' ? ' drag-over' : '')}
        ref={frameRef}
        style={{ '--ar': ar }}
        {...dragHandlers('frame')}
      >
        <div
          className="pc-scaler"
          style={{ transform: `scale(${scale})`, width: device.posterW, height: device.posterH }}
        >
          <Poster
            id={poster.id}
            palette={palette}
            copy={poster.copy}
            appName={appName}
            device={poster.device}
            screenshot={poster.screenshot}
            icon={project.icon}
          />
        </div>
        {dragOver === 'frame' && (
          <div className="pc-frame-drop">
            {t(lang, 'shots.dropToReplace')}
          </div>
        )}
      </div>

      <div className="pc-controls">
        <div>
          <label>{t(lang, 'shots.eyebrow')}</label>
          <input
            type="text"
            value={poster.copy.eyebrow || ''}
            onChange={(e) => onCopy('eyebrow', e.target.value)}
          />
        </div>
        <div>
          <label>
            {t(lang, 'shots.headline')}
            <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>
              {t(lang, 'shots.headlineHint')}
            </span>
          </label>
          <textarea
            value={poster.copy.headline || ''}
            onChange={(e) => onCopy('headline', e.target.value)}
          />
        </div>
        <div>
          <label>{t(lang, 'shots.body')}</label>
          <textarea
            value={poster.copy.body || ''}
            onChange={(e) => onCopy('body', e.target.value)}
          />
        </div>

        <div
          className={'pc-upload' + (dragOver === 'upload' ? ' drag-over' : '')}
          onClick={() => fileRef.current?.click()}
          {...dragHandlers('upload')}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFile}
          />
          {dragOver === 'upload'
            ? t(lang, 'shots.dropToReplace')
            : poster.screenshot
              ? `${t(lang, 'shots.replaceScreenshot')} — ${poster.screenshot.name}`
              : t(lang, 'shots.uploadOrDrag')}
          <div className="hint">
            {t(lang, 'shots.uploadHint', {
              w: device.posterW,
              h: device.posterH,
              ratio: device.posterW + ':' + device.posterH,
            })}
          </div>
        </div>

        <div className="pc-actions">
          <button className="primary" onClick={onExport}>
            {t(lang, 'shots.exportPng')}
          </button>
          <button onClick={onDuplicate}>{t(lang, 'shots.duplicate')}</button>
          {poster.screenshot && (
            <button onClick={() => onPatch({ screenshot: null })}>
              {t(lang, 'shots.removeScreenshot')}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="danger" onClick={() => {
            if (confirm(t(lang, 'shots.confirmDelete'))) onRemove();
          }}>
            {t(lang, 'shots.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Export ----

async function renderAndExport(posterId, project, palette) {
  const blob = await renderToBlob(posterId, project, palette);
  if (!blob) return;
  const poster = project.posters.find((p) => p.id === posterId);
  const d = getDevice(poster.device);
  const fname = `${slug(project.name)}-${poster.id}-${poster.locale}-${d.posterW}x${d.posterH}.png`;
  saveBlob(blob, fname);
}

async function renderToBlob(posterId, project, palette) {
  const src = document.querySelector(`[data-poster-id="${posterId}"]`);
  if (!src) return null;
  const stage = document.getElementById('export-stage');
  if (!stage) return null;

  const wrap = document.createElement('div');
  wrap.style.background = palette.cream;
  const clone = src.cloneNode(true);
  // remove any transforms applied by parent scaler (we are cloning the inner native node directly)
  clone.style.transform = 'none';
  wrap.appendChild(clone);
  stage.innerHTML = '';
  stage.appendChild(wrap);

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const poster = project.posters.find((p) => p.id === posterId);
  const d = getDevice(poster.device);

  let blob = null;
  try {
    blob = await htmlToImage.toBlob(clone, {
      width: d.posterW,
      height: d.posterH,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: palette.cream,
      // Skip cross-origin CSS scanning for Google Fonts; the browser still uses
      // already-loaded fonts when rasterizing the SVG.
      skipFonts: true,
    });
  } catch (err) {
    console.error('export failed', err);
    alert('Export failed: ' + err.message);
  } finally {
    stage.innerHTML = '';
  }
  return blob;
}

function saveBlob(blob, fname) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(s) {
  return String(s || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}
