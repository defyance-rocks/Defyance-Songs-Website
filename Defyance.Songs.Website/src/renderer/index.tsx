import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered:', registration);
        
        // If there's no controller, reload once to let SW take over
        if (!navigator.serviceWorker.controller) {
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            // registration.active?.postMessage({ type: 'CLAIM' });
        }
      }).catch(error => {
        console.log('SW registration failed:', error);
      });
    });

    // Handle controller change (reloads page once to ensure SW is active)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });
}

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/:tab?/:id?/:edit?" element={<App />} />
    </Routes>
  </BrowserRouter>
);