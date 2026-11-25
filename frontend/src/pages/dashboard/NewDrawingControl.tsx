import React from "react";
import { Plus } from "lucide-react";

interface NewDrawingControlProps {
  disabled: boolean;
  onCreate: () => void;
  // Optional gate run before creating. Return false to abort (e.g. a viewer
  // in a read-only shared collection); the gate is responsible for surfacing
  // its own message.
  canCreate?: () => boolean;
}

export const NewDrawingControl: React.FC<NewDrawingControlProps> = ({
  disabled,
  onCreate,
  canCreate,
}) => {
  return (
    <button
      onClick={() => {
        if (canCreate && !canCreate()) return;
        onCreate();
      }}
      disabled={disabled}
      aria-label="New drawing"
      title="New drawing"
      className="ui-button-primary h-[42px] w-[42px] shrink-0 whitespace-nowrap px-0 2xl:w-auto 2xl:px-5"
    >
      <Plus size={18} strokeWidth={2.5} />
      <span className="hidden 2xl:inline">New Drawing</span>
    </button>
  );
};
