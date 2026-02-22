import { InjectionToken } from '@angular/core';

export const LOCAL_STORAGE = new InjectionToken('LOCAL_STORAGE', {
  providedIn: 'root',
  factory() {
    if (typeof localStorage === 'undefined') {
      return undefined;
    }

    return localStorage;
  },
});
