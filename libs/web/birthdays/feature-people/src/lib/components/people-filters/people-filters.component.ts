import { ChangeDetectionStrategy, Component, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect, MatSelectChange, MatSelectTrigger } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { RELATIONSHIP_OPTIONS, RelationshipOption } from '@birthday/web-birthdays-util';
import { RelationshipDotComponent } from '@birthday/web-birthdays-ui';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { PeopleController, PeopleState } from '../../state';
import { RelationshipFilter } from '../../types';

@Component({
  selector: 'ui-people-filters',
  imports: [
    TranslocoPipe,
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatOption,
    MatPrefix,
    MatSelect,
    MatSelectTrigger,
    MatSuffix,
    RelationshipDotComponent,
  ],
  templateUrl: './people-filters.component.html',
  styleUrl: './people-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeopleFiltersComponent {
  private readonly peopleState: ReadonlyState<PeopleState> = injectState(PeopleState);
  private readonly peopleController: PeopleController = inject(PeopleController);

  protected readonly relationshipOptions: RelationshipOption[] = RELATIONSHIP_OPTIONS;
  // Phones show the filters only after the toggle; wider screens always show them.
  protected readonly isPanelOpen: WritableSignal<boolean> = signal(false);

  protected get searchQuery(): Signal<string> {
    return this.peopleState.searchQuery;
  }

  protected get relationshipFilters(): Signal<RelationshipFilter[]> {
    return this.peopleState.relationshipFilters;
  }

  protected get activeFilterCount(): Signal<number> {
    return this.peopleState.activeFilterCount;
  }

  protected get hasActiveFilters(): Signal<boolean> {
    return this.peopleState.hasActiveFilters;
  }

  protected getRelationshipLabel(relationship: RelationshipFilter): string {
    return relationship === 'none' ? 'people.noRelationship' : `relationship.${relationship}`;
  }

  protected searchPeople(event: Event): void {
    this.peopleController.searchPeople((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.peopleController.searchPeople('');
  }

  protected changeRelationships({ value }: MatSelectChange<RelationshipFilter[]>): void {
    this.peopleController.filterPeopleByRelationships(value);
  }

  protected resetFilters(): void {
    this.peopleController.resetFilters();
  }

  protected togglePanel(): void {
    this.isPanelOpen.update((isOpen: boolean) => !isOpen);
  }
}
