import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { AVATAR_ACCEPT } from "../utils/validate-avatar-file.ts";

interface AvatarDropzoneProps {
  onFile: (file: File) => void;
  isDisabled: boolean;
}

// Takes a photo dropped onto it or picked with "Choose a file". The file input
// is visually hidden but stays keyboard-focusable; its label is the button.
function AvatarDropzone({ onFile, isDisabled }: AvatarDropzoneProps) {
  const inputId = useId();
  const hintId = useId();
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    // Without preventDefault the browser opens the dropped file instead.
    event.preventDefault();
    if (isDisabled) return;
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Moving between children fires dragleave on the zone; ignore those.
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file && !isDisabled) onFile(file);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    event.target.value = "";
    if (file) onFile(file);
  }

  const zoneColors = isDragging
    ? "border-brand bg-tint"
    : "border-line-strong bg-panel";

  return (
    <div
      data-testid="avatar-dropzone"
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${zoneColors}`}
    >
      <Upload
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-8 text-muted"
      />
      <p className="text-sm text-ink">Drag a photo here, or</p>
      <input
        id={inputId}
        type="file"
        accept={AVATAR_ACCEPT}
        aria-describedby={hintId}
        disabled={isDisabled}
        onChange={handleChange}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className="cursor-pointer rounded-lg bg-brand px-4 py-2 font-medium text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-50 hover:bg-brand-strong"
      >
        Choose a file
      </label>
      <p id={hintId} className="text-xs text-muted">
        JPG or PNG, up to 4 MB. 320 × 320 px recommended.
      </p>
    </div>
  );
}

export default AvatarDropzone;
