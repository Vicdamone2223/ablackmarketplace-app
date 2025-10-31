import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export default function BackButtonHandler() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => { sub.remove(); };
  }, [pathname]);

  return null;
}
