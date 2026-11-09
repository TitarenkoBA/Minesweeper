import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClickOutside } from '@shared/directives';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PwaInstallService } from '@shared/services/pwa-install.service';

@Component({
  selector: 'pwa-install-popup',
  standalone: true,
  templateUrl: './pwa-install-popup.html',
  imports: [ClickOutside, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaInstallPopup {
  public readonly pwaInstallService = inject(PwaInstallService);
}
