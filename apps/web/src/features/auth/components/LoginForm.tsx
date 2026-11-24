import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { login } from "../auth-service.ts";
import { parseApiError, type ParsedApiError } from "../../../shared/api/api-errors.ts";
import { getString } from "../../../shared/utils/form-data.ts";
import FormField from "../../../shared/components/FormField.tsx";
import FormError from "../../../shared/components/FormError.tsx";

const NO_ERRORS: ParsedApiError = { fieldErrors: {} };

function LoginForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ParsedApiError>(NO_ERRORS);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError(NO_ERRORS);

    try {
      await login({
        username: getString(formData, "username"),
        password: getString(formData, "password"),
      });
      await navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(parseApiError(err));
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <h1 className="text-2xl font-semibold">Log in</h1>
      <FormError message={error.message} />
      <FormField
        label="Username"
        name="username"
        autoComplete="username"
        error={error.fieldErrors.username}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={error.fieldErrors.password}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export default LoginForm;
