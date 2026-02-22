import { assertInInjectionContext, effect, inject, WritableSignal } from '@angular/core';

import { LocalStorage } from '../common';

export function syncWithLocalStorage(storageKey: string, keysToSignals: Record<string, WritableSignal<unknown>>): null {
  assertInInjectionContext(syncWithLocalStorage);

  const localStorage = inject(LocalStorage);

  const data = localStorage.getItem<Record<string, unknown>>(storageKey);

  if (data) {
    for (const key in keysToSignals) {
      const value = data[key];

      if (value !== undefined) {
        keysToSignals[key].set(value);
      }
    }
  }

  effect(() => {
    const storageData: Record<string, unknown> = {};

    for (const key in keysToSignals) {
      const value = keysToSignals[key]();
      if (value !== null && value !== undefined) {
        storageData[key] = value;
      }
    }

    if (Object.keys(storageData).length === 0) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, storageData);
    }
  });

  return null;
}
