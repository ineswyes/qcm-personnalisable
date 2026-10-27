// Export / import des QCM dans un fichier .json, photos comprises.
import type { QuizConfig, SavedQuiz } from "../types";
import { imageIdsOf, newQuizId } from "../types";
import { exportImages, importImages } from "./imageStore";

const LIST_FORMAT = "qcm-personnalisable-liste";

type ImportResult =
  | { kind: "single"; config: QuizConfig }
  | { kind: "list"; quizzes: SavedQuiz[] };

function download(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Exporte le QCM affiché (format d'origine + photos) */
export async function exportSingle(config: QuizConfig) {
  const images = await exportImages(imageIdsOf(config));
  download({ ...config, images }, "qcm-config.json");
}

/** Exporte toute la liste « Mes QCM » avec les photos */
export async function exportList(quizzes: SavedQuiz[]) {
  const images = await exportImages(quizzes.flatMap((quiz) => imageIdsOf(quiz.config)));
  const date = new Date().toISOString().slice(0, 10);
  download(
    {
      format: LIST_FORMAT,
      version: 1,
      quizzes: quizzes.map(({ name, config }) => ({ name, config })),
      images,
    },
    `mes-qcm-${date}.json`,
  );
}

function isConfig(value: unknown): value is QuizConfig {
  const v = value as QuizConfig | null;
  return !!v && typeof v === "object" && Array.isArray(v.options);
}

/** Lit un fichier exporté (QCM seul ou liste) et range ses photos */
export async function readImportFile(file: File): Promise<ImportResult> {
  const parsed = JSON.parse(await file.text());
  if (parsed?.images && typeof parsed.images === "object") {
    await importImages(parsed.images);
  }

  if (parsed?.format === LIST_FORMAT && Array.isArray(parsed.quizzes)) {
    const quizzes: SavedQuiz[] = parsed.quizzes
      .filter((quiz: { config?: unknown }) => isConfig(quiz?.config))
      .map((quiz: { name?: string; config: QuizConfig }) => ({
        id: newQuizId(),
        name: String(quiz.name || "QCM sans nom"),
        config: quiz.config,
      }));
    return { kind: "list", quizzes };
  }

  if (isConfig(parsed)) {
    const { images: _images, ...config } = parsed as QuizConfig & { images?: unknown };
    return { kind: "single", config };
  }

  throw new Error("invalid");
}
