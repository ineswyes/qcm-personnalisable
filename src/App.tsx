import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { QuizGrid } from "./components/QuizGrid";
import { QuizLibrary } from "./components/QuizLibrary";
import { SettingsPanel } from "./components/SettingsPanel";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useScanning } from "./hooks/useScanning";
import { useSpeech } from "./hooks/useSpeech";
import { deleteUnusedImages } from "./lib/imageStore";
import { exportList, exportSingle, readImportFile } from "./lib/transfer";
import { defaultConfig, imageIdsOf, newQuizId } from "./types";
import type { QuizConfig, SavedQuiz } from "./types";

type Mode = "play" | "settings";

const STORAGE_KEY = "qcm-personnalisable-config";
const LIBRARY_KEY = "qcm-personnalisable-mes-qcm";
const ACTIVE_KEY = "qcm-personnalisable-qcm-affiche";

function cloneConfig(config: QuizConfig): QuizConfig {
  return JSON.parse(JSON.stringify(config)) as QuizConfig;
}

export default function App() {
  const [config, setConfig] = useLocalStorage<QuizConfig>(STORAGE_KEY, defaultConfig);
  const [quizzes, setQuizzes] = useLocalStorage<SavedQuiz[]>(LIBRARY_KEY, () => []);
  const [activeQuizId, setActiveQuizId] = useLocalStorage<string | null>(ACTIVE_KEY, () => null);
  const [mode, setMode] = useState<Mode>("play");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scanIndex = useScanning(config.options.length, config.scan.speedMs, isScanning);
  const speak = useSpeech();

  const activeIndex = quizzes.findIndex((quiz) => quiz.id === activeQuizId);
  const activeQuiz = activeIndex >= 0 ? quizzes[activeIndex] : null;
  const isDirty = useMemo(
    () => !!activeQuiz && JSON.stringify(activeQuiz.config) !== JSON.stringify(config),
    [activeQuiz, config],
  );

  // Nettoyage des photos qui ne servent plus (après suppression d'une photo ou d'un QCM)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const used = new Set([
        ...imageIdsOf(config),
        ...quizzes.flatMap((quiz) => imageIdsOf(quiz.config)),
      ]);
      deleteUnusedImages(used).catch(() => {});
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [config, quizzes]);

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

  // ----- Mes QCM -----

  function confirmLeaveUnsaved() {
    if (!isDirty || !activeQuiz) return true;
    return window.confirm(
      `Le QCM « ${activeQuiz.name} » a des modifications non enregistrées. Les abandonner ?`,
    );
  }

  function loadQuiz(id: string) {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) return;
    if (id !== activeQuizId && !confirmLeaveUnsaved()) return;
    setIsScanning(false);
    setSelectedId(null);
    setConfig(cloneConfig(quiz.config));
    setActiveQuizId(quiz.id);
  }

  function saveNewQuiz(name: string) {
    const quiz: SavedQuiz = { id: newQuizId(), name, config: cloneConfig(config) };
    setQuizzes([...quizzes, quiz]);
    setActiveQuizId(quiz.id);
  }

  function saveChanges(name: string) {
    if (!activeQuiz) return;
    setQuizzes(
      quizzes.map((quiz) =>
        quiz.id === activeQuiz.id ? { ...quiz, name, config: cloneConfig(config) } : quiz,
      ),
    );
  }

  function renameQuiz(id: string, name: string) {
    setQuizzes(quizzes.map((quiz) => (quiz.id === id ? { ...quiz, name } : quiz)));
  }

  function deleteQuiz(id: string) {
    setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
    if (id === activeQuizId) setActiveQuizId(null);
  }

  function moveQuiz(id: string, direction: -1 | 1) {
    const index = quizzes.findIndex((quiz) => quiz.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= quizzes.length) return;
    const next = [...quizzes];
    [next[index], next[target]] = [next[target], next[index]];
    setQuizzes(next);
  }

  function goToQuiz(event: MouseEvent<HTMLButtonElement>, index: number) {
    // Évite qu'un appui sur Espace / Entrée (contacteur) ne re-clique ce bouton
    event.currentTarget.blur();
    const quiz = quizzes[index];
    if (quiz) loadQuiz(quiz.id);
  }

  // ----- Export / import -----

  function handleExport() {
    exportSingle(config).catch(() => window.alert("L'export a échoué."));
  }

  function handleExportList() {
    exportList(quizzes).catch(() => window.alert("L'export a échoué."));
  }

  async function handleImport(file: File, target: "single" | "list") {
    try {
      const result = await readImportFile(file);
      if (result.kind === "list") {
        setQuizzes((current) => [...current, ...result.quizzes]);
        window.alert(`${result.quizzes.length} QCM ajouté(s) à la liste « Mes QCM ».`);
      } else if (target === "list") {
        const name = file.name.replace(/\.json$/i, "") || "QCM importé";
        setQuizzes((current) => [...current, { id: newQuizId(), name, config: result.config }]);
        window.alert(`« ${name} » a été ajouté à la liste « Mes QCM ».`);
      } else {
        if (!confirmLeaveUnsaved()) return;
        setConfig(result.config);
        setActiveQuizId(null);
      }
    } catch {
      window.alert("Fichier de configuration invalide.");
    }
  }

  function handleReset() {
    if (window.confirm("Réinitialiser la configuration aux valeurs par défaut ?")) {
      setConfig(defaultConfig());
      setActiveQuizId(null);
    }
  }

  const selectedOption = config.options.find((opt) => opt.id === selectedId) ?? null;

  return (
    <div className={mode === "play" ? "app app--play" : "app"}>
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
          {quizzes.length > 0 && (
            <div className="quiz-nav">
              <button
                type="button"
                className="button-secondary"
                onClick={(e) => goToQuiz(e, activeIndex - 1)}
                disabled={activeIndex <= 0}
              >
                ◀ QCM précédent
              </button>
              <span className="quiz-nav__label">
                {activeQuiz
                  ? `${activeQuiz.name} (${activeIndex + 1} / ${quizzes.length})`
                  : `QCM non enregistré · ${quizzes.length} dans Mes QCM`}
              </span>
              <button
                type="button"
                className="button-secondary"
                onClick={(e) => goToQuiz(e, activeIndex + 1)}
                disabled={activeIndex >= quizzes.length - 1}
              >
                QCM suivant ▶
              </button>
            </div>
          )}

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
          onImport={(file) => handleImport(file, "single")}
          onReset={handleReset}
          librarySection={
            <QuizLibrary
              quizzes={quizzes}
              activeQuiz={activeQuiz}
              isDirty={isDirty}
              onSaveNew={saveNewQuiz}
              onSaveChanges={saveChanges}
              onLoad={loadQuiz}
              onRename={renameQuiz}
              onDelete={deleteQuiz}
              onMove={moveQuiz}
              onExportList={handleExportList}
              onImport={(file) => handleImport(file, "list")}
            />
          }
        />
      )}
    </div>
  );
}
