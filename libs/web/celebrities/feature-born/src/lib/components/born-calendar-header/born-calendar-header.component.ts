import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { DateAdapter } from '@angular/material/core';
import { MatCalendar, yearsPerPage } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

// The header of the born page's datepickers. Unlike Material's, its label is not a button, so the day picker cannot
// switch to choosing a year and the year picker cannot switch to choosing a day. The day picker's label shows only the
// month, and its arrows go round the months of one year: the people of a date are the same in every year, and the page
// opens the picker in a leap year, so February 29 stays available.
@Component({
  selector: 'ui-born-calendar-header',
  imports: [TranslocoPipe, MatIconButton, MatIcon],
  templateUrl: './born-calendar-header.component.html',
  styleUrl: './born-calendar-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BornCalendarHeaderComponent {
  private readonly calendar: MatCalendar<Date> = inject<MatCalendar<Date>>(MatCalendar);
  private readonly dateAdapter: DateAdapter<Date> = inject<DateAdapter<Date>>(DateAdapter);

  constructor() {
    const changeDetector: ChangeDetectorRef = inject(ChangeDetectorRef);

    // The calendar is not signal-based; it reports its active date and view through `stateChanges`.
    this.calendar.stateChanges.pipe(takeUntilDestroyed()).subscribe(() => changeDetector.markForCheck());
  }

  protected get isYearView(): boolean {
    return this.calendar.currentView === 'multi-year';
  }

  protected get label(): string {
    const date: Date = this.calendar.activeDate;

    if (!this.isYearView) {
      return this.dateAdapter.getMonthNames('long')[this.dateAdapter.getMonth(date)];
    }

    const start: number = this.getFirstYearOfPage();

    return `${start} – ${start + yearsPerPage - 1}`;
  }

  protected get isPreviousDisabled(): boolean {
    const min: Date | null = this.calendar.minDate;

    return this.isYearView && !!min && this.getFirstYearOfPage() <= this.dateAdapter.getYear(min);
  }

  protected get isNextDisabled(): boolean {
    const max: Date | null = this.calendar.maxDate;

    return this.isYearView && !!max && this.getFirstYearOfPage() + yearsPerPage - 1 >= this.dateAdapter.getYear(max);
  }

  protected previous(): void {
    this.move(-1);
  }

  protected next(): void {
    this.move(1);
  }

  private move(direction: number): void {
    const date: Date = this.calendar.activeDate;

    this.calendar.activeDate = this.isYearView
      ? this.dateAdapter.addCalendarYears(date, direction * yearsPerPage)
      : this.moveMonthInYear(date, direction);
  }

  // December is followed by January of the same year, and January preceded by its December.
  private moveMonthInYear(date: Date, direction: number): Date {
    const next: Date = this.dateAdapter.addCalendarMonths(date, direction);

    return this.dateAdapter.createDate(this.dateAdapter.getYear(date), this.dateAdapter.getMonth(next), this.dateAdapter.getDate(next));
  }

  // Pages of years are counted the way Material's year view counts them: from the maximum year back, otherwise from
  // the minimum year, otherwise from year 0.
  private getFirstYearOfPage(): number {
    const { minDate, maxDate } = this.calendar;
    const anchor: number = maxDate ? this.dateAdapter.getYear(maxDate) - yearsPerPage + 1 : minDate ? this.dateAdapter.getYear(minDate) : 0;
    const year: number = this.dateAdapter.getYear(this.calendar.activeDate);

    return year - ((((year - anchor) % yearsPerPage) + yearsPerPage) % yearsPerPage);
  }
}
