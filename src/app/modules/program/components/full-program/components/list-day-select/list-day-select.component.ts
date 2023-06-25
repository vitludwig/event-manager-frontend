import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {IProgramDay} from '../../types/IProgramDay';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-list-day-select',
	standalone: true,
	imports: [CommonModule, MatButtonToggleModule, TranslateModule],
	templateUrl: './list-day-select.component.html',
	styleUrls: ['./list-day-select.component.scss']
})
export class ListDaySelectComponent {

	public get days(): IProgramDay[] {
		return this.#days;
	}

	@Input()
	public set days(value: IProgramDay[]) {
		this.#days = this.getTranslatedDays(value);
	}

	@Input()
	public selectedDay: number;

	@Output()
	public selectedDayChange: EventEmitter<number> = new EventEmitter<number>();

	#translate: TranslateService = inject(TranslateService);
	#days: IProgramDay[];

	constructor() {
		// TODO: remove english translations from cs translation file and vice versa, translate this only from english original in this.days
		// days are translated from en/cs based on reversed strings in translation files and this.days is modified
		this.#translate.onLangChange
			.pipe(takeUntilDestroyed())
			.subscribe(() => {
				this.#days = this.getTranslatedDays(this.#days);
			});
	}

	protected setDay(day: number): void {
		this.selectedDayChange.emit(day);
	}

	private getTranslatedDays(days: IProgramDay[]): IProgramDay[] {
		return days.map((day) => {
			day.name = this.#translate.instant(day.name);
			return day;
		});
	}
}
