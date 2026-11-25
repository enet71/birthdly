import { Route } from '@angular/router';
import { RoadmapPageComponent } from './components';
import { RoadmapController, RoadmapState } from './state';

export const ROADMAP_ROUTES: Route[] = [
  {
    path: '',
    component: RoadmapPageComponent,
    providers: [RoadmapState, RoadmapController],
  },
];
