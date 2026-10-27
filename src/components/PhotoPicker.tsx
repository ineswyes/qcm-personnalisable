import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useImageUrl } from "../hooks/useImageUrl";
import { addPhoto } from "../lib/imageStore";

interface PhotoPickerProps {
  imageId: string | undefined;
  onChange: (imageId: string | undefined) => void;
}

/** Boutons « Ajouter une photo » / « Retirer la photo » d'une case */
export function PhotoPicker({ imageId, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const imageUrl = useImageUrl(imageId);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange(await addPhoto(file));
    } catch {
      window.alert(
        "Impossible d'utiliser cette photo. Essayez une image au format JPEG ou PNG.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="photo-picker">
      <div className="photo-picker__thumb">
        {imageUrl ? <img src={imageUrl} alt="Photo de la case" /> : <span>Pas de photo</span>}
      </div>
      <div className="photo-picker__buttons">
        <button
          type="button"
          className="button-secondary button-small"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Chargement…" : imageId ? "Changer la photo" : "Ajouter une photo"}
        </button>
        {imageId && (
          <button
            type="button"
            className="button-danger button-small"
            onClick={() => onChange(undefined)}
          >
            Retirer la photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}
