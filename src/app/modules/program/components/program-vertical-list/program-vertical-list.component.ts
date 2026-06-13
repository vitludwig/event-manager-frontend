import {Component, computed, inject, Input, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {IProgramPlace} from '../../types/IProgramPlace';
import {ProgramService} from '../../services/program/program.service';
import dayjs from 'dayjs';
import {IEvent} from '../../types/IEvent';
import {MatIconModule} from '@angular/material/icon';
import {MatRippleModule} from '@angular/material/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateEventPropertyPipe} from '../../pipes/translate-event-property/translate-event-property.pipe';
import {EventDetailFullComponent} from "../event-detail-full/event-detail-full.component";
import {LocalizedNamePipe} from '../../pipes/localized-name/localized-name.pipe';

@Component({
    selector: 'app-program-vertical-list',
    imports: [
        CommonModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatRippleModule,
        TranslateModule,
        TranslateEventPropertyPipe,
        LocalizedNamePipe,
    ],
    templateUrl: './program-vertical-list.component.html',
    styleUrls: ['./program-vertical-list.component.scss']
})
export class ProgramVerticalListComponent {
	@Input()
	public set events(value: IEvent[] | null) {
		this.#events.set(value);
	}

	public get events(): IEvent[] | null {
		return this.#events();
	}

	protected readonly placesById = computed(() => {
		const places = this.programService.places();
		const result: Record<string, IProgramPlace> = {};
		for(const place of places) {
			result[place.id] = place;
		}
		return result;
	});

	protected readonly groupEvents = computed(() => {
		return this.getGroupedEventsByDay(this.#events());
	});

	private readonly programService: ProgramService = inject(ProgramService);
	private readonly dialog: MatDialog = inject(MatDialog);
	protected readonly translate: TranslateService = inject(TranslateService);

	#events = signal<IEvent[] | null>([]);

	protected openFullDetail(event: IEvent, place: IProgramPlace): void {
		this.dialog.open(EventDetailFullComponent, {
			data: {
				event: event,
				place: place,
			},
			panelClass: 'full-overlay',
		});
	}

	protected toggleFavorite(event: IEvent, clickEvent: MouseEvent): void {
		clickEvent.stopPropagation();
		event.favorite = !event.favorite;
		this.programService.updateEvent(event, 'favorite', event.favorite);
	}

	private getGroupedEventsByDay(events: IEvent[] | null): Record<number, IEvent[]> {
		if(!events) {
			return {};
		}

		const result: Record<number, IEvent[]> = {};

		for(const event of events) {
			// Group by the event's own start-day so nothing is silently dropped.
			// (The festival day list intentionally omits some early-morning days,
			// which previously made favourited/searched events vanish here.)
			const day = dayjs(event.startAt).startOf('day').valueOf();
			if(!result[day]) {
				result[day] = [];
			}
			result[day].push(event);
		}

		for(const [day, dayEvents] of Object.entries(result)) {
			// @ts-ignore
			result[day] = dayEvents.sort((prev, next) =>  new Date(prev.startAt).valueOf() - new Date(next.startAt).valueOf());
		}

		return result;
	}
}
