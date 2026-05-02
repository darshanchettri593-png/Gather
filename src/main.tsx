import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  const alreadyShown = sessionStorage.getItem('gather_splash_shown');

  if (alreadyShown) {
    // Already shown this session — hide immediately
    splash.style.display = 'none';
    return;
  }

  // First time — show normally then hide
  setTimeout(() => {
    splash.classList.add('hiding');
    setTimeout(() => {
      splash.style.display = 'none';
      sessionStorage.setItem('gather_splash_shown', '1');
    }, 400);
  }, 1500);
}

hideSplash();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
