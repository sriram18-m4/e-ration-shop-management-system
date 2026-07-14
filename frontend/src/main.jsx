import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles.css';

const rootElement = document.getElementById('root');

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  rootElement.innerHTML = `
    <main style="display:grid;place-items:center;min-height:100vh;padding:24px;font-family:Arial,sans-serif;background:#f5f7fb;">
      <section style="max-width:560px;padding:24px;border:1px solid #fecdd3;border-radius:8px;color:#7f1d1d;background:#fff1f2;">
        <h1 style="margin:0 0 10px;font-size:24px;">Application could not start</h1>
        <p style="margin:0;">${error.message}</p>
      </section>
    </main>
  `;
}
