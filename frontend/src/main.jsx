import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initSentry } from './config/sentry';

initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide the initial HTML loader
if (typeof window.hideLoader === 'function') window.hideLoader();

// Offline detection
const updateOnline = () => {
  const el = document.getElementById('offline-indicator');
  if (el) el.classList.toggle('show', !navigator.onLine);
};
window.addEventListener('online',  updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();
