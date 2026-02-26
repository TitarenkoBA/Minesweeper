import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  computed,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MediaQueryStore } from '@shared/stores/media-query-store';

import { CustomTooltip } from '../ui/tooltip/tooltip.component';

@Directive({
  selector: '[upCustomTooltip]',
  standalone: true,
})
export class CustomTooltipDirect implements OnInit, OnDestroy {
  public readonly text = input('', { alias: 'upCustomTooltip' });

  private overlayRef: OverlayRef | null = null;
  private tooltipRef: ComponentRef<CustomTooltip> | null = null;
  private readonly overlay = inject(Overlay);
  private readonly overlayPositionBuilder = inject(OverlayPositionBuilder);
  private readonly elementRef = inject(ElementRef);
  private readonly mediaQueryStore = inject(MediaQueryStore);
  private readonly isLg = computed(() => this.mediaQueryStore.isLg());
  private readonly positionStrategy = this.overlayPositionBuilder.flexibleConnectedTo(this.elementRef).withPositions([
    {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -8,
    },
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: -8,
    },
    {
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: -8,
    },
    {
      originX: 'end',
      originY: 'center',
      overlayX: 'start',
      overlayY: 'center',
      offsetX: -8,
    },
  ]);

  public constructor() {
    effect(() => {
      const currentText = this.text();
      const isLarge = this.isLg();

      if (!this.tooltipRef) {
        return;
      }

      if (!isLarge) {
        this.disposeTooltip();
        return;
      }

      if (!currentText) {
        this.disposeTooltip();
        return;
      }

      this.tooltipRef.instance.text.set(currentText);
    });
  }

  @HostListener('mouseenter')
  public show(): void {
    if (!this.text() || this.overlayRef === null) {
      return;
    }

    if (!this.isLg()) {
      return;
    }

    this.disposeTooltip();

    if (!this.overlayRef?.hasAttached()) {
      if (this.overlayRef) {
        this.tooltipRef = this.overlayRef.attach(new ComponentPortal(CustomTooltip));
        this.tooltipRef.instance.text.set(this.text());
      }
    }
  }

  @HostListener('mouseleave')
  public hide(): void {
    this.disposeTooltip();
  }

  public ngOnInit(): void {
    if (!this.isLg()) {
      return;
    }

    if (!this.overlayRef?.hasAttached()) {
      if (!this.overlayRef) {
        this.overlayRef = this.overlay.create({
          positionStrategy: this.positionStrategy,
          hasBackdrop: false,
          disposeOnNavigation: true,
          scrollStrategy: this.overlay.scrollStrategies.reposition(),
          panelClass: 'custom-tooltip-panel',
        });
      }
    }
  }

  public ngOnDestroy(): void {
    this.disposeTooltip();
    this.overlayRef?.dispose();
  }

  private disposeTooltip(): void {
    this.tooltipRef?.destroy();
    this.tooltipRef = null;
  }
}
