import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, AlertCircle } from 'react-feather';
import Button from './Button';
import { usePWA } from '../../services/PWAManager';

interface PWAInstallProps {
  onDismiss?: () => void;
  showInstructions?: boolean;
  className?: string;
}

const PWAInstall: React.FC<PWAInstallProps> = ({
  onDismiss,
  showInstructions = true,
  className = ''
}) => {
  const { 
    status, 
    canInstall, 
    promptInstall, 
    getInstallInstructions, 
    hidePrompt 
  } = usePWA();
  
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  // Don't show if already installed or not installable
  if (status.isInstalled || (!canInstall && !showInstructions)) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    setInstallResult(null);

    try {
      const result = await promptInstall();
      
      if (result.installed) {
        setInstallResult({ success: true });
        setTimeout(() => {
          onDismiss?.();
        }, 2000);
      } else {
        setInstallResult({ 
          success: false, 
          error: result.error || 'Installation cancelled' 
        });
        
        // Show manual instructions if automatic install failed
        if (result.error?.includes('not available')) {
          setShowManualInstructions(true);
        }
      }
    } catch (error) {
      setInstallResult({ 
        success: false, 
        error: 'Installation failed' 
      });
      setShowManualInstructions(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    hidePrompt();
    onDismiss?.();
  };

  const instructions = getInstallInstructions();

  return (
    <div className={`bg-white rounded-lg shadow-xl border-2 border-green-200 p-6 max-w-sm mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Install Feral Friends</h3>
            <p className="text-sm text-gray-600">Get the full app experience</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Why install?</h4>
        <ul className="space-y-2">
          {[
            'Works offline - play anywhere',
            'Faster loading and performance', 
            'App icon on your home screen',
            'Full-screen gaming experience',
            'Automatic updates'
          ].map((benefit, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Install Result */}
      {installResult && (
        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
          installResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {installResult.success ? (
            <>
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">Successfully installed!</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{installResult.error}</span>
            </>
          )}
        </div>
      )}

      {/* Install Actions */}
      {!showManualInstructions ? (
        <div className="space-y-3">
          {canInstall && (
            <Button
              onClick={handleInstall}
              disabled={isInstalling || installResult?.success}
              className="w-full"
              size="lg"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Installing...
                </>
              ) : installResult?.success ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Installed!
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </>
              )}
            </Button>
          )}

          {(status.platform === 'ios' || !canInstall) && (
            <Button
              onClick={() => setShowManualInstructions(true)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Show Install Instructions
            </Button>
          )}
        </div>
      ) : (
        /* Manual Instructions */
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              Install on {instructions.platform}
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              {instructions.instructions.map((step, index) => (
                <li key={index} className="text-sm text-blue-700">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => setShowManualInstructions(false)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleDismiss}
              className="flex-1"
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Platform-specific notes */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {status.platform === 'ios' && 'Safari browser required for iOS installation'}
          {status.platform === 'android' && 'Chrome browser recommended for best experience'}
          {status.platform === 'desktop' && 'Available in Chrome, Edge, and other modern browsers'}
          {status.platform === 'unknown' && 'Installation availability depends on your browser'}
        </p>
      </div>
    </div>
  );
};

export default PWAInstall;