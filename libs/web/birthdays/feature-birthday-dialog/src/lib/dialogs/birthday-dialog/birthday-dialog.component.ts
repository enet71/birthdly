import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, Signal, WritableSignal } from '@angular/core';
import { FieldTree, form, FormField, maxLength, pattern, required, submit, validate } from '@angular/forms/signals';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatOption, MatSelect } from '@angular/material/select';
import { getDaysInMonth, parseISO } from 'date-fns';
import { BirthdayRelationship, CreateBirthdayRequest } from '@birthday/shared-models';
import { AuthState } from '@birthday/web-auth-data-access';
import { BirthdayAvatarComponent, RelationshipDotComponent } from '@birthday/web-birthdays-ui';
import { BirthdayDialogData, BirthdayDialogState, BirthdayDraftPhoto, BirthdayFormModel } from '@birthday/web-birthdays-data-access';
import { BIRTHDAY_NOTES_MAX_LENGTH, hasBirthYear, RELATIONSHIP_OPTIONS, RelationshipOption } from '@birthday/web-birthdays-util';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { LocaleDatePipe } from '@birthday/web-shared-i18n';
import { DialogHeaderComponent } from '@birthday/web-shared-ui';
import { BirthdayFormController } from '../../state';
import { BirthdayDialogPhoto } from '../../types';
import { TranslocoPipe } from '@jsverse/transloco';

// A leap year, so Feb 29 can be chosen while the birth year is empty.
const ANY_LEAP_YEAR = 2000;

@Component({
  selector: 'ui-birthday-dialog',
  imports: [
    TranslocoPipe,
    LocaleDatePipe,
    FormField,
    MatButton,
    MatIconButton,
    MatChipListbox,
    MatChipOption,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatHint,
    MatLabel,
    MatPrefix,
    MatIcon,
    MatInput,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatOption,
    MatSelect,
    DialogHeaderComponent,
    BirthdayAvatarComponent,
    RelationshipDotComponent,
  ],
  templateUrl: './birthday-dialog.component.html',
  styleUrl: './birthday-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BirthdayDialogComponent {
  private readonly data: BirthdayDialogData = inject(MAT_DIALOG_DATA);
  private readonly birthdayFormController: BirthdayFormController = inject(BirthdayFormController);
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly birthdayDialogState: ReadonlyState<BirthdayDialogState> = injectState(BirthdayDialogState);
  // The preview of a chosen file, released when another photo is chosen or the dialog closes.
  private objectUrl: string | null = null;

  protected readonly isEdit: boolean = !!this.data.birthday;
  protected readonly photo: WritableSignal<BirthdayDialogPhoto> = signal(this.createPhoto());
  protected readonly relationshipOptions: RelationshipOption[] = RELATIONSHIP_OPTIONS;
  protected readonly notesMaxLength: number = BIRTHDAY_NOTES_MAX_LENGTH;
  protected readonly months: Date[] = Array.from({ length: 12 }, (_, index: number) => new Date(ANY_LEAP_YEAR, index));
  protected readonly model: WritableSignal<BirthdayFormModel> = signal(this.createModel());
  protected readonly days: Signal<number[]> = computed(() =>
    Array.from({ length: getDaysInMonth(new Date(ANY_LEAP_YEAR, this.model().month - 1)) }, (_, index: number) => index + 1),
  );
  // Error messages are translation keys; the template translates them.
  protected readonly birthdayForm: FieldTree<BirthdayFormModel> = form(this.model, (path) => {
    required(path.name, { message: 'birthdayDialog.errors.nameRequired' });
    pattern(path.name, /\S/, { message: 'birthdayDialog.errors.nameRequired' });
    // Matches the database limit for account birthdays.
    maxLength(path.name, 200, { message: 'birthdayDialog.errors.nameTooLong' });
    pattern(path.year, /^([1-9]\d{3})?$/, { message: 'birthdayDialog.errors.yearFormat' });
    validate(path.year, ({ value }) =>
      Number(value()) > new Date().getFullYear() ? { kind: 'futureYear', message: 'birthdayDialog.errors.futureYear' } : undefined,
    );
    // Picking a shorter month keeps the chosen day, and Feb 29 exists only in leap years.
    validate(path.day, ({ value, valueOf }) => {
      const year: string = valueOf(path.year);
      const daysInMonth: number = getDaysInMonth(new Date(/^\d{4}$/.test(year) ? Number(year) : ANY_LEAP_YEAR, valueOf(path.month) - 1));

      return value() > daysInMonth ? { kind: 'invalidDay', message: 'birthdayDialog.errors.invalidDay' } : undefined;
    });
    maxLength(path.notes, BIRTHDAY_NOTES_MAX_LENGTH, { message: 'birthdayDialog.errors.notesTooLong' });
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releaseObjectUrl());
  }

  protected get isSignedIn(): Signal<boolean> {
    return this.authState.isAuthenticated;
  }

  // Signing in starts only once the session is known to be signed out, and not while a sign-in runs.
  protected readonly canSignIn: Signal<boolean> = computed(() => this.authState.status() === 'signedOut' && !this.birthdayDialogState.isSigningIn());

  protected save(event: Event): void {
    event.preventDefault();
    // `submit` requires a Promise-returning action; saving itself stays an Observable.
    submit(this.birthdayForm, async () => this.birthdayFormController.saveBirthday(this.model(), this.photo().change));
  }

  protected signInToAddPhoto(): void {
    this.birthdayFormController.signInToAddPhoto();
  }

  protected onPhotoSelected(input: HTMLInputElement): void {
    const image: File | undefined = input.files?.[0];

    // Cleared, so choosing the same file again still reports a change.
    input.value = '';
    if (image) {
      this.releaseObjectUrl();
      this.objectUrl = URL.createObjectURL(image);
      this.photo.set({ previewUrl: this.objectUrl, change: { kind: 'file', image } });
    }
  }

  // Only a photo the birthday already has is deleted on save; a photo that was only chosen is simply dropped.
  protected removePhoto(): void {
    this.releaseObjectUrl();
    this.photo.set({ previewUrl: null, change: { kind: this.data.birthday?.photoUrl ? 'remove' : 'keep' } });
  }

  // The listbox emits `undefined` when the selected chip is clicked again.
  protected setRelationship(relationship: BirthdayRelationship | undefined): void {
    this.birthdayForm.relationship().value.set(relationship ?? null);
  }

  protected delete(): void {
    this.birthdayFormController.deleteBirthday();
  }

  private createPhoto(): BirthdayDialogPhoto {
    const draftPhoto: BirthdayDraftPhoto | null | undefined = this.data.draft?.photo;

    if (draftPhoto) {
      return { previewUrl: draftPhoto.previewUrl, change: { kind: 'url', sourceUrls: draftPhoto.sourceUrls } };
    }
    return { previewUrl: this.data.birthday?.photoUrl ?? null, change: { kind: 'keep' } };
  }

  private releaseObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private createModel(): BirthdayFormModel {
    const source: CreateBirthdayRequest | undefined = this.data.birthday ?? this.data.draft;
    const birthDate: string | undefined = source?.birthDate;
    const date: Date = birthDate ? parseISO(birthDate) : this.data.date;

    return {
      name: source?.name ?? '',
      month: date.getMonth() + 1,
      day: date.getDate(),
      year: birthDate && hasBirthYear(birthDate) ? String(date.getFullYear()) : '',
      relationship: source?.relationship ?? null,
      notes: source?.notes ?? '',
    };
  }
}
