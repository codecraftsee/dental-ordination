import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../translate.pipe';
import { TranslateService } from '../../services/translate.service';

@Component({
  selector: 'app-book-table',
  imports: [NgTemplateOutlet, JsonPipe, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './book-table.html',
  styleUrl: './book-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
    '(keydown.arrowRight)': 'goNext()',
    '(keydown.arrowLeft)': 'goPrev()',
    '[attr.tabindex]': '0',
    '[attr.role]': '"region"',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class BookTableComponent {
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  data = input.required<unknown[]>();
  pageTemplate = contentChild<TemplateRef<unknown>>('bookPage');

  isMobile = signal(false);
  currentIndex = signal(0);
  animating = signal(false);
  animationDirection = signal<'forward' | 'backward' | null>(null);

  currentItem = computed(() => this.data()[this.currentIndex()] ?? null);
  prevItem = computed(() => this.data()[this.currentIndex() - 1] ?? null);
  nextItem = computed(() => this.data()[this.currentIndex() + 1] ?? null);
  hasPrev = computed(() => this.currentIndex() > 0);
  hasNext = computed(() => this.currentIndex() < this.data().length - 1);
  pageLabel = computed(() => `${this.currentIndex() + 1} / ${this.data().length}`);
  isEmpty = computed(() => this.data().length === 0);
  ariaLabel = computed(() => this.translateService.translate('bookTable.ariaLabel'));

  private touchStartX = 0;
  private touchStartY = 0;
  private mediaQuery: MediaQueryList;

  constructor() {
    this.mediaQuery = window.matchMedia('(max-width: 767px)');
    this.isMobile.set(this.mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);
    this.mediaQuery.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => this.mediaQuery.removeEventListener('change', handler));

    effect(() => {
      this.data();
      this.currentIndex.set(0);
    });
  }

  goNext(): void {
    if (this.hasNext() && !this.animating()) {
      this.triggerAnimation('forward', this.currentIndex() + 1);
    }
  }

  goPrev(): void {
    if (this.hasPrev() && !this.animating()) {
      this.triggerAnimation('backward', this.currentIndex() - 1);
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = this.touchStartX - event.changedTouches[0].clientX;
    const deltaY = Math.abs(this.touchStartY - event.changedTouches[0].clientY);

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        this.goNext();
      } else {
        this.goPrev();
      }
    }
  }

  onAnimationEnd(): void {
    this.animating.set(false);
    this.animationDirection.set(null);
  }

  private triggerAnimation(direction: 'forward' | 'backward', targetIndex: number): void {
    this.animationDirection.set(direction);
    this.animating.set(true);

    setTimeout(() => {
      this.currentIndex.set(targetIndex);
      this.animating.set(false);
      this.animationDirection.set(null);
    }, 500);
  }
}
