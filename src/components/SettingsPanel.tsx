import type { ChangeEvent } from "react";
import { useRef } from "react";
import type { OptionConfig, QuizConfig, TriggerMode } from "../types";
import { FONT_OPTIONS, makeOption } from "../types";

interface SettingsPanelProps {
  config: QuizConfig;
  onChange: (config: QuizConfig) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export function SettingsPanel({ config, onChange, onExport, onImport, onReset }: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateOption(id: string, patch: Partial<OptionConfig>) {
    onChange({
      ...config,
      options: config.options.map((opt) => (opt.id === id ? { ...opt, ...patch } : opt)),
    });
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
                  value={option.fontFamily}
                  style={{ fontFamily: option.fontFamily }}
                  onChange={(e) => updateOption(option.id, { fontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
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
          La configuration est enregistrée automatiquement dans ce navigateur. Vous pouvez aussi
          exporter un fichier pour la réutiliser ailleurs, ou en importer une.
        </p>
        <div className="settings-actions">
          <button type="button" className="button-secondary" onClick={onExport}>
            Exporter (fichier .json)
          </button>
          <button type="button" className="button-secondary" onClick={() => fileInputRef.current?.click()}>
            Importer un fichier
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
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
