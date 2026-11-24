import { ChangeDetectionStrategy, Component, computed, signal, Signal, WritableSignal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AuthState } from '@birthday/web-auth-data-access';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';

// The user's picture, the first letter of the email when there is no picture, or a person icon for a guest.
@Component({
  selector: 'app-account-avatar',
  imports: [MatIcon],
  templateUrl: './account-avatar.component.html',
  styleUrl: './account-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountAvatarComponent {
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);

  // The picture address that failed to load, so the avatar falls back to the initial until the address changes.
  private readonly failedPicture: WritableSignal<string | null> = signal(null);
  protected readonly picture: Signal<string | null> = computed(() => this.visiblePicture());
  protected readonly initial: Signal<string> = computed(() => this.authState.user()?.email?.charAt(0).toUpperCase() ?? '');

  protected onPictureError(picture: string): void {
    this.failedPicture.set(picture);
  }

  private visiblePicture(): string | null {
    const picture: string | null = this.authState.user()?.picture ?? null;

    return picture === this.failedPicture() ? null : picture;
  }
}
