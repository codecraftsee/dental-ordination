import { Directive, ElementRef, inject, OnInit } from '@angular/core';
import { MatRipple } from '@angular/material/core';

@Directive({
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
