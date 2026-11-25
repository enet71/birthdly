import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { AppLocale, CELEBRITY_COUNTRIES, CelebrityDto, isCelebrityBirthYear } from '@birthday/shared-models';
import { injectState, ReadonlyState, State } from '@birthday/web-shared-data-access';
import { LocaleState } from '@birthday/web-shared-i18n';
import {
  BORN_DEFAULT_FILTERS,
  countActiveBornFilters,
  getBornDayPath,
  isSameBornDate,
  shiftBornDate,
  toBornDate,
  toReferenceDate,
  toYearDate,
} from '../helpers';
import { BORN_CODES_WITHOUT_FLAG, BORN_HISTORICAL_COUNTRY_CODES, BORN_HISTORICAL_FLAG_CODES } from '../constants';
import { BornCountryOption, BornDate, BornFilters, CelebrityCard, CelebrityCountry } from '../types';

@Injectable()
export class BornDayState extends State {
  private readonly currentYear: number = new Date().getFullYear();
  private readonly today: BornDate = toBornDate(new Date());
  private readonly localeState: ReadonlyState<LocaleState> = injectState(LocaleState);
  // Country names in the current language.
  private readonly countryNames: Signal<Intl.DisplayNames> = computed(() => new Intl.DisplayNames([this.localeState.locale()], { type: 'region' }));

  // The date, filters and language of the people shown; they change together with the people once those load.
  public readonly date: WritableSignal<BornDate | null> = signal(null);
  public readonly filters: WritableSignal<BornFilters> = signal(BORN_DEFAULT_FILTERS);
  public readonly locale: WritableSignal<AppLocale | null> = signal(null);
  // The pages loaded so far, the most popular first or in the chosen order.
  public readonly celebrities: WritableSignal<CelebrityDto[]> = signal([]);
  // How many people match the date and the filters.
  public readonly total: WritableSignal<number> = signal(0);
  public readonly hasLoadError: WritableSignal<boolean> = signal(false);
  public readonly isLoading: WritableSignal<boolean> = signal(false);
  public readonly isLoadingMore: WritableSignal<boolean> = signal(false);

  // The date in a leap year, for formatting and for the datepicker, which stays in that year so February 29 can always be
  // picked; `null` before the first date opens.
  public readonly referenceDate: Signal<Date | null> = computed(() => this.toDate(this.date()));
  public readonly previousDate: Signal<Date | null> = computed(() => this.toDate(this.shiftDate(-1)));
  public readonly nextDate: Signal<Date | null> = computed(() => this.toDate(this.shiftDate(1)));
  public readonly previousPath: Signal<string | null> = computed(() => this.toPath(this.shiftDate(-1)));
  public readonly nextPath: Signal<string | null> = computed(() => this.toPath(this.shiftDate(1)));
  public readonly todayPath: string = getBornDayPath(this.today);
  public readonly isToday: Signal<boolean> = computed(() => this.isTodayShown());
  public readonly activeFilterCount: Signal<number> = computed(() => countActiveBornFilters(this.filters()));
  public readonly year: Signal<number | null> = computed(() => this.filters().year);
  // The chosen year marked in the year picker, which otherwise opens on the current year. The picker offers years from 1
  // to the current one, taken in UTC like the API takes it.
  public readonly yearPickerValue: Signal<Date | null> = computed(() => this.toYearPickerValue(this.year()));
  public readonly yearPickerMin: Date = toYearDate(1);
  public readonly yearPickerMax: Date = toYearDate(new Date().getUTCFullYear());
  // February 29 exists only in leap years.
  public readonly yearFilter: Signal<(date: Date | null) => boolean> = computed(() => this.createYearFilter(this.date()));
  public readonly countryOptions: Signal<BornCountryOption[]> = computed(() => this.getCountryOptions());
  public readonly cards: Signal<CelebrityCard[]> = computed(() => this.celebrities().map((celebrity: CelebrityDto) => this.toCard(celebrity)));
  // The page credits Wikimedia Commons once a photo is shown.
  public readonly hasPhotos: Signal<boolean> = computed(() => this.cards().some((card: CelebrityCard) => !!card.photo));
  public readonly hasMore: Signal<boolean> = computed(() => this.celebrities().length < this.total());

  private toYearPickerValue(year: number | null): Date | null {
    return year === null ? null : toYearDate(year);
  }

  private createYearFilter(date: BornDate | null): (year: Date | null) => boolean {
    return (year: Date | null) => !date || !year || isCelebrityBirthYear(year.getFullYear(), date.month, date.day);
  }

  private isTodayShown(): boolean {
    const date: BornDate | null = this.date();

    return !!date && isSameBornDate(date, this.today);
  }

  private shiftDate(days: number): BornDate | null {
    const date: BornDate | null = this.date();

    return date && shiftBornDate(date, days);
  }

  private toDate(date: BornDate | null): Date | null {
    return date && toReferenceDate(date);
  }

  private toPath(date: BornDate | null): string | null {
    return date && getBornDayPath(date);
  }

  private getCountryOptions(): BornCountryOption[] {
    return CELEBRITY_COUNTRIES.map((code: string) => ({ code, name: this.getCountryName(code) }));
  }

  private getCountryName(code: string): string {
    return this.countryNames().of(code) ?? code;
  }

  private toCountry(code: string): CelebrityCountry {
    const file = `${code.toLowerCase()}.svg`;

    if (BORN_HISTORICAL_COUNTRY_CODES.has(code)) {
      return { code, name: null, flagUrl: BORN_HISTORICAL_FLAG_CODES.has(code) ? `assets/images/flags/${file}` : null };
    }

    return { code, name: this.getCountryName(code), flagUrl: BORN_CODES_WITHOUT_FLAG.has(code) ? null : `assets/flags/${file}` };
  }

  private toCard(celebrity: CelebrityDto): CelebrityCard {
    const birthYear = Number(celebrity.birthDate.slice(0, 4));
    const deathYear: number | null = celebrity.deathDate ? Number(celebrity.deathDate.slice(0, 4)) : null;

    return {
      id: celebrity.id,
      name: celebrity.name,
      occupation: celebrity.occupation,
      countries: celebrity.countries.map((code: string) => this.toCountry(code)),
      birthYear,
      deathYear,
      age: deathYear === null ? this.currentYear - birthYear : null,
      wikipediaUrl: celebrity.wikipediaUrl,
      photo: celebrity.photo,
    };
  }
}
