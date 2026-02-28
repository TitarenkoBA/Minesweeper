import { filter } from 'rxjs/operators';

import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd,Router } from '@angular/router';

import enTranslations from '../../locales/en.json';
import ruTranslations from '../../locales/ru.json';
import { syncWithLocalStorage } from '@shared/helpers';
import { GameService } from './game.service';

const SUPPORTED_LOCALES = [
  'ru',
  'en', // English
];

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type Translations = Record<string, string>;

/**
 * Сервис для работы с переводами
 *
 * Примеры использования:
 *
 * В шаблонах:
 * - Простой перевод: {{ 'game.loading' | translate }}
 * - С параметрами: {{ 'my-items-table.selected' | translate: {selectedCount: cartItems().size} }}
 * - С несколькими параметрами: {{ 'bonus-widget.sell-for' | translate: {price: wonItem.price || 0} }}
 *
 * В компонентах:
 * - this.translationService.translate('game.loading')
 * - this.translationService.translate('my-items-table.selected', {selectedCount: 5})
 */
@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  public readonly gameService = inject(GameService);
  private readonly translations: Record<SupportedLocale, Translations> = {
    ru: ruTranslations,
    en: enTranslations,
  };

  private readonly currentLocale = signal<SupportedLocale>('ru');

  /**
   * Получить перевод по ключу
   * @param key - ключ перевода
   * @param params - параметры для интерполяции (например, {name: 'John', count: 5})
   * @returns переведенный текст
   */
  public translate(key: string, params?: Record<string, unknown>): string {
    const locale = this.gameService.currentLocale();
    const translations = this.translations[locale];
    let translation = translations[key] || key;

    // Интерполяция параметров
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const value = params[paramKey];
        // Заменяем {{paramKey}} на значение
        // Экранируем специальные символы для регулярного выражения
        const escapedKey = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        translation = translation.replace(new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g'), String(value ?? ''));
      });
    }

    return translation;
  }

  public getLocale(): SupportedLocale {
    return this.currentLocale();
  }

  public setLocale(locale: SupportedLocale): void {
    if (SUPPORTED_LOCALES.includes(locale)) {
      this.currentLocale.set(locale);
    }
  }
}
