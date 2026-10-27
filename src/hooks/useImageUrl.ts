import { useEffect, useState, useSyncExternalStore } from "react";
import { getCachedImageUrl, loadImageUrl, subscribeImages } from "../lib/imageStore";

/** Renvoie l'adresse affichable d'une photo (ou null si pas de photo). */
export function useImageUrl(imageId: string | undefined): string | null {
  // Se met à jour quand une photo est ajoutée ou importée
  const cached = useSyncExternalStore(subscribeImages, () =>
    imageId ? getCachedImageUrl(imageId) : null,
  );
  const [loaded, setLoaded] = useState<{ id: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!imageId || cached) return;
    let cancelled = false;
    loadImageUrl(imageId)
      .then((url) => {
        if (!cancelled) setLoaded({ id: imageId, url });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id: imageId, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [imageId, cached]);

  if (!imageId) return null;
  if (cached) return cached;
  return loaded?.id === imageId ? loaded.url : null;
}
