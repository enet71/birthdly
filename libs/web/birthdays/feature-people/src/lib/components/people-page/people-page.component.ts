import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { BirthdayAvatarComponent, RelationshipDotComponent } from '@birthday/web-birthdays-ui';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { AppTranslateService, LocaleDatePipe } from '@birthday/web-shared-i18n';
import { StickyPanelComponent } from '@birthday/web-shared-ui';
import { InvitesController, PeopleController, PeopleState } from '../../state';
import { InviteSubmissionsComponent } from '../invite-submissions';
import { PeopleFiltersComponent } from '../people-filters';
import { PeopleSortColumn, PersonRow, RelationshipFilter } from '../../types';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'ui-people-page',
  imports: [
    TranslocoPipe,
    LocaleDatePipe,
    MatButton,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatTable,
    RouterLink,
    BirthdayAvatarComponent,
    InviteSubmissionsComponent,
    PeopleFiltersComponent,
    RelationshipDotComponent,
    StickyPanelComponent,
  ],
  templateUrl: './people-page.component.html',
  styleUrl: './people-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeoplePageComponent {
  protected readonly columns: PeopleSortColumn[] = ['name', 'relationship', 'birthday', 'nextBirthday'];

  private readonly peopleState: ReadonlyState<PeopleState> = injectState(PeopleState);
  private readonly peopleController: PeopleController = inject(PeopleController);
  private readonly invitesController: InvitesController = inject(InvitesController);
  private readonly translator: AppTranslateService = inject(AppTranslateService);

  protected get people(): Signal<PersonRow[]> {
    return this.peopleState.people;
  }

  protected get visiblePeople(): Signal<PersonRow[]> {
    return this.peopleState.visiblePeople;
  }

  protected get searchQuery(): Signal<string> {
    return this.peopleState.searchQuery;
  }

  protected get relationshipFilters(): Signal<RelationshipFilter[]> {
    return this.peopleState.relationshipFilters;
  }

  protected get hasActiveFilters(): Signal<boolean> {
    return this.peopleState.hasActiveFilters;
  }

  protected get sort(): Signal<Sort> {
    return this.peopleState.sort;
  }

  protected get isLoading(): Signal<boolean> {
    return this.peopleState.isLoading;
  }

  protected openAddBirthdayDialog(): void {
    this.peopleController.openAddBirthdayDialog();
  }

  protected resetFilters(): void {
    this.peopleController.resetFilters();
  }

  protected sortPeople(sort: Sort): void {
    this.peopleController.sortPeople(sort);
  }

  protected openInviteDialog(): void {
    this.invitesController.openInviteDialog();
  }

  protected getDaysUntilLabel(daysUntil: number): string {
    if (daysUntil === 0) {
      return this.translator.translate('calendar.today');
    }

    return daysUntil === 1 ? this.translator.translate('calendar.tomorrow') : this.translator.translatePlural('calendar.inDays', daysUntil);
  }
}
