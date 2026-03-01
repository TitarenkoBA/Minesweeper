import { inject,Pipe, PipeTransform } from '@angular/core';

import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  public transform(key: string, params?: Record<string, unknown>): string {
    if (!key) {
      return '';
    }
    return this.translationService.translate(key, params);
  }
}
