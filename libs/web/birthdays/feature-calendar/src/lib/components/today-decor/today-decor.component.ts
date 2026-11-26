import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';

const GIFT_TONES: string[] = ['violet', 'mint', 'rose'];

@Component({
  selector: 'ui-today-decor',
  templateUrl: './today-decor.component.html',
  styleUrl: './today-decor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayDecorComponent {
  public readonly festive: InputSignal<boolean> = input(false);

  // Each gift and confetti piece gets its position, size, and timing from its index in the stylesheet.
  protected readonly gifts: Signal<string[]> = computed(() => (this.festive() ? [...GIFT_TONES, 'sky'] : GIFT_TONES));
  protected readonly confetti: number[] = Array.from({ length: 10 }, (_: unknown, index: number) => index);
}
