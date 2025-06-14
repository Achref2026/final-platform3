import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember that user dismissed the prompt
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          icon: '🍎',
          title: 'Install on iPhone/iPad',
          steps: [
            'Tap the share button at the bottom of Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install the app'
          ]
        };
      case 'android':
        return {
          icon: '🤖',
          title: 'Install on Android',
          steps: [
            'Tap the menu button (three dots) in Chrome',
            'Select "Add to Home screen" or "Install app"',
            'Tap "Add" or "Install" to confirm'
          ]
        };
      default:
        return {
          icon: '💻',
          title: 'Install on Desktop',
          steps: [
            'Look for the install button in your browser\'s address bar',
            'Click the install button or use the browser menu',
            'Follow the prompts to install the app'
          ]
        };
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // For iOS, show manual instructions since beforeinstallprompt isn't supported
  if (deviceType === 'ios' && !deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">📱</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Install Drive School DZ</h4>
              <p className="text-xs opacity-90 mt-1">
                Add to home screen for quick access and offline features
              </p>
              <button
                onClick={() => setShowInstallPrompt(true)}
                className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded mt-2 hover:bg-opacity-30 transition-colors"
              >
                Show Instructions
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white opacity-70 hover:opacity-100 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">📱</div>
            <div className="flex-1">
              <h4 className="font-semibold">Install Drive School DZ</h4>
              <p className="text-sm opacity-90 mt-1">
                Get offline quizzes, push notifications, and quick access!
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-white opacity-70 hover:opacity-100 px-2 py-2 text-sm"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manual instructions modal
  if (showInstallPrompt && deviceType === 'ios') {
    const instructions = getInstallInstructions();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{instructions.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {instructions.title}
              </h3>
            </div>
            
            <div className="space-y-3 mb-6">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 text-sm">{step}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Why install?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 📚 Take quizzes offline</li>
                <li>• 🔔 Get push notifications</li>
                <li>• ⚡ Faster app loading</li>
                <li>• 📱 Native app experience</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;