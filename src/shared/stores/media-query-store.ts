import { Injectable, Signal, signal } from '@angular/core';

export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

@Injectable({ providedIn: 'root' })
export class MediaQueryStore {
  public isSm = this.createBreakpointSignal(`(min-width: ${TAILWIND_BREAKPOINTS.sm}px)`);
  public isMd = this.createBreakpointSignal(`(min-width: ${TAILWIND_BREAKPOINTS.md}px)`);
  public isLg = this.createBreakpointSignal(`(min-width: ${TAILWIND_BREAKPOINTS.lg}px)`);
  public isXl = this.createBreakpointSignal(`(min-width: ${TAILWIND_BREAKPOINTS.xl}px)`);

  private createBreakpointSignal(query: string): Signal<boolean> {
    const media = window.matchMedia(query);
    const value = signal(media.matches);

    media.addEventListener('change', (e) => value.set(e.matches));

    return value;
  }
}
