import { useState } from "react";
import SignupForm from "../components/SignupForm.tsx";
import LoginForm from "../components/LoginForm.tsx";

type Mode = "signup" | "login";

function LoginPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  function handleSignupSuccess() {
    setIsAccountCreated(true);
    setMode("login");
  }

  function switchTo(nextMode: Mode) {
    setIsAccountCreated(false);
    setMode(nextMode);
  }

  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        {isAccountCreated && (
          <p
            role="status"
            className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            Account created, please log in.
          </p>
        )}
        {isSignup ? (
          <SignupForm onSuccess={handleSignupSuccess} />
        ) : (
          <LoginForm />
        )}
        <p className="mt-6 text-center text-sm text-gray-600">
          <button
            type="button"
            className="text-blue-600 hover:underline"
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
    </main>
  );
}

export default LoginPage;
