import React from "react";

type Props = {
  deceased: boolean;
  onChange: (deceased: boolean) => void;
};

export default function DeceasedToggle({ deceased, onChange }: Props) {
  return (
    <div className="form-control">
      <label className="label cursor-pointer justify-start gap-4">
        <span className="label-text">Mark as deceased</span>
        <input
          type="checkbox"
          className="toggle toggle-error"
          checked={deceased}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
      {deceased && (
        <div className="mt-2 text-sm text-gray-500">
          This NPC will be marked as deceased in the system.
        </div>
      )}
    </div>
  );
}
