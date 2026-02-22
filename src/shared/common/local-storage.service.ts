import { inject, Injectable } from '@angular/core';

import { LOCAL_STORAGE } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  private readonly localStorage = inject(LOCAL_STORAGE);

  public setItem<T>(key: string, value: T): void {
    if (!this.localStorage) {
      return;
    }

    try {
      this.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (
        error &&
        ((error as Error).name === 'QuotaExceededError' || (error as Error).name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        // Quota exceeded - silently ignore
      } else {
        // Other localStorage errors - silently ignore
      }
    }
  }

  public getItem<T>(key: string): Partial<T> | null {
    if (!this.localStorage) {
      return null;
    }

    const storedValue: string | null = this.localStorage.getItem(key);

    if (storedValue === 'undefined' || storedValue === null) {
      return null;
    }

    try {
      return JSON.parse(storedValue) as T;
    } catch {
      return null;
    }
  }

  public removeItem(key: string): void {
    if (!this.localStorage) {
      return;
    }

    try {
      this.localStorage.removeItem(key);
    } catch {
      
    }
  }
}
