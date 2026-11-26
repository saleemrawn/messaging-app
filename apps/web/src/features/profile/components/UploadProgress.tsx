interface UploadProgressProps {
  percent: number;
}

function UploadProgress({ percent }: UploadProgressProps) {
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-chip"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${String(percent)}%` }}
        />
      </div>
      <p className="text-xs text-muted">Uploading… {percent}%</p>
    </div>
  );
}

export default UploadProgress;
