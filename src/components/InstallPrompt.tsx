import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if dismissed
    const isDismissed = sessionStorage.getItem('install-dismissed');
    if (isDismissed) return;

    // Check if already in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const iosStandalone = (window.navigator as any).standalone;
    
    if (ios && !iosStandalone) {
      setIsIOS(true);
      setIsVisible(true);
    }

    // Handle Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Auto-hide on install
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('install-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 w-full z-[45]"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid #E5E5E0',
        padding: '12px 20px',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)'
      }}
    >
      <div className="flex flex-row justify-between items-center max-w-md mx-auto">
        <div className="flex flex-row items-center gap-[12px]">
          <img 
            src="/icons/icon-96x96.png" 
            alt="Gather"
            className="w-[32px] h-[32px] rounded-lg bg-[#FF6B35] object-contain"
          />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#1A1A1A]">
              Add Gather to Home Screen
            </span>
            <span className="text-[12px] text-neutral-400 mt-[2px]">
              {isIOS 
                ? "Tap Share then 'Add to Home Screen'"
                : "Install the app for the best experience"}
            </span>
          </div>
        </div>
        
        <div className="flex flex-row items-center ml-2 shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-[#FF6B35] text-white text-[13px] font-semibold px-4 py-2 rounded-full whitespace-nowrap"
            >
              Install
            </button>
          )}
          
          <button 
            onClick={handleDismiss}
            className="w-[20px] h-[20px] text-neutral-400 ml-2 flex items-center justify-center shrink-0"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
