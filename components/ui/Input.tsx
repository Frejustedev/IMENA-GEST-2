import React, { forwardRef, useState } from 'react';
import { EyeIcon } from '../icons/EyeIcon';
import { InformationCircleIcon } from '../icons/InformationCircleIcon';
import { ExclamationTriangleIcon } from '../icons/ExclamationTriangleIcon';

/**
 * Variants visuels pour les inputs
 */
export type InputVariant = 'default' | 'filled' | 'outlined';

/**
 * Tailles disponibles pour les inputs
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Types d'input supportés
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

/**
 * États de validation
 */
export type ValidationState = 'default' | 'valid' | 'invalid' | 'warning';

/**
 * Props du composant Input
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Variant visuel de l'input */
  variant?: InputVariant;
  /** Taille de l'input */
  size?: InputSize;
  /** État de validation */
  validationState?: ValidationState;
  /** Message d'aide ou d'erreur */
  helperText?: string;
  /** Label de l'input */
  label?: string;
  /** Si le label est requis */
  required?: boolean;
  /** Icône à gauche */
  leftIcon?: React.ReactNode;
  /** Icône à droite */
  rightIcon?: React.ReactNode;
  /** Élément personnalisé à droite */
  rightElement?: React.ReactNode;
  /** Si l'input prend toute la largeur */
  fullWidth?: boolean;
  /** Texte du placeholder amélioré */
  hint?: string;
}

/**
 * Classes CSS pour les variants
 */
const variantClasses: Record<InputVariant, string> = {
  default: `
    border border-slate-300 bg-white
    focus:border-primary-500 focus:ring-primary-500
  `,
  filled: `
    border-0 bg-slate-100
    focus:bg-white focus:ring-2 focus:ring-primary-500
  `,
  outlined: `
    border-2 border-slate-300 bg-white
    focus:border-primary-500 focus:ring-0
  `
};

/**
 * Classes CSS pour les tailles
 */
const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-4 py-3 text-lg'
};

/**
 * Classes CSS pour les états de validation
 */
const validationClasses: Record<ValidationState, string> = {
  default: '',
  valid: 'border-success-500 focus:border-success-500 focus:ring-success-500',
  invalid: 'border-error-500 focus:border-error-500 focus:ring-error-500',
  warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500'
};

/**
 * Icônes pour les états de validation
 */
const validationIcons: Record<ValidationState, React.ReactNode | null> = {
  default: null,
  valid: <InformationCircleIcon className="w-5 h-5 text-success-500" />,
  invalid: <ExclamationTriangleIcon className="w-5 h-5 text-error-500" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />
};

/**
 * Couleurs du helper text selon l'état
 */
const helperTextClasses: Record<ValidationState, string> = {
  default: 'text-slate-600',
  valid: 'text-success-600',
  invalid: 'text-error-600',
  warning: 'text-warning-600'
};

/**
 * Composant Input principal
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  validationState = 'default',
  helperText,
  label,
  required = false,
  leftIcon,
  rightIcon,
  rightElement,
  fullWidth = false,
  hint,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Générer un ID unique si non fourni
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Type effectif (gérer le toggle password)
  const effectiveType = type === 'password' && showPassword ? 'text' : type;
  
  // Construire les classes CSS
  const baseClasses = `
    block w-full rounded-md transition-all duration-200
    placeholder-slate-400
    focus:outline-none focus:ring-1
    disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
  `;

  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const validationClass = validationClasses[validationState];
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Classes pour les icônes
  const hasLeftIcon = leftIcon;
  const hasRightIcon = rightIcon || rightElement || type === 'password' || validationState !== 'default';
  const leftPaddingClass = hasLeftIcon ? 'pl-10' : '';
  const rightPaddingClass = hasRightIcon ? 'pr-10' : '';

  const finalInputClassName = `
    ${baseClasses}
    ${variantClass}
    ${sizeClass}
    ${validationClass}
    ${leftPaddingClass}
    ${rightPaddingClass}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const containerClassName = `
    relative ${widthClass}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={containerClassName}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium mb-2 ${
            validationState === 'invalid' ? 'text-error-700' : 'text-slate-700'
          }`}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Container pour l'input et les icônes */}
      <div className="relative">
        {/* Icône gauche */}
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400">
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input principal */}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          className={finalInputClassName}
          placeholder={hint || props.placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* Icônes/éléments droite */}
        {hasRightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {/* Bouton toggle password */}
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                <EyeIcon className="w-5 h-5" />
              </button>
            )}
            
            {/* Élément personnalisé */}
            {rightElement}
            
            {/* Icône droite normale */}
            {!type.includes('password') && !rightElement && rightIcon && (
              <span className="text-slate-400">
                {rightIcon}
              </span>
            )}
            
            {/* Icône de validation */}
            {!type.includes('password') && !rightElement && !rightIcon && validationState !== 'default' && validationIcons[validationState]}
          </div>
        )}

        {/* Indicateur de focus (pour variant filled) */}
        {variant === 'filled' && isFocused && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500 transform origin-center scale-x-100 transition-transform duration-200" />
        )}
      </div>

      {/* Helper text */}
      {helperText && (
        <p className={`mt-2 text-sm ${helperTextClasses[validationState]}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Composant InputGroup pour grouper des inputs
 */
export interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  validationState?: ValidationState;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  children,
  className = '',
  label,
  required = false,
  helperText,
  validationState = 'default'
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium ${
          validationState === 'invalid' ? 'text-error-700' : 'text-slate-700'
        }`}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex -space-x-px">
        {childrenArray.map((child, index) => {
          if (!React.isValidElement(child)) return child;

          let roundedClass = 'rounded-none';
          if (childrenArray.length === 1) {
            roundedClass = 'rounded-md';
          } else if (index === 0) {
            roundedClass = 'rounded-l-md';
          } else if (index === childrenArray.length - 1) {
            roundedClass = 'rounded-r-md';
          }

          return React.cloneElement(child as React.ReactElement, {
            key: index,
            className: `${child.props.className || ''} ${roundedClass} z-10 focus:z-20`.trim(),
            validationState: validationState || child.props.validationState
          });
        })}
      </div>
      
      {helperText && (
        <p className={`text-sm ${helperTextClasses[validationState]}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * Hook pour gérer la validation d'input
 */
export const useInputValidation = (
  value: string,
  rules: Array<(value: string) => string | null>
) => {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  const validate = React.useCallback(() => {
    for (const rule of rules) {
      const result = rule(value);
      if (result) {
        setError(result);
        setIsValid(false);
        return false;
      }
    }
    setError(null);
    setIsValid(true);
    return true;
  }, [value, rules]);

  React.useEffect(() => {
    if (value) {
      validate();
    } else {
      setError(null);
      setIsValid(true);
    }
  }, [value, validate]);

  return {
    error,
    isValid,
    validate,
    validationState: error ? 'invalid' as const : (isValid && value ? 'valid' as const : 'default' as const)
  };
};

/**
 * Règles de validation communes
 */
export const validationRules = {
  required: (message = 'Ce champ est requis') => (value: string) => 
    value.trim() ? null : message,
  
  email: (message = 'Email invalide') => (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message,
  
  minLength: (min: number, message?: string) => (value: string) =>
    value.length >= min ? null : message || `Minimum ${min} caractères`,
  
  maxLength: (max: number, message?: string) => (value: string) =>
    value.length <= max ? null : message || `Maximum ${max} caractères`,
  
  pattern: (regex: RegExp, message: string) => (value: string) =>
    regex.test(value) ? null : message
};
