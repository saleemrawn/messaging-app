import { useCallback, useId, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { AVATAR_SIZE_PX } from "../utils/validate-avatar-file.ts";
import UploadProgress from "./UploadProgress.tsx";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;

interface AvatarCropperProps {
  imageUrl: string;
  isUploading: boolean;
  progress: number;
  onChooseAnother: () => void;
  onSave: (area: Area) => void;
}

// Lets the user drag and zoom a round 1:1 crop of their photo, then save it.
function AvatarCropper({
  imageUrl,
  isUploading,
  progress,
  onChooseAnother,
  onSave,
}: AvatarCropperProps) {
  const zoomId = useId();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  // The crop in the photo's own pixels; null until the photo has loaded.
  const [area, setArea] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  // The upload is scaled to 320 px, so a smaller crop gets stretched.
  const isLowResolution = area !== null && area.width < AVATAR_SIZE_PX;

  return (
    <>
      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-gray-900">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor={zoomId} className="text-sm font-medium text-gray-700">
          Zoom
        </label>
        <input
          id={zoomId}
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          disabled={isUploading}
          onChange={(event) => {
            setZoom(Number(event.target.value));
          }}
          className="flex-1 accent-blue-600"
        />
      </div>
      <p className="text-sm text-gray-500">Drag the photo to reposition it.</p>
      {isLowResolution && (
        <p className="text-sm text-amber-700">
          This crop is smaller than 320 × 320 px, so it may look blurry.
        </p>
      )}
      {isUploading && <UploadProgress percent={progress} />}
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={onChooseAnother}
          disabled={isUploading}
          className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          Choose another
        </button>
        <button
          type="button"
          onClick={() => {
            if (area) onSave(area);
          }}
          disabled={isUploading || area === null}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isUploading ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}

export default AvatarCropper;
