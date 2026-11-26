import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted variable fonts (bundled; no third-party font CDN at runtime).
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import './theme/tokens.css';
import './theme/global.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
