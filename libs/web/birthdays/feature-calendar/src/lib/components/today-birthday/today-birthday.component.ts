import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BirthdayAvatarComponent } from '@birthday/web-birthdays-ui';
import { LocaleDatePipe } from '@birthday/web-shared-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { UpcomingCelebration } from '../../types';

@Component({
  selector: 'ui-today-birthday',
  imports: [TranslocoPipe, LocaleDatePipe, RouterLink, BirthdayAvatarComponent],
  templateUrl: './today-birthday.component.html',
  styleUrl: './today-birthday.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayBirthdayComponent {
  public readonly celebration: InputSignal<UpcomingCelebration> = input.required();

  // Each piece gets its position, color, and timing from its index in the stylesheet.
  protected readonly giftTones: string[] = ['violet', 'rose', 'mint'];
  protected readonly balloonTones: string[] = ['rose', 'sky', 'peach'];
  protected readonly confetti: number[] = Array.from({ length: 14 }, (_: unknown, index: number) => index);
}
