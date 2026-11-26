import { ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { BirthdayAvatarComponent } from '@birthday/web-birthdays-ui';
import { CelebrityCard } from '../../types';

@Component({
  selector: 'ui-celebrity-card',
  imports: [TranslocoPipe, MatIconButton, MatIcon, MatTooltip, BirthdayAvatarComponent],
  templateUrl: './celebrity-card.component.html',
  styleUrl: './celebrity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CelebrityCardComponent {
  public readonly celebrity: InputSignal<CelebrityCard> = input.required();
  // While the session is restored or a sign-in started by the button runs.
  public readonly isAddDisabled: InputSignal<boolean> = input(false);
  public readonly addToCalendar: OutputEmitterRef<void> = output();

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
