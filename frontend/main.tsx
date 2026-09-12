import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installApiBase} from './utils/apiBase.ts';
import {installBusyButtons} from './utils/busyButton.ts';
import {LanguageProvider, useLanguage} from './i18n';

// Point all relative "/api/..." calls at the backend. No-op when
// VITE_API_BASE_URL is not set (local dev / Vercel proxy handle it).
installApiBase();

// Every clicked button immediately shows a busy state and cannot be re-clicked
// until the triggered work completes.
installBusyButtons();

// Prevent benign Vite HMR WebSocket connection errors from producing unhandled rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (reasonStr.includes('WebSocket') || reasonStr.includes('vite')) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event.message || '');
    if (msg.includes('[vite]') || msg.includes('WebSocket')) {
      event.preventDefault();
    }
  });
}

/**
 * Always-visible floating multilingual bar mounted above every view.
 * Uses ONLY the LanguageProvider surface verified on disk (code/t/setCode/
 * supported/endonyms) - instant live switch, no logout/reload.
 */
function LanguageBar() {
  const {code, t, setCode, supported, endonyms} = useLanguage();
  return (
    <div
      role="button"
      aria-label={t('nav_language')}
      style={{
        position: 'fixed',
        top: 84,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--surface,#fff)',
        border: '1px solid var(--border,#ccc)',
        borderRadius: 999,
        padding: '6px 12px',
        boxShadow: '0 4px 14px rgba(15,23,42,.08)',
        fontFamily: 'inherit',
        fontSize: 13,
      }}
    >
      <span aria-hidden>{endonyms[code]}</span>
      <select
        aria-label={t('nav_language')}
        value={code}
        onChange={(e) => setCode(e.target.value as any)}
        style={{border: 'none', background: 'transparent', font: 'inherit', cursor: 'pointer'}}
      >
        {supported.map((c) => (
          <option key={c} value={c}>
            {endonyms[c]}
          </option>
        ))}
      </select>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <LanguageBar />
      <App />
    </LanguageProvider>
  </StrictMode>,
);
