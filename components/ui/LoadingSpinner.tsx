import React from 'react';

interface LoadingSpinnerProps {
  /** Message à afficher sous le spinner */
  message?: string;
  /** Taille du spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Couleur du spinner */
  color?: 'primary' | 'white' | 'gray';
  /** Affichage centré sur toute la page */
  fullPage?: boolean;
}

/**
 * Composant Spinner de chargement réutilisable
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Chargement...',
  size = 'md',
  color = 'primary',
  fullPage = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'text-sky-600',
    white: 'text-white',
    gray: 'text-slate-400'
  };

  const containerClasses = fullPage 
    ? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative">
          {/* Spinner principal */}
          <div 
            className={`
              ${sizeClasses[size]} 
              ${colorClasses[color]} 
              animate-spin mx-auto mb-4
            `}
          >
            <svg
              className="animate-spin h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          
          {/* Points animés */}
          <div className="flex justify-center space-x-1 mb-4">
            <div 
              className={`
                ${color === 'white' ? 'bg-white' : 'bg-sky-600'}
                w-2 h-2 rounded-full animate-bounce
              `}
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className={`
                ${color === 'white' ? 'bg-white' : 'bg-sky-600'}
                w-2 h-2 rounded-full animate-bounce
              `}
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className={`
                ${color === 'white' ? 'bg-white' : 'bg-sky-600'}
                w-2 h-2 rounded-full animate-bounce
              `}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
        
        {message && (
          <p className={`
            text-sm font-medium
            ${color === 'white' ? 'text-white' : 'text-slate-600'}
          `}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Spinner inline simple pour les boutons
 */
export const InlineSpinner: React.FC<{ size?: 'sm' | 'md'; color?: 'primary' | 'white' }> = ({ 
  size = 'sm', 
  color = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  const colorClasses = {
    primary: 'text-sky-600',
    white: 'text-white'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;