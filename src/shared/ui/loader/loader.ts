import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'loader',
  standalone: true,
  styleUrl: './loader.css',
  template: `<span></span>`,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'loader-2'
  }
})

export class Loader {
  public readonly text = model('');
}
