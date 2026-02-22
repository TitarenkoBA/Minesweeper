import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'custom-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `{{ text() }}`,
  styles: [
    `
    .custom-tooltip {
      background-color: #262626;
      background-position: top 0 center;
      background-repeat: no-repeat;
      background-image: radial-gradient(50% 50% at top center, rgba(0, 0, 0, 0.66), #262626),
        linear-gradient(180deg, #fff, #262626);
      background-size: 120% 2000px, 100% 2000px;
      border-bottom: 1px solid #676767;
      border-top: 1px solid #000;
      border-radius: 6px;
    }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'custom-tooltip animate-scaleIn text-[0.875rem] leading-[1rem] text-white px-4 py-2 max-w-[40rem] pointer-events-none',
  },
})
export class CustomTooltip {
  public readonly text = model('');
}
