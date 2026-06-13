import { useState, useEffect, useRef, useCallback } from 'react';

export default function useResize({ minPx, maxPx, initialPx, side = 'right' }) {
  const [size, setSize] = useState(initialPx);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startSize = useRef(initialPx);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startSize.current = size;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [size]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const delta = side === 'right'
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const next = Math.max(minPx, Math.min(maxPx, startSize.current + delta));
      setSize(next);
    };
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minPx, maxPx, side]);

  return { size, onMouseDown };
}
