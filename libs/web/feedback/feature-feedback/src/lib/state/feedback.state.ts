import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { AuthState } from '@birthday/web-auth-data-access';
import { injectState, ReadonlyState, State } from '@birthday/web-shared-data-access';

// The feedback page: how sending a message went.
@Injectable()
export class FeedbackState extends State {
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);

  public readonly isSending: WritableSignal<boolean> = signal(false);
  public readonly isSent: WritableSignal<boolean> = signal(false);

  // Prefills the reply address for a signed-in sender.
  public readonly accountEmail: Signal<string> = computed(() => this.authState.user()?.email ?? '');
}
