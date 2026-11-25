import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { BirthdayAvatarComponent, RelationshipDotComponent } from '@birthday/web-birthdays-ui';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { AppTranslateService, LocaleDatePipe } from '@birthday/web-shared-i18n';
import { PersonController, PersonState } from '../../state';
import { PersonRow } from '../../types';

@Component({
  selector: 'ui-person-page',
  imports: [
    TranslocoPipe,
    LocaleDatePipe,
    MatButton,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatProgressSpinner,
    RouterLink,
    BirthdayAvatarComponent,
    RelationshipDotComponent,
  ],
  templateUrl: './person-page.component.html',
  styleUrl: './person-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonPageComponent {
  private readonly personState: ReadonlyState<PersonState> = injectState(PersonState);
  private readonly personController: PersonController = inject(PersonController);
  private readonly translator: AppTranslateService = inject(AppTranslateService);

  protected get person(): Signal<PersonRow | null> {
    return this.personState.person;
  }

  protected get isLoading(): Signal<boolean> {
    return this.personState.isLoading;
  }

  protected get canEditPhoto(): Signal<boolean> {
    return this.personState.canEditPhoto;
  }

  protected get isPhotoSaving(): Signal<boolean> {
    return this.personState.isPhotoSaving;
  }

  protected getDaysUntilLabel(daysUntil: number): string {
    if (daysUntil === 0) {
      return this.translator.translate('calendar.today');
    }

    return daysUntil === 1 ? this.translator.translate('calendar.tomorrow') : this.translator.translatePlural('calendar.inDays', daysUntil);
  }

  protected getAgeLabel(age: number): string {
    return this.translator.translatePlural('person.years', age);
  }

  protected onPhotoSelected(input: HTMLInputElement): void {
    const image: File | undefined = input.files?.[0];

    // Cleared, so choosing the same file again still reports a change.
    input.value = '';
    if (image) {
      this.personController.setPhoto(image);
    }
  }

  protected removePhoto(): void {
    this.personController.removePhoto();
  }
}
