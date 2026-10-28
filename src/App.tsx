import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { QuizGrid } from "./components/QuizGrid";
import { QuizLibrary } from "./components/QuizLibrary";
import { SettingsPanel } from "./components/SettingsPanel";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useScanning } from "./hooks/useScanning";
import { useSpeech } from "./hooks/useSpeech";
import { deleteUnusedImages } from "./lib/imageStore";
import { exportList, exportSingle, readImportFile } from "./lib/transfer";
import { DEFAULT_PAUSE_MS, defaultConfig, imageIdsOf, newQuizId } from "./types";
import type { QuizConfig, SavedQuiz } from "./types";

type Mode = "play" | "settings";

const STORAGE_KEY = "qcm-personnalisable-config";
const LIBRARY_KEY = "qcm-personnalisable-mes-qcm";
const ACTIVE_KEY = "qcm-personnalisable-qcm-affiche";
/** Anti-rebond : un 2e signal du contacteur juste après le lancement est ignoré */
const START_DEBOUNCE_MS = 400;
const NAV_KEYS = ["Escape", "ArrowLeft", "ArrowRight"];

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
  const [presenting, setPresenting] = useState(false);
  const [mouseActive, setMouseActive] = useState(false);

  // En mode Présentation il n'y a plus de bouton : le contacteur lance toujours le défilement
  const contactorStarts = (config.scan.contactorStarts ?? true) || presenting;
  const pauseMs = config.scan.pauseMs ?? DEFAULT_PAUSE_MS;
  // Moment jusqu'auquel le contacteur est ignoré (pause après une réponse)
  const lockedUntil = useRef(0);

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
    lockedUntil.current = Date.now() + START_DEBOUNCE_MS;
  }, []);

  const stopScanAndSelect = useCallback(() => {
    setIsScanning(false);
    lockedUntil.current = Date.now() + pauseMs;
    const option = config.options[scanIndex];
    if (!option) return;
    setSelectedId(option.id);
    if (config.speechEnabled) speak(option.text);
  }, [config.options, config.speechEnabled, scanIndex, speak, pauseMs]);

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
    if (mode !== "play") return;
    if (!isScanning && !contactorStarts) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Touches réservées à la navigation (Échap, flèches)
      if (NAV_KEYS.includes(event.key)) return;
      const isTrigger =
        config.scan.triggerMode === "anyKey" || event.code === "Space" || event.code === "Enter";
      if (!isTrigger) return;
      // Le contacteur ne doit pas « cliquer » le bouton qui a le focus
      event.preventDefault();
      // Touche maintenue enfoncée ou pause en cours : on ignore
      if (event.repeat || Date.now() < lockedUntil.current) return;
      if (isScanning) stopScanAndSelect();
      else startScan();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [mode, isScanning, contactorStarts, config.scan.triggerMode, stopScanAndSelect, startScan]);

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

  // ----- Mode Présentation -----

  function enterPresentation(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.blur();
    setIsScanning(false);
    setSelectedId(null);
    setPresenting(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function exitPresentation() {
    setPresenting(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  // Sortie du plein écran (Échap géré par le navigateur) = sortie du mode Présentation
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) setPresenting(false);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Flèches ← → : QCM précédent / suivant ; Échap : quitter la présentation
  const keyNavRef = useRef<(event: KeyboardEvent) => void>(() => {});
  keyNavRef.current = (event: KeyboardEvent) => {
    if (mode !== "play") return;
    if (event.key === "Escape" && presenting) {
      exitPresentation();
    } else if (event.key === "ArrowLeft" && activeIndex > 0) {
      event.preventDefault();
      loadQuiz(quizzes[activeIndex - 1].id);
    } else if (event.key === "ArrowRight" && activeIndex < quizzes.length - 1) {
      event.preventDefault();
      loadQuiz(quizzes[activeIndex + 1].id);
    }
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyNavRef.current(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // En présentation, le bouton « Quitter » et la souris n'apparaissent que si on bouge la souris
  useEffect(() => {
    if (!presenting) return;
    let timer = 0;
    function handleMove() {
      setMouseActive(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMouseActive(false), 2500);
    }
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.clearTimeout(timer);
      setMouseActive(false);
    };
  }, [presenting]);

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

  const grid = (
    <QuizGrid
      options={config.options}
      isScanning={isScanning}
      scanIndex={scanIndex}
      selectedId={selectedId}
      onSelect={selectDirectly}
    />
  );

  if (presenting) {
    return (
      <div
        className={
          mouseActive ? "app app--play app--presenting" : "app app--play app--presenting app--idle"
        }
      >
        {config.question.trim() && <h2 className="question">{config.question}</h2>}
        {grid}
        <button type="button" className="presentation-exit" onClick={exitPresentation}>
          ✕ Quitter la présentation (Échap)
        </button>
        <p className="visually-hidden" role="status">
          {selectedOption ? `Réponse sélectionnée : ${selectedOption.text}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className={mode === "play" ? "app app--play" : "app"}>
      <header className="app-header">
        <h1>QCM Personnalisable</h1>
        <nav className="mode-switch">
          {mode === "play" && (
            <button
              type="button"
              className="mode-switch__button mode-switch__button--present"
              onClick={enterPresentation}
              title="Plein écran, uniquement la question et les cases"
            >
              ⛶ Présentation
            </button>
          )}
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

          {grid}

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
            {!isScanning && selectedOption && contactorStarts && " — Contacteur : recommencer."}
            {!isScanning &&
              !selectedOption &&
              (contactorStarts
                ? "Prêt. Appuyez sur le contacteur pour lancer le défilement."
                : "Prêt. Cliquez sur une case ou démarrez le défilement.")}
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
