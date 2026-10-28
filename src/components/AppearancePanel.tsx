import type { Appearance } from "../types";

const SWATCHES = [
  { label: "Jaune", value: "#facc15" },
  { label: "Orange", value: "#f97316" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Rose", value: "#ec4899" },
  { label: "Vert", value: "#22c55e" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Noir", value: "#111111" },
  { label: "Blanc", value: "#ffffff" },
];

interface ColorChoiceProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorChoice({ label, value, onChange }: ColorChoiceProps) {
  return (
    <div className="settings-row">
      {label}
      <div className="color-choice">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            className={
              value.toLowerCase() === swatch.value
                ? "color-choice__swatch color-choice__swatch--active"
                : "color-choice__swatch"
            }
            style={{ backgroundColor: swatch.value }}
            onClick={() => onChange(swatch.value)}
            aria-label={swatch.label}
            title={swatch.label}
          />
        ))}
        <label className="color-choice__custom" title="Autre couleur">
          Autre
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        </label>
      </div>
    </div>
  );
}

interface AppearancePanelProps {
  appearance: Appearance;
  onChange: (appearance: Appearance) => void;
}

/** Couleurs et épaisseur du contour des cases (valables pour tous les QCM) */
export function AppearancePanel({ appearance, onChange }: AppearancePanelProps) {
  return (
    <section className="settings-section">
      <h2>Contour des cases (tous les QCM)</h2>
      <ColorChoice
        label="Couleur pendant le défilement"
        value={appearance.scanColor}
        onChange={(scanColor) => onChange({ ...appearance, scanColor })}
      />
      <ColorChoice
        label="Couleur de la réponse choisie"
        value={appearance.selectedColor}
        onChange={(selectedColor) => onChange({ ...appearance, selectedColor })}
      />
      <label className="settings-row">
        Épaisseur du contour ({appearance.ringWidth} px)
        <input
          type="range"
          min={4}
          max={24}
          step={1}
          value={appearance.ringWidth}
          onChange={(e) => onChange({ ...appearance, ringWidth: Number(e.target.value) })}
        />
      </label>
      <div className="settings-row">
        Aperçu
        <div className="ring-preview">
          <span
            className="ring-preview__card"
            style={{ boxShadow: `inset 0 0 0 ${appearance.ringWidth}px ${appearance.scanColor}` }}
          >
            Défilement
          </span>
          <span
            className="ring-preview__card"
            style={{
              boxShadow: `inset 0 0 0 ${appearance.ringWidth}px ${appearance.selectedColor}`,
            }}
          >
            Réponse
          </span>
        </div>
      </div>
    </section>
  );
}
