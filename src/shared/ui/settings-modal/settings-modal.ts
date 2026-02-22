import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, viewChild } from '@angular/core';
import { ModalCdk } from '@shared/ui/modal-cdk/modal-cdk';

@Component({
  selector: 'settings-modal',
  templateUrl: './settings-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './settings-modal.scss',
  imports: [ModalCdk, CommonModule],
})
export class SettingsModal {
  public readonly modal = viewChild<ModalCdk>('modal');
  public readonly buy = output();
  public readonly clear = output();


  public show(): void {
    this.modal()?.show();
  }

  public hide(): void {
    this.modal()?.close();
  }

  public onClose(): void {
    this.hide();
  }

}
