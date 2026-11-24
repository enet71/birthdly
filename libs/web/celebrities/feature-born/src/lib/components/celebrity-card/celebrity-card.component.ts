import { ChangeDetectionStrategy, Component, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BirthdayAvatarComponent } from '@birthday/web-birthdays-ui';
import { CelebrityCard } from '../../types';

@Component({
  selector: 'ui-celebrity-card',
  imports: [TranslocoPipe, BirthdayAvatarComponent],
  templateUrl: './celebrity-card.component.html',
  styleUrl: './celebrity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CelebrityCardComponent {
  public readonly celebrity: InputSignal<CelebrityCard> = input.required();

  // Country codes whose flag image failed to load.
  protected readonly missingFlags: WritableSignal<ReadonlySet<string>> = signal(new Set());

  protected markFlagMissing(code: string): void {
    this.missingFlags.update((codes: ReadonlySet<string>) => new Set(codes).add(code));
  }
}
