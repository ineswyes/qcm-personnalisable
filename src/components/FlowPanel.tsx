import type { Appearance } from "../types";

interface FlowPanelProps {
  appearance: Appearance;
  onChange: (appearance: Appearance) => void;
}

/** Enchaînement automatique des QCM (valable pour tous les QCM) */
export function FlowPanel({ appearance, onChange }: FlowPanelProps) {
  return (
    <section className="settings-section">
      <h2>Enchaînement des QCM (tous les QCM)</h2>
      <label className="settings-checkbox">
        <input
          type="checkbox"
          checked={appearance.autoNext}
          onChange={(e) => onChange({ ...appearance, autoNext: e.target.checked })}
        />
        Passer automatiquement au QCM suivant après une réponse
      </label>
      {appearance.autoNext && (
        <label className="settings-row">
          Temps d'attente avant le QCM suivant :{" "}
          {(appearance.autoNextDelayMs / 1000).toLocaleString("fr-FR")} s
          <input
            type="range"
            min={1000}
            max={15000}
            step={500}
            value={appearance.autoNextDelayMs}
            onChange={(e) => onChange({ ...appearance, autoNextDelayMs: Number(e.target.value) })}
          />
          <span className="settings-hint">
            Fonctionne pour les QCM enregistrés dans « Mes QCM », dans l'ordre de la liste. Une
            barre fine montre le temps restant ; relancer le défilement ou changer de QCM annule le
            passage automatique.
          </span>
        </label>
      )}
    </section>
  );
}
