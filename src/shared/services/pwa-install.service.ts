import { computed, inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from '@shared/common';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_STORAGE_KEY = 'pwaInstallDismissedAt';
const DISMISS_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 3000;

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private readonly localStorage = inject(LocalStorage);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private readonly canPrompt = signal(false);
  private readonly isDelayPassed = signal(false);
  private readonly isDismissed = signal(this.wasDismissedRecently());

  // iOS Safari has no beforeinstallprompt, app can be installed only manually via "Share" menu
  public readonly isIosInstallable = signal(this.detectIosInstallable());

  public readonly isPopupOpen = computed(
    () =>
      this.isDelayPassed() &&
      !this.isDismissed() &&
      !this.isStandalone() &&
      (this.canPrompt() || this.isIosInstallable()),
  );

  public constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canPrompt.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canPrompt.set(false);
      this.isIosInstallable.set(false);
    });

    setTimeout(() => this.isDelayPassed.set(true), SHOW_DELAY_MS);
  }

  public async install(): Promise<void> {
    const prompt = this.deferredPrompt;
    if (!prompt) {
      return;
    }

    this.deferredPrompt = null;
    this.canPrompt.set(false);

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'dismissed') {
      this.dismiss();
    }
  }

  public dismiss(): void {
    if (this.isDismissed()) {
      return;
    }

    this.localStorage.setItem(DISMISS_STORAGE_KEY, Date.now());
    setTimeout(() => this.isDismissed.set(true));
  }

  private wasDismissedRecently(): boolean {
    const dismissedAt = this.localStorage.getItem<number>(DISMISS_STORAGE_KEY);

    return typeof dismissedAt === 'number' && Date.now() - dismissedAt < DISMISS_PERIOD_MS;
  }

  private isStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private detectIosInstallable(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    const isCordova = typeof location !== 'undefined' && !location.protocol.startsWith('http');

    return isIos && isSafari && !isCordova;
  }
}
