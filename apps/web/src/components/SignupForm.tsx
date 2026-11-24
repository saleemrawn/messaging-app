import { useState, type SubmitEvent } from "react";
import { signup } from "../auth/auth-service.ts";
import { parseApiError, type ParsedApiError } from "../utils/api-errors.ts";
import { getString } from "../utils/form-data.ts";
import FormField from "./FormField.tsx";
import FormError from "./FormError.tsx";

interface Props {
  onSuccess: () => void;
}

const NO_ERRORS: ParsedApiError = { fieldErrors: {} };

function SignupForm({ onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ParsedApiError>(NO_ERRORS);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError(NO_ERRORS);

    try {
      await signup({
        firstName: getString(formData, "firstName"),
        lastName: getString(formData, "lastName"),
        email: getString(formData, "email"),
        username: getString(formData, "username"),
        password: getString(formData, "password"),
      });
      onSuccess();
    } catch (err: unknown) {
      setError(parseApiError(err));
      setIsSubmitting(false);
    }
  }

  const { fieldErrors } = error;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <FormError message={error.message} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          error={fieldErrors.firstName}
        />
        <FormField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          error={fieldErrors.lastName}
        />
      </div>
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <FormField
        label="Username"
        name="username"
        autoComplete="username"
        error={fieldErrors.username}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Signing up…" : "Sign up"}
      </button>
    </form>
  );
}

export default SignupForm;
