import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * Props pour le composant LazyImage
 */
export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Source de l'image */
  src: string;
  /** Texte alternatif */
  alt: string;
  /** Image placeholder pendant le chargement */
  placeholder?: string;
  /** Composant de fallback en cas d'erreur */
  fallback?: React.ReactNode;
  /** Classes CSS pour le conteneur */
  containerClassName?: string;
  /** Si l'image doit être optimisée (formats modernes) */
  optimized?: boolean;
  /** Qualité pour les images optimisées */
  quality?: number;
  /** Si l'image doit être lazy loadée */
  lazy?: boolean;
  /** Distance en pixels avant de charger l'image */
  threshold?: number;
  /** Fonction appelée quand l'image est chargée */
  onLoad?: () => void;
  /** Fonction appelée en cas d'erreur */
  onError?: () => void;
}

/**
 * Hook pour détecter si un élément est visible
 */
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        setHasBeenVisible(true);
      } else {
        setIsVisible(false);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return { isVisible, hasBeenVisible };
}

/**
 * Fonction pour générer des URLs d'images optimisées
 */
function getOptimizedImageSrc(
  src: string,
  options: {
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
    width?: number;
    height?: number;
  } = {}
): string {
  const { quality = 80, format = 'auto', width, height } = options;
  
  // Si c'est déjà une URL absolue ou data URL, la retourner telle quelle
  if (src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }

  // Construire l'URL avec les paramètres d'optimisation
  const params = new URLSearchParams();
  params.set('q', quality.toString());
  
  if (format !== 'auto') {
    params.set('f', format);
  }
  
  if (width) {
    params.set('w', width.toString());
  }
  
  if (height) {
    params.set('h', height.toString());
  }

  return `/api/images/optimize?src=${encodeURIComponent(src)}&${params.toString()}`;
}

/**
 * Composant LazyImage optimisé
 */
export const LazyImage = memo<LazyImageProps>(({
  src,
  alt,
  placeholder,
  fallback,
  containerClassName = '',
  optimized = true,
  quality = 80,
  lazy = true,
  threshold = 100,
  onLoad,
  onError,
  className = '',
  style,
  ...props
}) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { hasBeenVisible } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: `${threshold}px`,
  });

  // Déterminer la source de l'image à utiliser
  const finalSrc = optimized ? getOptimizedImageSrc(src, { quality }) : src;

  // Charger l'image quand elle devient visible
  useEffect(() => {
    if (!lazy || hasBeenVisible) {
      setImageSrc(finalSrc);
    }
  }, [lazy, hasBeenVisible, finalSrc]);

  // Gérer le chargement de l'image
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    
    img.onload = () => {
      setImageStatus('loaded');
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageStatus('error');
      onError?.();
    };
    
    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, onLoad, onError]);

  // Classes CSS pour les transitions
  const imageClasses = `
    transition-opacity duration-300 ease-in-out
    ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}
    ${className}
  `.trim();

  const placeholderClasses = `
    absolute inset-0 bg-slate-200 flex items-center justify-center
    transition-opacity duration-300 ease-in-out
    ${imageStatus === 'loaded' ? 'opacity-0' : 'opacity-100'}
  `;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={style}
    >
      {/* Image principale */}
      {imageSrc && imageStatus !== 'error' && (
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className={imageClasses}
          loading={lazy ? 'lazy' : 'eager'}
          {...props}
        />
      )}

      {/* Placeholder pendant le chargement */}
      {imageStatus === 'loading' && (
        <div className={placeholderClasses}>
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-8 h-8 bg-slate-300 rounded animate-pulse" />
          )}
        </div>
      )}

      {/* Fallback en cas d'erreur */}
      {imageStatus === 'error' && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400">
          {fallback || (
            <div className="text-center">
              <div className="w-8 h-8 bg-slate-300 rounded mx-auto mb-2" />
              <span className="text-xs">Image non disponible</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

/**
 * Composant ImageGallery optimisé avec lazy loading
 */
export interface ImageGalleryProps {
  /** Liste des images */
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
    caption?: string;
  }>;
  /** Classes CSS */
  className?: string;
  /** Taille des thumbnails */
  thumbnailSize?: 'sm' | 'md' | 'lg';
  /** Fonction appelée au clic sur une image */
  onImageClick?: (index: number) => void;
  /** Si les images doivent être optimisées */
  optimized?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  thumbnailSize = 'md',
  onImageClick,
  optimized = true
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const sizeClass = sizeClasses[thumbnailSize];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`${sizeClass} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => onImageClick?.(index)}
        >
          <LazyImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            className="w-full h-full object-cover rounded"
            containerClassName="w-full h-full"
            optimized={optimized}
            quality={60} // Qualité réduite pour les thumbnails
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook pour précharger des images
 */
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    };

    const preloadAll = async () => {
      const results = await Promise.allSettled(
        urls.map(url => preloadImage(url))
      );

      results.forEach((result, index) => {
        const url = urls[index];
        if (result.status === 'fulfilled') {
          setLoadedImages(prev => new Set([...prev, url]));
        } else {
          setFailedImages(prev => new Set([...prev, url]));
        }
      });
    };

    preloadAll();
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isFailed: (url: string) => failedImages.has(url),
    progress: (loadedImages.size + failedImages.size) / urls.length
  };
}

/**
 * Composant Avatar optimisé
 */
export interface AvatarProps {
  /** URL de l'image */
  src?: string;
  /** Nom pour générer les initiales */
  name?: string;
  /** Taille de l'avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Si l'avatar doit être rond */
  rounded?: boolean;
  /** Classes CSS personnalisées */
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = '',
  size = 'md',
  rounded = true,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const baseClasses = `
    inline-flex items-center justify-center
    bg-slate-200 text-slate-600 font-medium
    ${rounded ? 'rounded-full' : 'rounded-md'}
    ${sizeClasses[size]}
    ${className}
  `;

  if (src && !imageError) {
    return (
      <div className={baseClasses}>
        <LazyImage
          src={src}
          alt={name}
          className={`w-full h-full object-cover ${rounded ? 'rounded-full' : 'rounded-md'}`}
          onError={() => setImageError(true)}
          optimized
          quality={90}
        />
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {getInitials(name) || '?'}
    </div>
  );
};
