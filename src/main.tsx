import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Wait minimum 1.5s for the branding moment, then fade out
  setTimeout(() => {
    splash.classList.add('hiding');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 400);
  }, 1500);
}

// Hide splash when React is ready
hideSplash();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
