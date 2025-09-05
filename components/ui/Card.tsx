import React, { forwardRef } from 'react';

/**
 * Variants visuels pour les cartes
 */
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

/**
 * Tailles disponibles pour les cartes
 */
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Props du composant Card principal
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant visuel de la carte */
  variant?: CardVariant;
  /** Taille de la carte */
  size?: CardSize;
  /** Si la carte est interactive (hover effects) */
  interactive?: boolean;
  /** Si la carte est sélectionnée */
  selected?: boolean;
  /** Si la carte est désactivée */
  disabled?: boolean;
}

/**
 * Props pour l'en-tête de carte
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Titre de la carte */
  title?: string;
  /** Sous-titre de la carte */
  subtitle?: string;
  /** Actions à afficher dans l'en-tête */
  actions?: React.ReactNode;
}

/**
 * Props pour le contenu de carte
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Si le contenu doit avoir un padding */
  noPadding?: boolean;
}

/**
 * Props pour le pied de carte
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Justification du contenu */
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
}

/**
 * Classes CSS pour les variants
 */
const variantClasses: Record<CardVariant, string> = {
  default: `
    bg-white border border-slate-200
    shadow-sm
  `,
  outlined: `
    bg-white border-2 border-slate-300
    shadow-none
  `,
  elevated: `
    bg-white border border-slate-100
    shadow-lg
  `,
  filled: `
    bg-slate-50 border border-slate-200
    shadow-sm
  `
};

/**
 * Classes CSS pour les tailles
 */
const sizeClasses: Record<CardSize, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl'
};

/**
 * Classes CSS pour les états interactifs
 */
const interactiveClasses = `
  transition-all duration-200 ease-in-out
  hover:shadow-md hover:-translate-y-0.5
  active:translate-y-0
  cursor-pointer
`;

/**
 * Classes CSS pour l'état sélectionné
 */
const selectedClasses = `
  ring-2 ring-primary-500 ring-offset-2
  border-primary-300
`;

/**
 * Classes CSS pour l'état désactivé
 */
const disabledClasses = `
  opacity-50 cursor-not-allowed
  pointer-events-none
`;

/**
 * Composant Card principal
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  size = 'md',
  interactive = false,
  selected = false,
  disabled = false,
  className = '',
  children,
  ...props
}, ref) => {
  // Construire les classes CSS
  const baseClasses = 'overflow-hidden';
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const interactiveClass = interactive && !disabled ? interactiveClasses : '';
  const selectedClass = selected ? selectedClasses : '';
  const disabledClass = disabled ? disabledClasses : '';

  const finalClassName = `
    ${baseClasses}
    ${variantClass}
    ${sizeClass}
    ${interactiveClass}
    ${selectedClass}
    ${disabledClass}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div
      ref={ref}
      className={finalClassName}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

/**
 * Composant CardHeader
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  title,
  subtitle,
  actions,
  className = '',
  children,
  ...props
}, ref) => {
  const finalClassName = `
    flex items-start justify-between p-6 pb-4
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div ref={ref} className={finalClassName} {...props}>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 truncate">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

/**
 * Composant CardContent
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({
  noPadding = false,
  className = '',
  children,
  ...props
}, ref) => {
  const paddingClass = noPadding ? '' : 'px-6 py-4';
  
  const finalClassName = `
    ${paddingClass}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

/**
 * Composant CardFooter
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  justify = 'end',
  className = '',
  children,
  ...props
}, ref) => {
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around'
  };

  const finalClassName = `
    flex items-center gap-3 px-6 py-4 pt-2
    border-t border-slate-100
    ${justifyClasses[justify]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

/**
 * Composant CardMedia pour images/vidéos
 */
export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Source de l'image */
  src?: string;
  /** Texte alternatif */
  alt?: string;
  /** Ratio d'aspect */
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  /** Position de l'image */
  objectPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export const CardMedia = forwardRef<HTMLDivElement, CardMediaProps>(({
  src,
  alt = '',
  aspectRatio = 'video',
  objectPosition = 'center',
  className = '',
  children,
  ...props
}, ref) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]'
  };

  const objectPositionClasses = {
    center: 'object-center',
    top: 'object-top',
    bottom: 'object-bottom',
    left: 'object-left',
    right: 'object-right'
  };

  const finalClassName = `
    relative overflow-hidden
    ${aspectRatioClasses[aspectRatio]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${objectPositionClasses[objectPosition]}`}
          loading="lazy"
        />
      ) : children}
    </div>
  );
});

CardMedia.displayName = 'CardMedia';

/**
 * Composant CardGrid pour afficher des cartes en grille
 */
export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre de colonnes */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Espacement entre les cartes */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /** Si la grille doit être responsive */
  responsive?: boolean;
}

export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(({
  columns = 3,
  gap = 'md',
  responsive = true,
  className = '',
  children,
  ...props
}, ref) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const columnClasses = responsive 
    ? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`
    : `grid-cols-${columns}`;

  const finalClassName = `
    grid ${columnClasses} ${gapClasses[gap]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div ref={ref} className={finalClassName} {...props}>
      {children}
    </div>
  );
});

CardGrid.displayName = 'CardGrid';
