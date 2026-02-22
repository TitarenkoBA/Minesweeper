import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  Renderer2,
  signal,
  SimpleChanges,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MediaQueryStore } from '@shared/stores/media-query-store';

@Component({
  selector: 'modal-cdk',
  templateUrl: './modal-cdk.html',
  styleUrl: './modal-cdk.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalCdk implements OnDestroy, OnChanges {
  public readonly closeModal = output();
  public readonly modalTemplate = viewChild<TemplateRef<HTMLElement>>('modalTemplate');
  public readonly needEmptyTemplate = input<boolean>(false);
  public readonly isOpen = input<boolean>(false);
  public readonly canBeClosed = input<boolean>(true);
  public readonly isBackdropClickEnabled = input<boolean>(true);
  public readonly animationClassName = input<string>('animate-scaleIn');
  public readonly customClassName = input<string>('');
  public readonly customCloseButtonClassName = input<string>('');
  public readonly isOpened = signal<boolean>(false);
  public readonly isLg = inject(MediaQueryStore).isLg;

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);

  private overlayRef?: OverlayRef;
  private readonly renderer = inject(Renderer2);
  private readonly bottomPositionStrategy = this.overlay.position().global().centerHorizontally().bottom('0px');
  private readonly centerositionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
  private readonly prevPositionStrategy = signal(this.needEmptyTemplate() && !this.isLg() ? 'bottom' : 'center');
  private readonly positionStrategy = computed(() => {
    return this.needEmptyTemplate() && !this.isLg() ? this.bottomPositionStrategy : this.centerositionStrategy;
  });
  private readonly positionStrategyName = computed(() => {
    return this.needEmptyTemplate() && !this.isLg() ? 'bottom' : 'center';
  });

  public constructor() {
    effect(() => {
      const strategy = this.positionStrategyName();
      if (this.prevPositionStrategy() !== strategy) {
        this.prevPositionStrategy.set(strategy);
        this.overlayRef?.updatePositionStrategy(
          strategy === 'bottom' ? this.bottomPositionStrategy : this.centerositionStrategy,
        );
      }
    });
  }

  public show(): void {
    this.renderer.addClass(document.body, 'cdk-modal-opened');

    if (!this.overlayRef?.hasAttached()) {
      if (!this.overlayRef) {
        this.overlayRef = this.overlay.create({
          hasBackdrop: true,
          backdropClass: this.needEmptyTemplate() ? 'modal-black-backdrop' : 'modal-backdrop',
          panelClass: this.needEmptyTemplate() ? 'modal-custom-pane' : '',
          positionStrategy: this.positionStrategy(),
        });

        if (this.isBackdropClickEnabled()) {
          this.overlayRef.backdropClick().subscribe(() => this.close());
        }
      }

      const template = this.modalTemplate();
      if (template) {
        const portal = new TemplatePortal(template, this.vcr);
        this.overlayRef.attach(portal);
      }

      this.isOpened.set(true);
    }
  }

  public close(): void {
    if (this.canBeClosed()) {
      this.renderer.removeClass(document.body, 'cdk-modal-opened');

      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
        this.overlayRef.dispose();
        this.overlayRef = undefined;
        this.closeModal.emit();
        this.isOpened.set(false);
      }
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.isOpen()) {
      this.show();
    } else {
      const change = changes['canBeClosed'];

      if (change?.currentValue === true && change?.previousValue === false) {
        return;
      } else {
        this.close();
      }
    }
  }

  public ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }
}
