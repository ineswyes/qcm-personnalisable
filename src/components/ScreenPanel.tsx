import type { Appearance } from "../types";

interface ScreenPanelProps {
  appearance: Appearance;
  onChange: (appearance: Appearance) => void;
}

/** Adaptation à la taille de l'écran (valable pour tous les QCM) */
export function ScreenPanel({ appearance, onChange }: ScreenPanelProps) {
  return (
    <section className="settings-section">
      <h2>Taille de l'écran (tous les QCM)</h2>
      <label className="settings-checkbox">
        <input
          type="checkbox"
          checked={appearance.fitToScreen}
          onChange={(e) => onChange({ ...appearance, fitToScreen: e.target.checked })}
        />
        Adapter la taille des textes à l'écran (iPad, tablette, petit écran)
      </label>
      <p className="settings-hint">
        Les textes des cases et la question sont réduits automatiquement sur les écrans plus petits
        qu'un ordinateur, pour que tout tienne sans faire défiler la page. Sur un ordinateur, rien
        ne change.
      </p>
    </section>
  );
}
