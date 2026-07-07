import type { OptionConfig } from "../types";

interface OptionCardProps {
  option: OptionConfig;
  highlighted: boolean;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ option, highlighted, selected, onClick }: OptionCardProps) {
  const classes = ["option-card"];
  if (highlighted) classes.push("option-card--highlighted");
  if (selected) classes.push("option-card--selected");

  return (
    <button
      type="button"
      className={classes.join(" ")}
      style={{
        backgroundColor: option.bgColor,
        color: option.textColor,
        fontSize: `${option.fontSize}px`,
      }}
      onClick={onClick}
    >
      {option.text}
    </button>
  );
}
