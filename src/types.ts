export interface OptionConfig {
  id: string;
  text: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
}

export type TriggerMode = "spaceEnter" | "anyKey";

export interface ScanSettings {
  speedMs: number;
  triggerMode: TriggerMode;
}

export interface QuizConfig {
  question: string;
  options: OptionConfig[];
  scan: ScanSettings;
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
  };
}

export function defaultConfig(): QuizConfig {
  return {
    question: "Votre question ici",
    options: [makeOption(0), makeOption(1), makeOption(2), makeOption(3)],
    scan: {
      speedMs: 1200,
      triggerMode: "spaceEnter",
    },
  };
}
