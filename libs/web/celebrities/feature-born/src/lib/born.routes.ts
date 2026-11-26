import { Route } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { APP_DESCRIPTION_DATA_KEY, APP_DOCUMENT_TITLE_DATA_KEY, APP_STRUCTURED_DATA_DATA_KEY } from '@birthday/web-shared-util';
import { BornDayPageComponent } from './components';
import { BORN_CELEBRITIES_DATA_KEY, BORN_DAY_PARAM, BORN_MONTH_PARAM } from './constants';
import { bornDateGuard, bornYearGuard } from './guards';
import { buildBornDayDescription, buildBornDayDocumentTitle, buildBornDayStructuredData, getBornDaySegments, toBornDate } from './helpers';
import { bornDayResolver } from './resolvers';
import { BornDayController, BornDayState } from './state';

export const BORN_ROUTES: Route[] = [
  {
    // The section opens on today's date.
    path: '',
    pathMatch: 'full',
    redirectTo: () => getBornDaySegments(toBornDate(new Date())),
  },
  {
    path: `:${BORN_MONTH_PARAM}/:${BORN_DAY_PARAM}`,
    canMatch: [bornDateGuard],
    canActivate: [bornYearGuard],
    component: BornDayPageComponent,
    providers: [BornDayState, BornDayController, provideNativeDateAdapter()],
    // The filters live in the query, so the year guard checks them and the resolver passes them to the State.
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    resolve: { [BORN_CELEBRITIES_DATA_KEY]: bornDayResolver },
    title: 'routes.born.title',
    data: {
      [APP_DOCUMENT_TITLE_DATA_KEY]: buildBornDayDocumentTitle,
      [APP_DESCRIPTION_DATA_KEY]: buildBornDayDescription,
      [APP_STRUCTURED_DATA_DATA_KEY]: buildBornDayStructuredData,
    },
  },
];
