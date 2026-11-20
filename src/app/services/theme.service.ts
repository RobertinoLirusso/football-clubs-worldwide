import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'fcw-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<ThemeMode>('light');
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    if (this.isBrowser) {
      let initial: ThemeMode = 'light';
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          initial = saved;
        }
      } catch {
        // Ignore storage errors in restricted contexts
      }
      this.applyTheme(initial, false);
    }
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode, true);
  }

  private applyTheme(mode: ThemeMode, persist: boolean): void {
    this.theme.set(mode);
    if (!this.isBrowser) {
      return;
    }

    const root = this.document?.documentElement;
    if (root) {
      root.setAttribute('data-theme', mode);
    }

    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Ignore storage errors
      }
    }
  }
}
