import { useId } from "react";

interface Props {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  error?: string;
}

function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  isRequired = true,
  isDisabled = false,
  error,
}: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={isRequired}
        disabled={isDisabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded-lg border border-line-strong px-3 py-2 focus:border-brand focus:outline-none disabled:bg-field disabled:text-muted"
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
