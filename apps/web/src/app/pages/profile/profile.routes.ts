import { Route } from '@angular/router';
import { ProfileController, ProfileState } from '@birthday/web-auth-feature-account';
import { ProfileComponent } from './profile.component';

export const PROFILE_ROUTES: Route[] = [
  {
    path: '',
    component: ProfileComponent,
    providers: [ProfileState, ProfileController],
  },
];
