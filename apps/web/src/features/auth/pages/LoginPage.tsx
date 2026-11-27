import { useState } from "react";
import { useLocation } from "react-router";
import SignupForm from "../components/SignupForm.tsx";
import LoginForm from "../components/LoginForm.tsx";
import type { AuthMode, LoginPageState } from "../types.ts";
import PageTitle, { APP_NAME } from "../../../shared/components/PageTitle.tsx";

// Navigation state is untrusted (it survives reloads via history), so only
// an explicit "login" request overrides the sign-up default.
function initialMode(state: unknown): AuthMode {
  const requested = (state as Partial<LoginPageState> | null)?.mode;
  return requested === "login" ? "login" : "signup";
}

function LoginPage() {
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>(() => initialMode(location.state));
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  function handleSignupSuccess() {
    setIsAccountCreated(true);
    setMode("login");
  }

  function switchTo(nextMode: AuthMode) {
    setIsAccountCreated(false);
    setMode(nextMode);
  }

  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <PageTitle name={isSignup ? "Sign up" : "Login"} />
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <p className="font-serif text-[30px] text-ink">{APP_NAME}</p>
        <div className="w-full rounded-xl border border-line bg-canvas p-8 shadow-sm">
          {isAccountCreated && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              Account created, please log in.
            </p>
          )}
          {isSignup ? (
            <SignupForm onSuccess={handleSignupSuccess} />
          ) : (
            <LoginForm />
          )}
          <p className="mt-6 text-center text-sm text-muted">
            <button
              type="button"
              className="text-brand hover:underline"
              onClick={() => {
                switchTo(isSignup ? "login" : "signup");
              }}
            >
              {isSignup
                ? "Already have an account? Log in"
                : "Need an account? Sign up"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
