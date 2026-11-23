import { Route } from '@angular/router';
import { AdminFeedbackPageComponent } from './components';
import { AdminFeedbackController, AdminFeedbackState } from './state';

export const ADMIN_FEEDBACK_ROUTES: Route[] = [
  {
    path: '',
    component: AdminFeedbackPageComponent,
    providers: [AdminFeedbackState, AdminFeedbackController],
  },
];
