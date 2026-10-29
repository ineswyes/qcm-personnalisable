export interface OptionConfig {
  id: string;
  text: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  /** Photo facultative (identifiant dans le stockage des photos du navigateur) */
  imageId?: string;
}

/** Ancienne police par défaut : les cases qui l'utilisent passent à Nunito */
const LEGACY_DEFAULT_FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';
export const DEFAULT_FONT = 'Nunito, system-ui, "Segoe UI", Roboto, sans-serif';

export function normalizeFont(fontFamily: string | undefined): string {
  return !fontFamily || fontFamily === LEGACY_DEFAULT_FONT ? DEFAULT_FONT : fontFamily;
}

export const FONT_OPTIONS = [
  { label: "Nunito, arrondie (par défaut)", value: DEFAULT_FONT },
  { label: "Système", value: "system-ui, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", sans-serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Comic Sans MS", value: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Brush Script", value: '"Brush Script MT", cursive' },
];

export type TriggerMode = "spaceEnter" | "anyKey";

export interface ScanSettings {
  speedMs: number;
  triggerMode: TriggerMode;
  /** Le contacteur lance aussi le défilement (vrai par défaut) */
  contactorStarts?: boolean;
  /** Pause après une réponse pendant laquelle le contacteur est ignoré (ms) */
  pauseMs?: number;
}

export const DEFAULT_PAUSE_MS = 1500;

export interface QuizConfig {
  question: string;
  options: OptionConfig[];
  scan: ScanSettings;
  speechEnabled: boolean;
}

/** Apparence commune à tous les QCM */
export interface Appearance {
  scanColor: string;
  selectedColor: string;
  ringWidth: number;
  /** Passer tout seul au QCM suivant après une réponse */
  autoNext: boolean;
  autoNextDelayMs: number;
  /** Lancer le défilement tout seul (entrée en Présentation, nouveau QCM) */
  autoStart: boolean;
  /** Réduire les textes sur les écrans plus petits qu'un ordinateur (iPad…) */
  fitToScreen: boolean;
}

export function defaultAppearance(): Appearance {
  return {
    scanColor: "#facc15",
    selectedColor: "#22c55e",
    ringWidth: 10,
    autoNext: false,
    autoNextDelayMs: 3000,
    autoStart: false,
    fitToScreen: true,
  };
}

/** Un QCM enregistré dans la liste « Mes QCM » */
export interface SavedQuiz {
  id: string;
  name: string;
  config: QuizConfig;
}

export function newQuizId() {
  return `qcm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Identifiants des photos utilisées par une configuration */
export function imageIdsOf(config: QuizConfig): string[] {
  return config.options.flatMap((opt) => (opt.imageId ? [opt.imageId] : []));
}

export const PALETTE = [
  { bg: "#2563eb", text: "#ffffff" },
  { bg: "#16a34a", text: "#ffffff" },
  { bg: "#ea580c", text: "#ffffff" },
  { bg: "#9333ea", text: "#ffffff" },
  { bg: "#dc2626", text: "#ffffff" },
  { bg: "#0891b2", text: "#ffffff" },
];

export function makeOption(index: number, text?: string): OptionConfig {
  const color = PALETTE[index % PALETTE.length];
  return {
    id: `opt-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    text: text ?? `Option ${index + 1}`,
    bgColor: color.bg,
    textColor: color.text,
    fontSize: 32,
    fontFamily: FONT_OPTIONS[0].value,
  };
}

export function defaultConfig(): QuizConfig {
  return {
    question: "Votre question ici",
    options: [makeOption(0), makeOption(1), makeOption(2), makeOption(3)],
    scan: {
      speedMs: 1200,
      triggerMode: "spaceEnter",
      contactorStarts: true,
      pauseMs: DEFAULT_PAUSE_MS,
    },
    speechEnabled: true,
  };
}
