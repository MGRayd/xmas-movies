import { useState, useEffect } from 'react';

// Define the settings interface
interface Settings {
  autoBoldCharacterNames: boolean;
  // Add more settings as needed
}

// Default settings
const defaultSettings: Settings = {
  autoBoldCharacterNames: true,
};

// Key for local storage
const SETTINGS_KEY = 'terraveil_settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings({
          ...defaultSettings,
          ...JSON.parse(savedSettings),
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Update a specific setting
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Save to localStorage
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return {
    settings,
    loaded,
    updateSetting,
  };
}
