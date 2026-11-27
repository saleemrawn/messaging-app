import { useId, useState, type SubmitEvent } from "react";
import { useRevalidator } from "react-router";
import { updateProfile } from "../profile-service.ts";
import {
  parseApiError,
  type ParsedApiError,
} from "../../../shared/api/api-errors.ts";
import { getString } from "../../../shared/utils/form-data.ts";
import { showSuccessToast } from "../../../shared/utils/toast.ts";
import FormField from "../../../shared/components/FormField.tsx";
import FormError from "../../../shared/components/FormError.tsx";
import type { User } from "../../auth/types.ts";

const PROFILE_SAVED_MESSAGE = "Profile updated";

interface Props {
  user: User;
  onCancel: () => void;
  onSaved: () => void;
}

const NO_ERRORS: ParsedApiError = { fieldErrors: {} };
const PASSWORD_FIELDS = [
  "currentPassword",
  "newPassword",
  "confirmNewPassword",
] as const;

function hasPasswordError({ fieldErrors }: ParsedApiError): boolean {
  return PASSWORD_FIELDS.some((name) => fieldErrors[name] !== undefined);
}

// The inputs are uncontrolled, so the password fields are cleared on the DOM.
function clearPasswordFields(form: HTMLFormElement) {
  for (const name of PASSWORD_FIELDS) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement) field.value = "";
  }
}

function EditProfileForm({ user, onCancel, onSaved }: Props) {
  const { revalidate } = useRevalidator();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ParsedApiError>(NO_ERRORS);
  const passwordHintId = useId();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Kept for after the await: React clears event.currentTarget by then.
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setError(NO_ERRORS);

    try {
      await updateProfile(user.id, {
        firstName: getString(formData, "firstName"),
        lastName: getString(formData, "lastName"),
        email: getString(formData, "email"),
        currentPassword: getString(formData, "currentPassword"),
        newPassword: getString(formData, "newPassword"),
        confirmNewPassword: getString(formData, "confirmNewPassword"),
      });
    } catch (err: unknown) {
      const parsedError = parseApiError(err);
      // The password fields go together, so a problem with any of them means
      // retyping all three.
      if (hasPasswordError(parsedError)) clearPasswordFields(form);
      setError(parsedError);
      setIsSubmitting(false);
      return;
    }

    // Reloads the current user so the page and sidebar show the new details.
    await revalidate();
    showSuccessToast(PROFILE_SAVED_MESSAGE);
    onSaved();
  }

  const { fieldErrors } = error;

  return (
    <form
      aria-label="Edit profile"
      className="flex w-full max-w-2xl flex-col gap-4 text-left"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <FormError message={error.message} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          defaultValue={user.firstName}
          error={fieldErrors.firstName}
        />
        <FormField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          defaultValue={user.lastName}
          error={fieldErrors.lastName}
        />
      </div>
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={user.email}
        error={fieldErrors.email}
      />
      <FormField
        label="Username"
        name="username"
        autoComplete="username"
        defaultValue={user.username}
        isDisabled
      />

      <fieldset
        aria-describedby={passwordHintId}
        className="mt-2 flex flex-col gap-4 border-t border-line pt-4"
      >
        <legend className="pt-4 text-base font-semibold text-ink">
          Change password
        </legend>
        <p id={passwordHintId} className="-mt-2 text-sm text-muted">
          Leave blank to keep your current password.
        </p>
        <FormField
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          isRequired={false}
          error={fieldErrors.currentPassword}
        />
        <FormField
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          isRequired={false}
          error={fieldErrors.newPassword}
        />
        <FormField
          label="Confirm new password"
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          isRequired={false}
          error={fieldErrors.confirmNewPassword}
        />
      </fieldset>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-line-strong px-4 py-2 font-medium text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default EditProfileForm;
