import { InjectionToken } from '@angular/core';
import { AppLayoutConfig } from '../types';

export const APP_LAYOUT_CONFIG: InjectionToken<AppLayoutConfig> = new InjectionToken<AppLayoutConfig>('APP_LAYOUT_CONFIG');

// Runs when the sidenav primary action is clicked, on the current page.
export const APP_LAYOUT_PRIMARY_ACTION_HANDLER: InjectionToken<() => void> = new InjectionToken<() => void>('APP_LAYOUT_PRIMARY_ACTION_HANDLER');

// Route `data` key that turns on the top bar search for a route.
export const APP_LAYOUT_SEARCH_DATA_KEY = 'layoutSearch';

// Route `data` key with the top bar heading (an `AppRouteText`) when it should differ from the route title, which also names the browser tab.
export const APP_LAYOUT_HEADING_DATA_KEY = 'layoutHeading';
