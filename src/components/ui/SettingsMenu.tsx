import React, { useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Eye, 
  Smartphone, 
  Save, 
  Trash2,
  Info,
  X,
  Sliders
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import { getAudioManager } from '../../services/AudioManager';
import { getAmbientAudio } from '../../game/AmbientAudio';
import Button from './Button';

interface GameSettings {
  // Audio Settings
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
  isMuted: boolean;
  
  // Visual Settings
  showFPS: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  particleQuality: 'low' | 'medium' | 'high';
  
  // Gameplay Settings
  autoSave: boolean;
  showTutorials: boolean;
  touchSensitivity: number;
  
  // Accessibility Settings
  largeText: boolean;
  soundCues: boolean;
  screenReader: boolean;
}

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: GameSettings) => void;
}

const defaultSettings: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.7,
  musicVolume: 0.6,
  ambientVolume: 0.5,
  isMuted: false,
  showFPS: false,
  reduceMotion: false,
  highContrast: false,
  particleQuality: 'medium',
  autoSave: true,
  showTutorials: true,
  touchSensitivity: 0.8,
  largeText: false,
  soundCues: true,
  screenReader: false
};

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'audio' | 'visual' | 'gameplay' | 'accessibility'>('audio');
  const [hasChanges, setHasChanges] = useState(false);
  
  const { playMenuOpen, playMenuClose, playButtonClick } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'right');
  const fadeInStyle = useFadeIn(isOpen);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('feral-friends-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    }
  }, []);

  // Play sound effects when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      playMenuOpen();
    } else {
      playMenuClose();
    }
  }, [isOpen, playMenuOpen, playMenuClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const updateSetting = <K extends keyof GameSettings>(
    key: K, 
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Apply audio settings immediately
    if (key.includes('Volume') || key === 'isMuted') {
      applyAudioSettings({ ...settings, [key]: value });
    }
  };

  const applyAudioSettings = (audioSettings: GameSettings) => {
    const audioManager = getAudioManager();
    const ambientAudio = getAmbientAudio();
    
    audioManager.updateConfig({
      masterVolume: audioSettings.masterVolume,
      sfxVolume: audioSettings.sfxVolume,
      musicVolume: audioSettings.musicVolume,
      muted: audioSettings.isMuted
    });
    
    ambientAudio.updateConfig({
      baseVolume: audioSettings.ambientVolume
    });
  };

  const handleSave = () => {
    try {
      localStorage.setItem('feral-friends-settings', JSON.stringify(settings));
      applyAudioSettings(settings);
      setHasChanges(false);
      onSave?.(settings);
      playButtonClick();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    playButtonClick();
  };

  const handleClose = () => {
    if (hasChanges) {
      const shouldSave = window.confirm('You have unsaved changes. Save before closing?');
      if (shouldSave) {
        handleSave();
      }
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'audio', label: 'Audio', icon: <Volume2 size={16} /> },
    { id: 'visual', label: 'Visual', icon: <Eye size={16} /> },
    { id: 'gameplay', label: 'Gameplay', icon: <Sliders size={16} /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Info size={16} /> }
  ] as const;

  const renderSlider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min = 0,
    max = 1,
    step = 0.1
  ) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  const renderToggle = (
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    description?: string
  ) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  const renderSelect = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={handleBackdropClick}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-green-200"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="text-green-600" size={24} />
              <h2 className="text-xl font-bold text-green-800">Game Settings</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Volume2 size={20} />
                Audio Settings
              </h3>
              
              {renderToggle(
                'Mute All Sounds',
                settings.isMuted,
                (checked) => updateSetting('isMuted', checked),
                'Disables all game audio'
              )}
              
              {!settings.isMuted && (
                <div className="space-y-4">
                  {renderSlider(
                    'Master Volume',
                    settings.masterVolume,
                    (value) => updateSetting('masterVolume', value)
                  )}
                  
                  {renderSlider(
                    'Sound Effects',
                    settings.sfxVolume,
                    (value) => updateSetting('sfxVolume', value)
                  )}
                  
                  {renderSlider(
                    'Music',
                    settings.musicVolume,
                    (value) => updateSetting('musicVolume', value)
                  )}
                  
                  {renderSlider(
                    'Ambient Sounds',
                    settings.ambientVolume,
                    (value) => updateSetting('ambientVolume', value)
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Eye size={20} />
                Visual Settings
              </h3>
              
              {renderSelect(
                'Particle Quality',
                settings.particleQuality,
                [
                  { value: 'low', label: 'Low (Better Performance)' },
                  { value: 'medium', label: 'Medium (Balanced)' },
                  { value: 'high', label: 'High (Best Quality)' }
                ],
                (value) => updateSetting('particleQuality', value as any)
              )}
              
              {renderToggle(
                'Show FPS Counter',
                settings.showFPS,
                (checked) => updateSetting('showFPS', checked),
                'Display frame rate in corner'
              )}
              
              {renderToggle(
                'Reduce Motion',
                settings.reduceMotion,
                (checked) => updateSetting('reduceMotion', checked),
                'Minimize animations for better performance'
              )}
              
              {renderToggle(
                'High Contrast Mode',
                settings.highContrast,
                (checked) => updateSetting('highContrast', checked),
                'Increase color contrast for visibility'
              )}
            </div>
          )}

          {activeTab === 'gameplay' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Sliders size={20} />
                Gameplay Settings
              </h3>
              
              {renderToggle(
                'Auto-Save',
                settings.autoSave,
                (checked) => updateSetting('autoSave', checked),
                'Automatically save progress at key moments'
              )}
              
              {renderToggle(
                'Show Tutorials',
                settings.showTutorials,
                (checked) => updateSetting('showTutorials', checked),
                'Display helpful tips and guides'
              )}
              
              {renderSlider(
                'Touch Sensitivity',
                settings.touchSensitivity,
                (value) => updateSetting('touchSensitivity', value),
                0.1,
                1,
                0.1
              )}
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Info size={20} />
                Accessibility Settings
              </h3>
              
              {renderToggle(
                'Large Text',
                settings.largeText,
                (checked) => updateSetting('largeText', checked),
                'Increase text size throughout the game'
              )}
              
              {renderToggle(
                'Audio Cues',
                settings.soundCues,
                (checked) => updateSetting('soundCues', checked),
                'Play sounds for important events'
              )}
              
              {renderToggle(
                'Screen Reader Support',
                settings.screenReader,
                (checked) => updateSetting('screenReader', checked),
                'Enhanced support for screen readers'
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              leftIcon={<Trash2 size={16} />}
              onClick={handleReset}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Reset to Defaults
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Save size={16} />}
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save Settings
              </Button>
            </div>
          </div>
          
          {hasChanges && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              You have unsaved changes
            </p>
          )}
        </div>
      </animated.div>
    </animated.div>
  );
};

export default SettingsMenu;