import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {IProgramDay} from '../../types/IProgramDay';
import {TranslateModule} from '@ngx-translate/core';
@Component({
	selector: 'app-list-day-select',
	standalone: true,
	imports: [CommonModule, MatButtonToggleModule, TranslateModule],
	templateUrl: './list-day-select.component.html',
	styleUrls: ['./list-day-select.component.scss']
})
export class ListDaySelectComponent {
	@Input()
	public days: IProgramDay[];

	@Input()
	public selectedDay: number;

	@Output()
	public selectedDayChange: EventEmitter<number> = new EventEmitter<number>();

	constructor() {

	}

	protected setDay(day: number): void {
		this.selectedDayChange.emit(day);
	}
}
