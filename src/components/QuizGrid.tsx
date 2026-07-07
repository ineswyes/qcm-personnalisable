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
  return (
    <div className="quiz-grid">
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
