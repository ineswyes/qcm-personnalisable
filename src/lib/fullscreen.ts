// Plein écran compatible Safari (iPad) qui utilise encore des noms préfixés « webkit »
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function fullscreenElement(): Element | null {
  const doc = document as WebkitDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function requestFullscreen() {
  const el = document.documentElement as WebkitElement;
  try {
    const result = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.();
    Promise.resolve(result).catch(() => {});
  } catch {
    // plein écran refusé : la présentation s'affiche quand même dans la fenêtre
  }
}

export function exitFullscreen() {
  const doc = document as WebkitDocument;
  if (!fullscreenElement()) return;
  try {
    const result = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
    Promise.resolve(result).catch(() => {});
  } catch {
    // rien à faire
  }
}

export const FULLSCREEN_EVENTS = ["fullscreenchange", "webkitfullscreenchange"];
