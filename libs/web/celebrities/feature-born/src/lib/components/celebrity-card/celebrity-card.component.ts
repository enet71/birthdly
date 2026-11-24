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

  // Set when the photo fails to load; the initials take its place.
  protected readonly isPhotoMissing: WritableSignal<boolean> = signal(false);
  // Country codes whose flag image failed to load.
  protected readonly missingFlags: WritableSignal<ReadonlySet<string>> = signal(new Set());

  protected markPhotoMissing(): void {
    this.isPhotoMissing.set(true);
  }

  protected markFlagMissing(code: string): void {
    this.missingFlags.update((codes: ReadonlySet<string>) => new Set(codes).add(code));
  }
}
