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
  // An optional first line (before "\n") is the panel title.
  const [first, ...rest] = message.split("\n");
  const title = rest.length > 0 ? first : null;
  const body = rest.length > 0 ? rest.join("\n") : message;
  const panel = (
    <div className="auth-panel text-sm" role="alert">
      <div className="text-slate-700 dark:text-neutral-200">
        {title ? (
          <div className="mb-1 text-base font-bold text-slate-900 dark:text-neutral-100">
            {title}
          </div>
        ) : null}
        {body}
      </div>
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
