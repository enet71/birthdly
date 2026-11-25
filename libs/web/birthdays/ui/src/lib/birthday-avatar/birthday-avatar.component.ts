import { ChangeDetectionStrategy, Component, computed, input, InputSignal, linkedSignal, Signal, WritableSignal } from '@angular/core';
import { BirthdayTone, getBirthdayTone } from '@birthday/web-birthdays-util';

@Component({
  selector: 'ui-birthday-avatar',
  templateUrl: './birthday-avatar.component.html',
  styleUrl: './birthday-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.--birthday-tone]': "'var(--app-tone-' + tone() + '-ink)'",
    '[style.--birthday-tone-container]': "'var(--app-tone-' + tone() + ')'",
  },
})
export class BirthdayAvatarComponent {
  public readonly name: InputSignal<string> = input.required();
  public readonly photoUrl: InputSignal<string | null> = input<string | null>(null);

  protected readonly initials: Signal<string> = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word: string) => word.charAt(0).toUpperCase())
      .join(''),
  );
  protected readonly tone: Signal<BirthdayTone> = computed(() => getBirthdayTone(this.name()));
  // A photo that fails to load, for example after its link expired, falls back to the initials until the link changes.
  protected readonly hasPhotoFailed: WritableSignal<boolean> = linkedSignal({ source: this.photoUrl, computation: () => false });
}
