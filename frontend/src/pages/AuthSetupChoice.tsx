import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Shield, ShieldOff } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";
import { AuthStatusErrorPanel } from "../components/AuthStatusErrorPanel";

type Step = "choice" | "confirm-disable";

export const AuthSetupChoice: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading: authLoading,
    authEnabled,
    authStatusError,
    retryAuthStatus,
    bootstrapRequired,
    isAuthenticated,
    authOnboardingRequired,
    authOnboardingMode,
  } = useAuth();

  const [step, setStep] = useState<Step>("choice");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatusError) return;
    if (authLoading || authEnabled === null) return;
    if (authOnboardingRequired) return;

    if (!authEnabled) {
      navigate("/", { replace: true });
      return;
    }

    if (bootstrapRequired) {
      navigate("/register", { replace: true });
      return;
    }

    if (isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [
    authEnabled,
    authLoading,
    authOnboardingRequired,
    authStatusError,
    bootstrapRequired,
    isAuthenticated,
    navigate,
  ]);

  const isMigrationMode = authOnboardingMode === "migration";

  const applyChoice = async (enableAuth: boolean) => {
    setSubmitting(true);
    setError("");
    try {
      const response = await api.authOnboardingChoice(enableAuth);
      localStorage.setItem(
        "excalidash-auth-enabled",
        String(response.authEnabled),
      );

      if (response.authEnabled) {
        window.location.href = response.bootstrapRequired
          ? "/register"
          : "/login";
        return;
      }

      window.location.href = "/";
    } catch (err: unknown) {
      let message = "Failed to apply authentication choice";
      if (api.isAxiosError(err)) {
        message =
          err.response?.data?.message || err.response?.data?.error || message;
      }
      setError(message);
      setSubmitting(false);
    }
  };

  if (authLoading || authEnabled === null || !authOnboardingRequired) {
    if (authStatusError) {
      return (
        <AuthStatusErrorPanel
          message={authStatusError}
          onRetry={retryAuthStatus}
          fullScreen
        />
      );
    }
    return (
      <div className="auth-page">
        <div className="text-slate-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h1 className="auth-heading">
            {step === "choice"
              ? "Choose Authentication Mode"
              : "Keep Authentication Disabled?"}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {step === "choice"
              ? isMigrationMode
                ? "Existing data detected. Create an admin account and restrict access."
                : "Create an admin account and restrict access."
              : "Only use this on a trusted network."}
          </p>
        </div>

        <div className="auth-panel">
          {error && <div className="ui-alert-error">{error}</div>}

          {step === "choice" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  void applyChoice(true);
                }}
                className="ui-button-primary px-4 py-3"
              >
                <Shield size={18} />
                Enable Authentication
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep("confirm-disable")}
                className="ui-button-secondary px-4 py-3"
              >
                <ShieldOff size={18} />
                Keep Disabled
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 p-4 text-sm text-rose-900 dark:text-rose-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div>Anyone on this network can access every drawing.</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep("choice")}
                  className="ui-button-secondary px-4 py-3"
                >
                  Go Back
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    void applyChoice(false);
                  }}
                  className="ui-button-danger px-4 py-3"
                >
                  Disable Authentication
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
