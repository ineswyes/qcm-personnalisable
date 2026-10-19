import type { OptionConfig } from "../types";
import { OptionCard } from "./OptionCard";

interface QuizGridProps {
  options: OptionConfig[];
  isScanning: boolean;
  scanIndex: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QuizGrid({ options, isScanning, scanIndex, selectedId, onSelect }: QuizGridProps) {
  // Répartit les cases en grille la plus carrée possible (ex. 4 cases = 2 x 2)
  // pour qu'elles occupent tout l'espace disponible.
  const count = options.length;
  const columns = count <= 3 ? count : Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);

  return (
    <div
      className="quiz-grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option, index) => (
        <OptionCard
          key={option.id}
          option={option}
          highlighted={isScanning && index === scanIndex}
          selected={selectedId === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}
