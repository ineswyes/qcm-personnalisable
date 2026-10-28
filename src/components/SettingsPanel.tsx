import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { useRef } from "react";
import type { OptionConfig, QuizConfig, TriggerMode } from "../types";
import { DEFAULT_PAUSE_MS, FONT_OPTIONS, makeOption, normalizeFont } from "../types";
import { PhotoPicker } from "./PhotoPicker";

interface SettingsPanelProps {
  config: QuizConfig;
  onChange: Dispatch<SetStateAction<QuizConfig>>;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  /** Section « Mes QCM », affichée en haut des réglages */
  librarySection?: ReactNode;
}

export function SettingsPanel({
  config,
  onChange,
  onExport,
  onImport,
  onReset,
  librarySection,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateOption(id: string, patch: Partial<OptionConfig>) {
    // Mise à jour à partir de la version la plus récente (une photo peut finir
    // de se charger après d'autres modifications)
    onChange((current) => ({
      ...current,
      options: current.options.map((opt) => (opt.id === id ? { ...opt, ...patch } : opt)),
    }));
  }

  function addOption() {
    onChange({
      ...config,
      options: [...config.options, makeOption(config.options.length)],
    });
  }

  function removeOption(id: string) {
    if (config.options.length <= 2) return;
    onChange({
      ...config,
      options: config.options.filter((opt) => opt.id !== id),
    });
  }

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = "";
  }

  return (
    <div className="settings-panel">
      {librarySection}

      <section className="settings-section">
        <h2>Question</h2>
        <input
          type="text"
          className="settings-question-input"
          value={config.question}
          onChange={(e) => onChange({ ...config, question: e.target.value })}
        />
      </section>

      <section className="settings-section">
        <h2>Voix</h2>
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={config.speechEnabled}
            onChange={(e) => onChange({ ...config, speechEnabled: e.target.checked })}
          />
          Lire le texte à voix haute lors de la sélection d'une case
        </label>
      </section>

      <section className="settings-section">
        <h2>Défilement</h2>
        <label className="settings-row">
          Vitesse du défilement ({config.scan.speedMs} ms par case)
          <input
            type="range"
            min={300}
            max={4000}
            step={100}
            value={config.scan.speedMs}
            onChange={(e) =>
              onChange({ ...config, scan: { ...config.scan, speedMs: Number(e.target.value) } })
            }
          />
        </label>
        <label className="settings-row">
          Déclencheur du contacteur
          <select
            value={config.scan.triggerMode}
            onChange={(e) =>
              onChange({ ...config, scan: { ...config.scan, triggerMode: e.target.value as TriggerMode } })
            }
          >
            <option value="spaceEnter">Espace / Entrée uniquement</option>
            <option value="anyKey">N'importe quelle touche (compatibilité max)</option>
          </select>
        </label>
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={config.scan.contactorStarts ?? true}
            onChange={(e) =>
              onChange({ ...config, scan: { ...config.scan, contactorStarts: e.target.checked } })
            }
          />
          Le contacteur lance aussi le défilement (en Mode Jeu)
        </label>
        {(config.scan.contactorStarts ?? true) && (
          <label className="settings-row">
            Pause après une réponse : {((config.scan.pauseMs ?? DEFAULT_PAUSE_MS) / 1000).toLocaleString("fr-FR")} s
            <input
              type="range"
              min={0}
              max={10000}
              step={500}
              value={config.scan.pauseMs ?? DEFAULT_PAUSE_MS}
              onChange={(e) =>
                onChange({ ...config, scan: { ...config.scan, pauseMs: Number(e.target.value) } })
              }
            />
            <span className="settings-hint">
              Pendant ce temps, la réponse choisie reste affichée et le contacteur est ignoré, pour
              éviter de relancer le défilement par erreur.
            </span>
          </label>
        )}
      </section>

      <section className="settings-section">
        <h2>Cases ({config.options.length})</h2>
        <div className="option-editors">
          {config.options.map((option, index) => (
            <div className="option-editor" key={option.id}>
              <span className="option-editor__index">Case {index + 1}</span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, { text: e.target.value })}
                placeholder="Texte"
              />
              <label>
                Fond
                <input
                  type="color"
                  value={option.bgColor}
                  onChange={(e) => updateOption(option.id, { bgColor: e.target.value })}
                />
              </label>
              <label>
                Texte
                <input
                  type="color"
                  value={option.textColor}
                  onChange={(e) => updateOption(option.id, { textColor: e.target.value })}
                />
              </label>
              <label>
                Taille ({option.fontSize}px)
                <input
                  type="range"
                  min={12}
                  max={96}
                  value={option.fontSize}
                  onChange={(e) => updateOption(option.id, { fontSize: Number(e.target.value) })}
                />
              </label>
              <label>
                Police
                <select
                  value={normalizeFont(option.fontFamily)}
                  style={{ fontFamily: normalizeFont(option.fontFamily) }}
                  onChange={(e) => updateOption(option.id, { fontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
              <PhotoPicker
                imageId={option.imageId}
                onChange={(imageId) => updateOption(option.id, { imageId })}
              />
              <button
                type="button"
                className="button-danger"
                onClick={() => removeOption(option.id)}
                disabled={config.options.length <= 2}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="button-secondary" onClick={addOption}>
          + Ajouter une case
        </button>
      </section>

      <section className="settings-section">
        <h2>Sauvegarde</h2>
        <p className="settings-hint">
          Le QCM affiché est enregistré automatiquement dans ce navigateur. Vous pouvez aussi
          l'exporter seul dans un fichier (photos comprises) pour le réutiliser ailleurs, ou en
          importer un. Pour transférer tous vos QCM d'un coup, utilisez « Exporter toute la liste »
          dans Mes QCM.
        </p>
        <div className="settings-actions">
          <button type="button" className="button-secondary" onClick={onExport}>
            Exporter ce QCM (fichier .json)
          </button>
          <button type="button" className="button-secondary" onClick={() => fileInputRef.current?.click()}>
            Importer un fichier
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleImportChange}
          />
          <button type="button" className="button-danger" onClick={onReset}>
            Réinitialiser
          </button>
        </div>
      </section>
    </div>
  );
}
