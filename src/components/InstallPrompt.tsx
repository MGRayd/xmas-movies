import { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // For non-iOS devices, use the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt regardless of outcome
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  };

  const closePrompt = () => {
    setShowPrompt(false);
    // Store in localStorage that user dismissed the prompt
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-800 text-white p-4 shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-3 text-2xl">
          <i className="fas fa-gift"></i>
        </div>
        <div>
          {isIOS ? (
            <p>
              Install this app on your device: tap <i className="fas fa-share"></i> and then "Add to Home Screen"
            </p>
          ) : (
            <p>Add Christmas Movies to your home screen!</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center">
        {!isIOS && (
          <button 
            onClick={handleInstallClick}
            className="bg-red-700 hover:bg-red-800 text-white py-1 px-4 rounded-full mr-2"
          >
            Install
          </button>
        )}
        <button 
          onClick={closePrompt}
          className="bg-transparent hover:bg-green-700 text-white py-1 px-2 rounded-full"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
