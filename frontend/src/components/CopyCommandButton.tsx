import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export const CopyCommandButton: React.FC<{
  command: string;
  label?: string;
}> = ({ command, label = "Copy command" }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await copyText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; the command remains visible.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="ui-icon-button h-7 w-7 shrink-0 [@media(hover:none)]:h-11 [@media(hover:none)]:w-11"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : "Copy"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};
