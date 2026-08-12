import { Directive, ElementRef, inject, OnInit } from '@angular/core';
import { MatRipple } from '@angular/material/core';

@Directive({
  // Deliberate class selector: this attaches a ripple to every element already
  // carrying the .btn utility class, which is the whole point of it. An attribute
  // selector would mean editing every button in the app and remembering the
  // attribute on every new one.
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '.btn',
  hostDirectives: [MatRipple],
})
export class BtnRippleDirective implements OnInit {
  private el = inject(ElementRef);
  private ripple = inject(MatRipple);

  ngOnInit(): void {
    const el: HTMLElement = this.el.nativeElement;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    this.ripple.centered = false;
    this.ripple.unbounded = false;
  }
}
