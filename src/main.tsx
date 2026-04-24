// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initStorage } from './lib/storage'

async function boot() {
  try {
    await initStorage();
  } catch (err) {
    console.error('[ManageMe] Błąd inicjalizacji magazynu danych:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void boot();