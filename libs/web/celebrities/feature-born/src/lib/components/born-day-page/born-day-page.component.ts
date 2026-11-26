import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDatepicker, MatDatepickerInput, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { AppTranslateService, LocaleDatePipe, LocalizedPathPipe } from '@birthday/web-shared-i18n';
import { StickyPanelComponent } from '@birthday/web-shared-ui';
import { BornDayController, BornDayState } from '../../state';
import { splitBornTitle } from '../../helpers';
import { BornTitlePart, CelebrityCard } from '../../types';
import { BornCalendarHeaderComponent } from '../born-calendar-header/born-calendar-header.component';
import { BornFiltersComponent } from '../born-filters/born-filters.component';
import { CelebrityCardComponent } from '../celebrity-card/celebrity-card.component';

@Component({
  selector: 'ui-born-day-page',
  imports: [
    LocalizedPathPipe,
    TranslocoPipe,
    LocaleDatePipe,
    RouterLink,
    MatButton,
    MatIconButton,
    MatDatepicker,
    MatDatepickerInput,
    MatIcon,
    BornFiltersComponent,
    CelebrityCardComponent,
    StickyPanelComponent,
  ],
  templateUrl: './born-day-page.component.html',
  styleUrl: './born-day-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BornDayPageComponent {
  private readonly bornDayState: ReadonlyState<BornDayState> = injectState(BornDayState);
  private readonly bornDayController: BornDayController = inject(BornDayController);
  private readonly translator: AppTranslateService = inject(AppTranslateService);

  protected readonly calendarHeader: typeof BornCalendarHeaderComponent = BornCalendarHeaderComponent;
  protected readonly titleParts: Signal<BornTitlePart[]> = computed(() => this.getTitleParts());
  protected readonly summary: Signal<string> = computed(() => this.translator.translatePlural('born.day.count', this.bornDayState.total()));

  protected get cards(): Signal<CelebrityCard[]> {
    return this.bornDayState.cards;
  }

  protected get hasPhotos(): Signal<boolean> {
    return this.bornDayState.hasPhotos;
  }

  protected get activeFilterCount(): Signal<number> {
    return this.bornDayState.activeFilterCount;
  }

  protected get hasLoadError(): Signal<boolean> {
    return this.bornDayState.hasLoadError;
  }

  protected get isLoading(): Signal<boolean> {
    return this.bornDayState.isLoading;
  }

  protected get todayPath(): string {
    return this.bornDayState.todayPath;
  }

  protected get isToday(): Signal<boolean> {
    return this.bornDayState.isToday;
  }

  protected get pickerDate(): Signal<Date | null> {
    return this.bornDayState.referenceDate;
  }

  protected get previousDate(): Signal<Date | null> {
    return this.bornDayState.previousDate;
  }

  protected get nextDate(): Signal<Date | null> {
    return this.bornDayState.nextDate;
  }

  protected get previousPath(): Signal<string | null> {
    return this.bornDayState.previousPath;
  }

  protected get nextPath(): Signal<string | null> {
    return this.bornDayState.nextPath;
  }

  protected openDate({ value }: MatDatepickerInputEvent<Date>): void {
    if (value) {
      this.bornDayController.openDate(value);
    }
  }

  protected get year(): Signal<number | null> {
    return this.bornDayState.year;
  }

  protected get yearPickerValue(): Signal<Date | null> {
    return this.bornDayState.yearPickerValue;
  }

  protected get yearPickerMin(): Date {
    return this.bornDayState.yearPickerMin;
  }

  protected get yearPickerMax(): Date {
    return this.bornDayState.yearPickerMax;
  }

  protected get yearFilter(): Signal<(date: Date | null) => boolean> {
    return this.bornDayState.yearFilter;
  }

  protected resetFilters(): void {
    this.bornDayController.resetFilters();
  }

  // The picker would go on to the months of the year; only the year is needed.
  protected selectYear(date: Date, picker: MatDatepicker<Date>): void {
    picker.close();
    this.bornDayController.changeYear(date.getFullYear());
  }

  protected clearYear(): void {
    this.bornDayController.changeYear(null);
  }

  protected get hasMore(): Signal<boolean> {
    return this.bornDayState.hasMore;
  }

  protected get isLoadingMore(): Signal<boolean> {
    return this.bornDayState.isLoadingMore;
  }

  protected showMore(): void {
    this.bornDayController.showMore();
  }

  protected get canAddToCalendar(): Signal<boolean> {
    return this.bornDayState.canAddToCalendar;
  }

  protected addToCalendar(celebrityId: string): void {
    this.bornDayController.addToCalendar(celebrityId);
  }

  protected retry(): void {
    this.bornDayController.retry();
  }

  private getTitleParts(): BornTitlePart[] {
    const date: Date | null = this.bornDayState.referenceDate();

    return date ? splitBornTitle(this.translator.formatDate(date, 'dates.longMonthDay')) : [];
  }
}
