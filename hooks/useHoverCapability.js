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

    // DEBUG: Log initial state
    console.log('[useHoverCapability] Hook mounted');
    console.log('[useHoverCapability] Initial has-hover class:', document.documentElement.classList.contains('has-hover'));
    console.log('[useHoverCapability] CSS hover media:', window.matchMedia('(hover: hover)').matches);
    console.log('[useHoverCapability] CSS pointer media:', window.matchMedia('(pointer: fine)').matches);

    const handlePointerMove = (event) => {
      // DEBUG: Log every pointer type change
      if (event.pointerType !== lastPointerType) {
        console.log('[useHoverCapability] Pointer type changed:', lastPointerType, '->', event.pointerType);
      }

      // Only update if pointer type changed to avoid unnecessary DOM updates
      if (event.pointerType === lastPointerType) return;
      lastPointerType = event.pointerType;

      // mouse = mouse/trackpad, pen = stylus (both support hover)
      // touch = finger (no hover)
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        console.log('[useHoverCapability] Adding has-hover class');
        document.documentElement.classList.add('has-hover');
      } else {
        console.log('[useHoverCapability] Removing has-hover class');
        document.documentElement.classList.remove('has-hover');
      }

      // DEBUG: Confirm class state after change
      console.log('[useHoverCapability] has-hover class now:', document.documentElement.classList.contains('has-hover'));
    };

    // Listen for pointer movement to detect input type
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);
}
