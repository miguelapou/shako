'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * FadeInImage - An image component that fades in smoothly once loaded
 *
 * This component solves the race condition where images pop in abruptly
 * by starting with opacity 0 and transitioning to opacity 1 on load.
 *
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes (will be merged with transition classes)
 * @param {object} style - Inline styles
 * @param {string} loading - Loading attribute ('lazy' | 'eager')
 * @param {string} decoding - Decoding attribute ('async' | 'sync' | 'auto')
 * @param {function} onLoad - Optional callback when image loads
 * @param {number} duration - Transition duration in ms (default: 300)
 * @param {object} rest - Any other props passed to the img element
 */
export default function FadeInImage({
  src,
  alt,
  className = '',
  style = {},
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  duration = 300,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const prevSrcRef = useRef(src);

  // Reset loaded state when src changes
  useEffect(() => {
    if (prevSrcRef.current !== src) {
      setIsLoaded(false);
      prevSrcRef.current = src;
    }
  }, [src]);

  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  }, [onLoad]);

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onLoad={handleLoad}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: `opacity ${duration}ms ease-in-out`,
      }}
      {...rest}
    />
  );
}
