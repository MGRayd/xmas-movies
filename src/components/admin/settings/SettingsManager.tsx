import React from "react";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsManager() {
  const { settings, updateSetting, loaded } = useSettings();

  if (!loaded) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-2xl mb-4">Settings</h1>
      
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h2 className="text-xl mb-3">Display Settings</h2>
        
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Automatically bold player character names in content</span>
            <input 
              type="checkbox" 
              className="toggle toggle-primary" 
              checked={settings.autoBoldCharacterNames}
              onChange={(e) => updateSetting('autoBoldCharacterNames', e.target.checked)}
            />
          </label>
          <p className="text-sm opacity-70 mt-1">
            When enabled, player character names will be automatically bolded in session notes and other content.
            You can manage player character names in the Player Characters section.
          </p>
        </div>
      </div>
    </div>
  );
}
