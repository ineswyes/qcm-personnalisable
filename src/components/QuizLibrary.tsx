import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import type { SavedQuiz } from "../types";

interface QuizLibraryProps {
  quizzes: SavedQuiz[];
  activeQuiz: SavedQuiz | null;
  isDirty: boolean;
  onSaveNew: (name: string) => void;
  onSaveChanges: (name: string) => void;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onExportList: () => void;
  onImport: (file: File) => void;
}

function SaveForm({
  activeQuiz,
  isDirty,
  onSaveNew,
  onSaveChanges,
}: Pick<QuizLibraryProps, "activeQuiz" | "isDirty" | "onSaveNew" | "onSaveChanges">) {
  const [name, setName] = useState(activeQuiz?.name ?? "");
  const trimmed = name.trim();
  const renamed = !!activeQuiz && trimmed !== "" && trimmed !== activeQuiz.name;

  return (
    <div className="library-save">
      <p className="library-current">
        QCM affiché :{" "}
        {activeQuiz ? (
          <>
            <strong>{activeQuiz.name}</strong>
            {isDirty && <span className="library-badge">modifications non enregistrées</span>}
          </>
        ) : (
          <em>pas encore enregistré dans la liste</em>
        )}
      </p>
      <label className="settings-row">
        Nom du QCM
        <input
          type="text"
          className="settings-question-input"
          value={name}
          placeholder="Ex. Konbini 1 – Café ou thé"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="settings-actions">
        {activeQuiz && (
          <button
            type="button"
            className="button-primary"
            disabled={!isDirty && !renamed}
            onClick={() => onSaveChanges(trimmed || activeQuiz.name)}
          >
            Enregistrer les modifications
          </button>
        )}
        <button
          type="button"
          className={activeQuiz ? "button-secondary" : "button-primary"}
          disabled={trimmed === ""}
          onClick={() => onSaveNew(trimmed)}
        >
          {activeQuiz ? "Enregistrer comme nouveau QCM" : "Enregistrer dans Mes QCM"}
        </button>
      </div>
      {trimmed === "" && <p className="settings-hint">Donnez un nom au QCM pour l'enregistrer.</p>}
    </div>
  );
}

export function QuizLibrary(props: QuizLibraryProps) {
  const { quizzes, activeQuiz, onLoad, onRename, onDelete, onMove, onExportList, onImport } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = "";
  }

  function rename(quiz: SavedQuiz) {
    const name = window.prompt("Nouveau nom du QCM :", quiz.name);
    if (name && name.trim()) onRename(quiz.id, name.trim());
  }

  function remove(quiz: SavedQuiz) {
    if (window.confirm(`Supprimer « ${quiz.name} » de Mes QCM ?`)) onDelete(quiz.id);
  }

  return (
    <section className="settings-section">
      <h2>Mes QCM ({quizzes.length})</h2>

      <SaveForm
        key={activeQuiz?.id ?? "nouveau"}
        activeQuiz={activeQuiz}
        isDirty={props.isDirty}
        onSaveNew={props.onSaveNew}
        onSaveChanges={props.onSaveChanges}
      />

      {quizzes.length === 0 ? (
        <p className="settings-hint">
          Aucun QCM enregistré pour l'instant. Préparez un QCM ci-dessous, donnez-lui un nom puis
          enregistrez-le : il apparaîtra ici.
        </p>
      ) : (
        <ol className="library-list">
          {quizzes.map((quiz, index) => {
            const isActive = quiz.id === activeQuiz?.id;
            return (
              <li
                key={quiz.id}
                className={isActive ? "library-item library-item--active" : "library-item"}
              >
                <span className="library-item__index">{index + 1}</span>
                <span className="library-item__name">
                  {quiz.name}
                  {isActive && <span className="library-badge library-badge--active">affiché</span>}
                </span>
                <div className="library-item__actions">
                  <button
                    type="button"
                    className="button-secondary button-small"
                    onClick={() => onLoad(quiz.id)}
                  >
                    Charger
                  </button>
                  <button
                    type="button"
                    className="button-secondary button-small"
                    onClick={() => rename(quiz)}
                  >
                    Renommer
                  </button>
                  <button
                    type="button"
                    className="button-secondary button-small"
                    onClick={() => onMove(quiz.id, -1)}
                    disabled={index === 0}
                    aria-label="Monter"
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button-secondary button-small"
                    onClick={() => onMove(quiz.id, 1)}
                    disabled={index === quizzes.length - 1}
                    aria-label="Descendre"
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="button-danger button-small"
                    onClick={() => remove(quiz)}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="settings-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onExportList}
          disabled={quizzes.length === 0}
        >
          Exporter toute la liste (avec photos)
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Importer une liste
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportChange}
        />
      </div>
    </section>
  );
}
