import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { QuizGrid } from "./components/QuizGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useScanning } from "./hooks/useScanning";
import { useSpeech } from "./hooks/useSpeech";
import { defaultConfig } from "./types";
import type { QuizConfig } from "./types";

type Mode = "play" | "settings";

const STORAGE_KEY = "qcm-personnalisable-config";

export default function App() {
  const [config, setConfig] = useLocalStorage<QuizConfig>(STORAGE_KEY, defaultConfig);
  const [mode, setMode] = useState<Mode>("play");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scanIndex = useScanning(config.options.length, config.scan.speedMs, isScanning);
  const speak = useSpeech();

  const startScan = useCallback(() => {
    setSelectedId(null);
    setIsScanning(true);
  }, []);

  const stopScanAndSelect = useCallback(() => {
    setIsScanning(false);
    const option = config.options[scanIndex];
    if (!option) return;
    setSelectedId(option.id);
    if (config.speechEnabled) speak(option.text);
  }, [config.options, config.speechEnabled, scanIndex, speak]);

  const selectDirectly = useCallback(
    (id: string) => {
      setIsScanning(false);
      setSelectedId(id);
      const option = config.options.find((opt) => opt.id === id);
      if (option && config.speechEnabled) speak(option.text);
    },
    [config.options, config.speechEnabled, speak],
  );

  useEffect(() => {
    if (mode !== "play" || !isScanning) return;

    function handleKeyDown(event: KeyboardEvent) {
      const isTrigger =
        config.scan.triggerMode === "anyKey" || event.code === "Space" || event.code === "Enter";
      if (!isTrigger) return;
      event.preventDefault();
      stopScanAndSelect();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, isScanning, config.scan.triggerMode, stopScanAndSelect]);

  function handleExport() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qcm-config.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as QuizConfig;
        if (!parsed.options || !Array.isArray(parsed.options)) throw new Error("invalid");
        setConfig(parsed);
      } catch {
        window.alert("Fichier de configuration invalide.");
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (window.confirm("Réinitialiser la configuration aux valeurs par défaut ?")) {
      setConfig(defaultConfig());
    }
  }

  const selectedOption = config.options.find((opt) => opt.id === selectedId) ?? null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>QCM Personnalisable</h1>
        <nav className="mode-switch">
          <button
            type="button"
            className={mode === "play" ? "mode-switch__button mode-switch__button--active" : "mode-switch__button"}
            onClick={() => setMode("play")}
          >
            Mode Jeu
          </button>
          <button
            type="button"
            className={mode === "settings" ? "mode-switch__button mode-switch__button--active" : "mode-switch__button"}
            onClick={() => {
              setIsScanning(false);
              setMode("settings");
            }}
          >
            Réglages
          </button>
        </nav>
      </header>

      {mode === "play" ? (
        <main className="play-view">
          <h2 className="question">{config.question}</h2>

          <QuizGrid
            options={config.options}
            isScanning={isScanning}
            scanIndex={scanIndex}
            selectedId={selectedId}
            onSelect={selectDirectly}
          />

          <div className="play-controls">
            {!isScanning ? (
              <button type="button" className="button-primary" onClick={startScan}>
                Démarrer le défilement
              </button>
            ) : (
              <button type="button" className="button-contactor" onClick={stopScanAndSelect}>
                Contacteur (Espace / Entrée)
              </button>
            )}
          </div>

          <p className="status" role="status">
            {isScanning && "Défilement en cours — appuyez sur le contacteur pour valider."}
            {!isScanning && selectedOption && `Réponse sélectionnée : ${selectedOption.text}`}
            {!isScanning && !selectedOption && "Prêt. Cliquez sur une case ou démarrez le défilement."}
          </p>
        </main>
      ) : (
        <SettingsPanel
          config={config}
          onChange={setConfig}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
