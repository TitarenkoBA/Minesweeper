import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { PwaInstallService } from '@shared/services/pwa-install.service';

import { routes } from './app.routes';

// Service worker works only over http(s), not inside cordova's file:// webview
const isServiceWorkerSupported =
  typeof location !== 'undefined' && location.protocol.startsWith('http');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && isServiceWorkerSupported,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // subscribe to beforeinstallprompt before deferred ui is loaded
    provideAppInitializer(() => {
      inject(PwaInstallService);
    }),
  ],
};
