import { useEffect } from 'react';

/**
 * Detects whether a hover-capable input device (mouse, trackpad, pen) is being used
 * and adds/removes a 'has-hover' class on the document element.
 *
 * This is more reliable than CSS media queries for devices like iPad where
 * touch is always the "primary" input even when a trackpad is connected.
 */
export default function useHoverCapability() {
  useEffect(() => {
    let lastPointerType = null;

    const handlePointerMove = (event) => {
      // Only update if pointer type changed to avoid unnecessary DOM updates
      if (event.pointerType === lastPointerType) return;
      lastPointerType = event.pointerType;

      // mouse = mouse/trackpad, pen = stylus (both support hover)
      // touch = finger (no hover)
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        document.documentElement.classList.add('has-hover');
      } else {
        document.documentElement.classList.remove('has-hover');
      }
    };

    // Listen for pointer movement to detect input type
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);
}
