import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-party-hat',
  templateUrl: './party-hat.component.html',
  styleUrl: './party-hat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyHatComponent {}
