import React from "react";
import { Logo } from "./Logo";

type AuthStatusErrorPanelProps = {
  message: string;
  onRetry: () => void | Promise<void>;
  fullScreen?: boolean;
};

export const AuthStatusErrorPanel: React.FC<AuthStatusErrorPanelProps> = ({
  message,
  onRetry,
  fullScreen = false,
}) => {
  const panel = (
    <div className="auth-panel text-sm" role="alert">
      <div className="text-slate-700 dark:text-neutral-200">{message}</div>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="ui-button-primary w-full"
      >
        Try again
      </button>
    </div>
  );

  if (!fullScreen) {
    return <div className="max-w-lg">{panel}</div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <Logo className="mx-auto h-12 w-auto" />
        {panel}
      </div>
    </div>
  );
};
