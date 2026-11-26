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
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width]"
          style={{ width: `${String(percent)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">Uploading… {percent}%</p>
    </div>
  );
}

export default UploadProgress;
