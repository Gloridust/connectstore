import { paletteToCssVars } from '../utils/colors';
import { getDevice } from '../utils/devices';

// Renders a single poster at NATIVE pixel size.
// The caller is responsible for scaling it down for preview via CSS transform.
//
// Props:
//   id           — poster id (used to anchor export)
//   palette      — generated color palette
//   copy         — { eyebrow, headline (with <em>), body }
//   appName      — { main, accent }
//   device       — device id (e.g. 'iphone-6.9')
//   screenshot   — { dataUrl, name } | null
//
// We embed the palette as inline CSS vars on a wrapper so html-to-image picks
// it up even when the node is cloned to the offscreen export stage.

export default function Poster({ id, palette, copy, appName, device, screenshot }) {
  const d = getDevice(device);
  const isPad = device.startsWith('ipad');
  const cssVars = paletteToCssVars(palette);

  const W = d.posterW;
  const H = d.posterH;

  // Top headline area
  const headlinePad = isPad ? 200 : 110;
  const headlineTop = isPad ? 180 : 180;
  const headlineFs = isPad ? 148 : 116;
  const eyebrowFs = isPad ? 42 : 38;
  const bodyFs = isPad ? 40 : 36;

  // Footer reserves space at the bottom of the poster.
  const footerH = 220;

  return (
    <div
      data-poster-id={id}
      className={'poster-native' + (isPad ? ' is-pad' : '')}
      style={{
        ...cssVars,
        width: W + 'px',
        height: H + 'px',
        background: 'var(--cs-cream)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--serif), Georgia, serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Headline */}
      <div
        style={{
          width: '100%',
          padding: `${headlineTop}px ${headlinePad}px 0`,
          textAlign: 'center',
          color: 'var(--cs-char)',
          boxSizing: 'border-box',
          flex: '0 0 auto',
        }}
      >
        <div
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontStyle: 'italic',
            fontSize: eyebrowFs + 'px',
            color: 'var(--cs-ink2)',
            letterSpacing: '0.02em',
            marginBottom: 24,
            fontWeight: 400,
          }}
        >
          {copy.eyebrow || ''}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 700,
            fontSize: headlineFs + 'px',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--cs-char)',
          }}
          dangerouslySetInnerHTML={{ __html: renderHeadline(copy.headline) }}
        />
        <p
          style={{
            margin: `${isPad ? 64 : 56}px auto 0`,
            maxWidth: isPad ? 1300 : 880,
            fontFamily: 'Fraunces, Georgia, serif',
            fontStyle: 'italic',
            fontSize: bodyFs + 'px',
            lineHeight: 1.45,
            color: 'var(--cs-char2)',
            fontWeight: 400,
          }}
        >
          {copy.body || ''}
        </p>
      </div>

      {/* Stage — flex:1, phone aligned to bottom, kept clear of footer */}
      <div
        style={{
          flex: '1 1 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: `40px ${isPad ? 200 : 80}px ${footerH}px`,
          boxSizing: 'border-box',
          minHeight: 0,
        }}
      >
        <PhoneFrame device={d} screenshot={screenshot} />
      </div>

      {/* Footer mark */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--cs-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
            <path d="M5 2 L11 2 Q12 2 12 3 L12 14 L8 11.5 L4 14 L4 3 Q4 2 5 2 Z" fill="var(--cs-card)" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--cs-char)',
            letterSpacing: '-0.01em',
          }}
        >
          {appName?.main || ''}
          {appName?.accent ? (
            <em
              style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--cs-ink2)', marginLeft: 8 }}
            >
              {appName.accent}
            </em>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Allow only <em> from user copy.
function renderHeadline(s) {
  const safe = String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // re-enable <em> tags
  return safe
    .replace(/&lt;em&gt;/g, '<em style="font-style:italic;font-weight:400;color:var(--cs-ink2);">')
    .replace(/&lt;\/em&gt;/g, '</em>');
}

function PhoneFrame({ device, screenshot }) {
  const isPad = device.id.startsWith('ipad');
  return (
    <div
      style={{
        width: device.shellW + 'px',
        height: device.shellH + 'px',
        borderRadius: device.shellRadius + 'px',
        background: '#1a1814',
        padding: device.shellPadding + 'px',
        boxShadow:
          '0 0 0 2px rgba(60,40,20,.18), 0 60px 120px rgba(60,40,20,.22), inset 0 2px 2px rgba(255,255,255,.04)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: device.screenRadius + 'px',
          overflow: 'hidden',
          background: 'var(--cs-cream)',
          position: 'relative',
        }}
      >
        {screenshot?.dataUrl ? (
          <img
            src={screenshot.dataUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <PlaceholderScreen device={device} />
        )}
      </div>
      {!isPad && device.notch ? (
        <div
          style={{
            position: 'absolute',
            top: device.notch.top,
            left: '50%',
            transform: 'translateX(-50%)',
            width: device.notch.w,
            height: device.notch.h,
            borderRadius: 48,
            background: '#000',
            zIndex: 100,
          }}
        />
      ) : null}
    </div>
  );
}

function PlaceholderScreen({ device }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24,
        background:
          'linear-gradient(180deg, var(--cs-card) 0%, var(--cs-cream) 100%)',
        color: 'var(--cs-char3)',
        fontFamily: 'Fraunces, Georgia, serif',
        fontStyle: 'italic',
        fontSize: device.id.startsWith('ipad') ? 64 : 56,
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div style={{ fontSize: 96, opacity: 0.5 }}>↑</div>
      <div>upload your screenshot</div>
    </div>
  );
}
