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

export default function Poster({ id, palette, copy, appName, device, screenshot, icon }) {
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
            width: 60,
            height: 60,
            borderRadius: 14,
            background: 'var(--cs-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // soft shadow + inner highlight to feel like the iOS app icon mask
            boxShadow:
              '0 4px 12px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.12)',
          }}
        >
          {icon?.dataUrl ? (
            <img
              src={icon.dataUrl}
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
            <svg width="34" height="34" viewBox="0 0 16 16" fill="none">
              <path d="M5 2 L11 2 Q12 2 12 3 L12 14 L8 11.5 L4 14 L4 3 Q4 2 5 2 Z" fill="var(--cs-card)" />
            </svg>
          )}
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
  const n = device.notch;
  return (
    <div
      style={{
        width: device.shellW + 'px',
        height: device.shellH + 'px',
        borderRadius: device.shellRadius + 'px',
        // titanium-frame look: thin highlight ring + dark body
        background:
          'linear-gradient(160deg, #2a2520 0%, #1a1814 38%, #100e0c 100%)',
        padding: device.shellPadding + 'px',
        boxShadow:
          // outer thin ring (frame edge)
          '0 0 0 2px rgba(0,0,0,.35),' +
          // soft drop shadow
          ' 0 60px 120px rgba(60,40,20,.22),' +
          // inner top highlight (subtle bevel)
          ' inset 0 2px 1px rgba(255,255,255,.06),' +
          ' inset 0 -1px 0 rgba(0,0,0,.4)',
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
          // subtle inner shadow at the screen edge
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.5)',
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

      {n?.kind === 'island' && <DynamicIsland notch={n} />}
      {n?.kind === 'notch' && <ClassicNotch notch={n} padding={device.shellPadding} />}
      {n?.kind === 'home' && <HomeEra notch={n} device={device} />}
    </div>
  );
}

// iPhone 14 Pro+ Dynamic Island — a floating black pill near the top.
function DynamicIsland({ notch }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: notch.top,
        left: '50%',
        transform: 'translateX(-50%)',
        width: notch.w,
        height: notch.h,
        // capsule shape: half height = full radius
        borderRadius: notch.h / 2,
        background: '#000',
        zIndex: 100,
        // tiny glints to suggest sensors
        boxShadow:
          'inset 0 0 0 1px rgba(40,40,40,.6),' +
          ' inset 8px 0 6px rgba(0,0,0,.0)',
      }}
    >
      {/* front camera dot */}
      <div
        style={{
          position: 'absolute',
          right: notch.h * 0.28,
          top: '50%',
          transform: 'translateY(-50%)',
          width: notch.h * 0.34,
          height: notch.h * 0.34,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, #2c2c30 0%, #0a0a0c 70%)',
          boxShadow: 'inset 0 0 0 1px rgba(80,80,90,.4)',
        }}
      />
    </div>
  );
}

// iPhone X..13-era top notch — flush against the screen edge.
function ClassicNotch({ notch, padding }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: padding,
        left: '50%',
        transform: 'translateX(-50%)',
        width: notch.w,
        height: notch.h,
        background: '#000',
        // top edge is flat (matches the screen top), bottom is rounded
        borderBottomLeftRadius: notch.h,
        borderBottomRightRadius: notch.h,
        zIndex: 100,
      }}
    >
      {/* speaker slit + camera dot */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: notch.w * 0.34,
          height: 6,
          borderRadius: 3,
          background: '#222',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '52%',
          right: notch.w * 0.18,
          transform: 'translateY(-50%)',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, #2c2c30 0%, #060608 75%)',
        }}
      />
    </div>
  );
}

// iPhone 8 Plus / pre-X home-button era — earpiece slit + front camera + home button.
function HomeEra({ notch }) {
  return (
    <>
      {/* earpiece */}
      <div
        style={{
          position: 'absolute',
          top: notch.earpiece.top,
          left: '50%',
          transform: 'translateX(-50%)',
          width: notch.earpiece.w,
          height: notch.earpiece.h,
          borderRadius: notch.earpiece.h / 2,
          background: '#0a0a0c',
          zIndex: 100,
        }}
      />
      {/* front camera */}
      <div
        style={{
          position: 'absolute',
          top: notch.earpiece.top + (notch.earpiece.h - notch.camera.r * 2) / 2,
          left: `calc(50% - ${notch.camera.offset}px)`,
          width: notch.camera.r * 2,
          height: notch.camera.r * 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, #2c2c30 0%, #060608 75%)',
          zIndex: 100,
        }}
      />
    </>
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
