import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({
  selector: '[upClickOutside]',
})
export class ClickOutside {
  public readonly upClickOutside = output();
  private readonly elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.upClickOutside.emit();
    }
  }
}
