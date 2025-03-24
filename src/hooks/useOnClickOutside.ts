import { useEffect } from 'react'

type AnyEvent = MouseEvent | TouchEvent

export function useOnClickOutside<T extends HTMLElement>(
    ref: React.RefObject<T | null>, // Permite que el ref pueda ser null
    handler: (event: AnyEvent) => void
  ) {
    useEffect(() => {
      const listener = (event: AnyEvent) => {
        if (!ref.current) return; // Si es null, salimos sin hacer nada
        const target = event.target as Node;
        if (ref.current.contains(target)) return;
        handler(event);
      };
  
      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);
  
      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    }, [ref, handler]);
  }
  