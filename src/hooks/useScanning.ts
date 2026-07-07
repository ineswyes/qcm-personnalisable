import { useEffect, useRef, useState } from "react";

export function useScanning(length: number, speedMs: number, active: boolean) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setCurrentIndex(0);
      indexRef.current = 0;
      return;
    }
    if (length === 0) return;

    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % length;
      setCurrentIndex(indexRef.current);
    }, speedMs);

    return () => clearInterval(id);
  }, [active, length, speedMs]);

  return currentIndex;
}
