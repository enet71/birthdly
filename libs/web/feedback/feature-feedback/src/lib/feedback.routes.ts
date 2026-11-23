import { Route } from '@angular/router';
import { FeedbackPageComponent } from './components';
import { FeedbackController, FeedbackState } from './state';

export const FEEDBACK_ROUTES: Route[] = [
  {
    path: '',
    component: FeedbackPageComponent,
    providers: [FeedbackState, FeedbackController],
  },
];
