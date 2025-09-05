import React, { forwardRef } from 'react';
import { Spinner } from '../Spinner';

/**
 * Types de variants pour les boutons
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'ghost' 
  | 'outline';

/**
 * Tailles disponibles pour les boutons
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Props du composant Button
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variant visuel du bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** Si le bouton est en état de chargement */
  loading?: boolean;
  /** Texte à afficher pendant le chargement */
  loadingText?: string;
  /** Icône à afficher à gauche du texte */
  leftIcon?: React.ReactNode;
  /** Icône à afficher à droite du texte */
  rightIcon?: React.ReactNode;
  /** Si le bouton doit prendre toute la largeur */
  fullWidth?: boolean;
  /** Si le bouton est dans un groupe */
  isInGroup?: boolean;
  /** Position dans le groupe */
  groupPosition?: 'first' | 'middle' | 'last' | 'only';
}

/**
 * Classes CSS pour les variants
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-white border-transparent
    hover:bg-primary-700 hover:border-primary-700
    focus:ring-primary-500 focus:border-primary-500
    disabled:bg-primary-300 disabled:border-primary-300
  `,
  secondary: `
    bg-slate-100 text-slate-900 border-slate-200
    hover:bg-slate-200 hover:border-slate-300
    focus:ring-slate-500 focus:border-slate-500
    disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200
  `,
  success: `
    bg-success text-white border-transparent
    hover:bg-success-700 hover:border-success-700
    focus:ring-success-500 focus:border-success-500
    disabled:bg-success-300 disabled:border-success-300
  `,
  warning: `
    bg-warning text-white border-transparent
    hover:bg-warning-700 hover:border-warning-700
    focus:ring-warning-500 focus:border-warning-500
    disabled:bg-warning-300 disabled:border-warning-300
  `,
  error: `
    bg-error text-white border-transparent
    hover:bg-error-700 hover:border-error-700
    focus:ring-error-500 focus:border-error-500
    disabled:bg-error-300 disabled:border-error-300
  `,
  ghost: `
    bg-transparent text-slate-700 border-transparent
    hover:bg-slate-100 hover:text-slate-900
    focus:ring-slate-500 focus:border-slate-500
    disabled:text-slate-400 disabled:hover:bg-transparent
  `,
  outline: `
    bg-transparent text-primary border-primary-300
    hover:bg-primary-50 hover:border-primary-400
    focus:ring-primary-500 focus:border-primary-500
    disabled:text-primary-300 disabled:border-primary-200 disabled:hover:bg-transparent
  `
};

/**
 * Classes CSS pour les tailles
 */
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
  xl: 'px-8 py-4 text-xl gap-3'
};

/**
 * Classes CSS pour les positions dans un groupe
 */
const groupPositionClasses: Record<string, string> = {
  first: 'rounded-l-md rounded-r-none border-r-0',
  middle: 'rounded-none border-r-0',
  last: 'rounded-r-md rounded-l-none',
  only: 'rounded-md'
};

/**
 * Composant Button réutilisable et accessible
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  isInGroup = false,
  groupPosition = 'only',
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  // Déterminer si le bouton est désactivé
  const isDisabled = disabled || loading;

  // Construire les classes CSS
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium border
    transition-colors duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    select-none touch-manipulation
  `;

  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const widthClass = fullWidth ? 'w-full' : '';
  const groupClass = isInGroup ? groupPositionClasses[groupPosition] : 'rounded-md';

  const finalClassName = `
    ${baseClasses}
    ${variantClass}
    ${sizeClass}
    ${widthClass}
    ${groupClass}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={finalClassName}
      {...props}
    >
      {/* Icône gauche ou spinner de chargement */}
      {loading ? (
        <Spinner 
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} 
          className="text-current" 
        />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}

      {/* Texte du bouton */}
      {loading && loadingText ? loadingText : children}

      {/* Icône droite */}
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

/**
 * Composant ButtonGroup pour grouper des boutons
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  size,
  variant
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={`inline-flex ${className}`} role="group">
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;

        let groupPosition: ButtonProps['groupPosition'] = 'middle';
        if (childrenArray.length === 1) {
          groupPosition = 'only';
        } else if (index === 0) {
          groupPosition = 'first';
        } else if (index === childrenArray.length - 1) {
          groupPosition = 'last';
        }

        return React.cloneElement(child as React.ReactElement<ButtonProps>, {
          key: index,
          isInGroup: true,
          groupPosition,
          size: size || child.props.size,
          variant: variant || child.props.variant
        });
      })}
    </div>
  );
};

/**
 * Hook pour gérer l'état async des boutons
 */
export const useAsyncButton = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = React.useCallback(async (asyncFn: () => Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      await asyncFn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};
