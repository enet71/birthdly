import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { isCelebrityBirthYear } from '@birthday/shared-models';
import { BORN_YEAR_QUERY_PARAM } from '../constants';
import { getBornDayPath, parseBornYear, readBornDate } from '../helpers';
import { BornDate } from '../types';

// A year the date does not exist in (February 29 of a common year, after the arrows or the datepicker kept the year) or
// one the filter does not accept is removed from the URL, keeping the other filters.
export const bornYearGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const date: BornDate | null = readBornDate(route);
  const value: string | null = route.queryParamMap.get(BORN_YEAR_QUERY_PARAM);
  const year: number | null = parseBornYear(value);

  if (!date || value === null || (year !== null && isCelebrityBirthYear(year, date.month, date.day))) {
    return true;
  }

  return inject(Router).createUrlTree([getBornDayPath(date)], { queryParams: { ...route.queryParams, [BORN_YEAR_QUERY_PARAM]: null } });
};
