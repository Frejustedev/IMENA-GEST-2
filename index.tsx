import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';
import { AccessibilityProvider } from './components/accessibility/AccessibilityProvider';

/**
 * Configuration globale pour l'application
 */
const setupGlobalErrorHandling = () => {
  // Capture des erreurs non gérées
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Ici on pourrait envoyer l'erreur à un service de monitoring
  });

  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    // Ici on pourrait envoyer l'erreur à un service de monitoring
  });
};

/**
 * Configuration de l'environnement de développement
 */
const setupDevelopmentMode = () => {
  if (process.env.NODE_ENV === 'development') {
    // Activer les outils de développement React
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // @ts-ignore
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = 
          // @ts-ignore
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot || (() => {});
      }
    }
  }
};

/**
 * Point d'entrée principal de l'application
 */
const initializeApp = () => {
  // Configuration globale
  setupGlobalErrorHandling();
  setupDevelopmentMode();

  // Vérification de l'élément racine
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("L'élément racine (root) est introuvable dans le DOM.");
  }

  // Création de la racine React 18
  const root = ReactDOM.createRoot(rootElement);

  // Rendu de l'application avec Error Boundary global
  root.render(
    <React.StrictMode>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Log global des erreurs
          console.error('Global Error Boundary caught:', error, errorInfo);
          
          // Ici on pourrait envoyer les erreurs à un service de monitoring
          // comme Sentry, LogRocket, etc.
        }}
        fallback={
          <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-red-500 mb-6">
                <svg
                  className="w-20 h-20 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                IMENA-GEST
              </h1>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Erreur critique de l'application
              </h2>
              
              <p className="text-gray-600 mb-6">
                L'application a rencontré une erreur critique et ne peut pas se charger correctement. 
                Veuillez rafraîchir la page ou contacter l'administrateur système.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Rafraîchir l'application
                </button>
                
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Réinitialiser et redémarrer
                </button>
                
                <a
                  href="mailto:support@imena-gest.com"
                  className="inline-block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Contacter le support
                </a>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Version: {process.env.REACT_APP_VERSION || '1.0.0'} | 
                  Build: {process.env.REACT_APP_BUILD_DATE || 'Développement'}
                </p>
              </div>
            </div>
          </div>
        }
      >
        <AccessibilityProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AccessibilityProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Initialisation de l'application
try {
  initializeApp();
} catch (error) {
  console.error('Failed to initialize app:', error);
  
  // Fallback d'urgence si même l'initialisation échoue
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 20px;
    ">
      <div style="
        max-width: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        padding: 40px;
        text-align: center;
      ">
        <h1 style="color: #dc2626; margin-bottom: 20px;">Erreur critique</h1>
        <p style="color: #374151; margin-bottom: 30px;">
          L'application IMENA-GEST n'a pas pu se charger. 
          Veuillez vérifier votre connexion internet et rafraîchir la page.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #0ea5e9;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Rafraîchir
        </button>
      </div>
    </div>
  `;
}
