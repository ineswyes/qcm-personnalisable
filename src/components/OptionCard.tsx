import { useImageUrl } from "../hooks/useImageUrl";
import type { OptionConfig } from "../types";

interface OptionCardProps {
  option: OptionConfig;
  highlighted: boolean;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ option, highlighted, selected, onClick }: OptionCardProps) {
  const imageUrl = useImageUrl(option.imageId);

  const classes = ["option-card"];
  if (highlighted) classes.push("option-card--highlighted");
  if (selected) classes.push("option-card--selected");
  if (option.imageId) classes.push("option-card--with-photo");

  return (
    <button
      type="button"
      className={classes.join(" ")}
      style={{
        backgroundColor: option.bgColor,
        color: option.textColor,
        fontSize: `${option.fontSize}px`,
        fontFamily: option.fontFamily,
      }}
      onClick={onClick}
    >
      {option.imageId ? (
        <>
          <span className="option-card__photo">
            {imageUrl && <img src={imageUrl} alt="" draggable={false} />}
          </span>
          {option.text && <span className="option-card__text">{option.text}</span>}
        </>
      ) : (
        option.text
      )}
    </button>
  );
}
