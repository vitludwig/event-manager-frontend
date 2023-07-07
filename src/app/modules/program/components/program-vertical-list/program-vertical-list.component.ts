import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {IProgramPlace} from '../../types/IProgramPlace';
import {ProgramService} from '../../services/program/program.service';
import * as dayjs from 'dayjs';
import {IEvent} from '../../types/IEvent';
import {MatIconModule} from '@angular/material/icon';
import {Subject, takeUntil} from 'rxjs';
import {MatRippleModule} from '@angular/material/core';
import {EventDetailFullComponent} from '../event-detail-full/event-detail-full.component';
import {MatDialog} from '@angular/material/dialog';
import {FullProgramConfig} from '../full-program/FullProgramConfig';
import {TranslateModule} from '@ngx-translate/core';
import {TranslateEventPropertyPipe} from '../../pipes/translate-event-property/translate-event-property.pipe';
import {ERoute} from '../../../../common/types/ERoute';
import {Router} from '@angular/router';

@Component({
	selector: 'app-program-vertical-list',
	standalone: true,
	imports: [
		CommonModule,
		MatListModule,
		MatButtonModule,
		MatIconModule,
		MatRippleModule,
		TranslateModule,
		TranslateEventPropertyPipe,
	],
	templateUrl: './program-vertical-list.component.html',
	styleUrls: ['./program-vertical-list.component.scss']
})
export class ProgramVerticalListComponent implements OnInit, OnDestroy {
	@Input()
	public set events(value: IEvent[] | null) {
		this.#events = value;
		if(this.#days) {
			this.groupEvents = this.getGroupedEventsByDay(value, this.#days);
		}
	}

	public get events(): IEvent[] | null {
		return this.#events;
	}

	protected placesById: Record<string, IProgramPlace> = {};
	protected groupEvents: Record<number, IEvent[]> = {};

	protected readonly fullProgramConfig = FullProgramConfig;

	private readonly programService: ProgramService = inject(ProgramService);
	private readonly router: Router = inject(Router);
	private readonly dialog: MatDialog = inject(MatDialog);

	#events: IEvent[] | null = [];
	#unsubscribe: Subject<void> = new Subject<void>();
	#days: Record<number, number> = {};

	public ngOnInit(): void {
		this.programService.days$
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe(days => {
				this.#days = days;
				this.groupEvents = this.getGroupedEventsByDay(this.events, days);
			});

		this.programService.places$
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe(places => {
				for(const place of places) {
					this.placesById[place.id] = place;
				}
			});
	}

	public ngOnDestroy(): void {
		this.#unsubscribe.next();
	}

	protected openFullDetail(event: IEvent): void {
		this.router.navigate(['/' + ERoute.EVENT_DETAIL, event.id]);
		this.dialog.closeAll();
	}

	protected toggleFavorite(event: IEvent): void {
		event.favorite = !event.favorite;
		this.programService.updateEvent(event, 'favorite', event.favorite);
	}

	private getGroupedEventsByDay(events: IEvent[] | null, daysRecord: Record<number, number>): Record<number, IEvent[]> {
		if(!events) {
			return {};
		}

		const days = Object.values(daysRecord);
		const result: Record<number, IEvent[]> = {};

		for(const event of events) {
			const eventDayStart = dayjs(event.start).startOf('day').valueOf();
			const day = days.find(day => day === eventDayStart);

			if(day) {
				if(!result[day]) {
					result[day] = [];
				}
				result[day].push(event);
			}
		}

		return result;
	}
}
