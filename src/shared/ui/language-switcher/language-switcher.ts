import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { ClickOutside } from '@shared/directives/click-outside';
import { FindByKeyPipe } from '@shared/pipes/find-by-key-pipe';

export interface Country {
  code: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'language-switcher',
  templateUrl: './language-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FindByKeyPipe, ClickOutside, NgClass],
})
export class LanguageSwitcher {
  public readonly locale = input.required<string>();
  public readonly direction = input<'down' | 'up'>('down');
  public readonly languages = input.required<Country[]>();
  public readonly changeLocale = output<string>();
  public readonly dropdownOpen = signal(false);

  public readonly selectedLanguage = computed(() => {
    return this.languages().find((lang) => lang.code === this.locale());
  });

  public select(lang: string): void {
    this.changeLocale.emit(lang);
    this.dropdownOpen.set(false);
  }

  public toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }
}
