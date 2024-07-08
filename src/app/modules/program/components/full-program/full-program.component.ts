import {
	Component, ElementRef, inject, OnDestroy,
	OnInit, Renderer2, ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IEvent} from '../../types/IEvent';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import * as dayjs from 'dayjs';
import {ProgramService} from '../../services/program/program.service';
import {MatTabsModule} from '@angular/material/tabs';
import {Dayjs} from 'dayjs';
import {IProgramSegment} from './types/IProgramSegment';
import {FullProgramConfig} from './FullProgramConfig';
import {ListEventComponent} from './components/list-event/list-event.component';
import {EventDetailPreviewComponent} from './components/event-detail-preview/event-detail-preview.component';
import {ListTimelineComponent} from './components/list-timeline/list-timeline.component';
import {ListPlaceComponent} from './components/list-place/list-place.component';
import {ListDaySelectComponent} from './components/list-day-select/list-day-select.component';
import {MatBottomSheet, MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ListFilterComponent} from './components/list-filter/list-filter.component';
import {IProgramFilterOptions} from './types/IProgramFilterOptions';
import {
	ProgramVerticalListDialogComponent
} from '../program-vertical-list/components/program-vertical-list-dialog/program-vertical-list-dialog.component';
import {Subject, takeUntil} from 'rxjs';
import {TranslateModule} from '@ngx-translate/core';
import {LanguageMenuComponent} from '../../../../common/components/language-menu/language-menu.component';
import {ExportFavoritesComponent} from '../export-favorites/export-favorites.component';
import {MatMenuModule} from '@angular/material/menu';
import {IProgramDay} from './types/IProgramDay';
import {UserService} from '../../../../common/services/user/user.service';
import {UserInfoComponent} from '../../../../common/components/user-info/user-info.component';


@Component({
	selector: 'app-full-program',
	standalone: true,
	imports: [
		CommonModule,
		MatTabsModule,
		ListEventComponent,
		EventDetailPreviewComponent,
		ListTimelineComponent,
		ListPlaceComponent,
		ListDaySelectComponent,
		MatBottomSheetModule,
		MatToolbarModule,
		MatButtonModule,
		MatIconModule,
		MatDialogModule,
		TranslateModule,
		LanguageMenuComponent,
		MatMenuModule,
		UserInfoComponent,
	],
	templateUrl: './full-program.component.html',
	styleUrls: ['./full-program.component.scss']
})
export class FullProgramComponent implements OnInit, OnDestroy {
	@ViewChild('secondaryToolbar')
	public secondaryToolbar: ElementRef;

	@ViewChild(ListTimelineComponent)
	public timeline: ListTimelineComponent;

	// n-minute segments for day
	protected allSegments: IProgramSegment[] = [];
	protected days: IProgramDay[] = [];
	protected places: IProgramPlace[] = [];
	/**
	 * Events grouped by place and start date
	 * Example: {<placeId>>: {<startTime>: event1}
	 * @protected
	 */
	protected eventsByPlaces: Record<string, Record<number, IProgramEvent>> = {};
	protected selectedEvent: IProgramEvent | null = null;

	protected get selectedDay(): number {
		return this.#selectedDay;
	}

	protected set selectedDay(value: number) {
		this.#selectedDay = value;
		this.programService.selectedDay = value;
		this.applyFilters(this.programService.userFilterOptions);

		if(this.timeline) {
			setTimeout(() => {
				this.timeline.scrollToNowSegment();
			}, 0);
		}
	}

	protected readonly FullProgramConfig = FullProgramConfig;

	#firstEventAt: Dayjs;
	#selectedDay: number;
	#unsubscribe: Subject<void> = new Subject<void>();

	protected readonly programService: ProgramService = inject(ProgramService);
	private readonly bottomSheet: MatBottomSheet = inject(MatBottomSheet);
	private readonly dialog: MatDialog = inject(MatDialog);
	private readonly renderer: Renderer2 = inject(Renderer2);
	private readonly userService: UserService = inject(UserService);

	public ngOnInit(): void {
		this.loadPlaces();
		this.loadEvents();

		this.selectedDay = this.programService.selectedDay ?? this.findToday(this.days)?.id ?? 0;
	}

	public ngOnDestroy(): void {
		this.#unsubscribe.next();
	}

	protected showEventDetail(event: IProgramEvent): void {
		this.bottomSheet.open(EventDetailPreviewComponent, {
			data: {event: event},
			panelClass: 'mat-bottom-sheet-fullwidth',
		});
		this.selectedEvent = event;
	}

	protected showEventList(): void {
		this.dialog.open(ProgramVerticalListDialogComponent, {
			data: {events: this.programService.allEvents},
			panelClass: 'full-overlay',
		});
	}


	protected showFilters(): void {
		const dialog = this.dialog.open(ListFilterComponent, {
			data: {options: this.programService.userFilterOptions},
		});

		dialog.afterClosed().subscribe((result) => {
			if(result) {
				this.programService.userFilterOptions = result;
				this.applyFilters(result);
			}
		});
	}

	protected exportFavorites(): void {
		this.dialog.open(ExportFavoritesComponent, {
			width: '600px',
		});
	}

	protected toggleSecondaryToolbar(): void {
		if(this.secondaryToolbar.nativeElement.classList.contains('opened')) {
			this.renderer.removeClass(this.secondaryToolbar.nativeElement, 'opened');
		} else {
			this.renderer.addClass(this.secondaryToolbar.nativeElement, 'opened');
		}
	}

	protected scrollToNow(): void {
		this.selectedDay = this.findToday(this.days)?.id ?? 0;
		this.timeline.scrollToNowSegment();
	}

	protected toggleEventDetails(): void {
		this.programService.showEventDetails = !this.programService.showEventDetails;
	}

	protected refreshApp(): void {
		window.location.reload();
	}

	private applyFilters(options?: IProgramFilterOptions): void {
		if(!options) {
			return;
		}

		this.places = [];
		this.eventsByPlaces = {};
		this.programService.filterPlaces(options.placeId);
		this.programService.filterEvents({
			eventType: options.eventType,
			onlyFavorite: options.onlyFavorite,
		});
	}

	/**
	 * Loads all segments for day based on start and end times of day's events
	 *
	 * @param events
	 * @protected
	 */
	private loadDayTimeSegments(events: IEvent[]): void {
		this.allSegments = [];
		if(events.length === 0) {
			return;
		}

		// Filter events by place if place filter is set, so we don't display empty start/end segments
		if(Array.isArray(this.programService.userFilterOptions.placeId) && this.programService.userFilterOptions.placeId.length > 0) {
			events = events.filter((event) => this.programService.userFilterOptions.placeId?.includes(event.placeId));
		}

		// TODO: find a way how to optimize this - store days and compute this only if they differ
		const allStarts = events.map((event) => event.start);
		const allEnds = events.map((event) => event.end);
		const firstEventAt = allStarts.reduce((prev, curr) => prev < curr ? prev : curr);
		const lastEventAt = allEnds.reduce((prev, curr) => prev > curr ? prev : curr);
		// round it to whole hour, so we don't display thresholds like 9:15
		this.#firstEventAt = dayjs(firstEventAt).set('minutes', 0);
		const segmentCount = this.getSegmentsFromMilliseconds(Math.abs(this.#firstEventAt.diff(dayjs(lastEventAt))));
		const startingTime = this.#firstEventAt;

		this.allSegments = Array(segmentCount).fill(1).map((value, index) => {
			let time = null;

			// Increment time by 15 minutes on every segment and display it only on full hours
			const incIndex = index * FullProgramConfig.segmentDuration;
			time = startingTime.add(incIndex, 'minutes').format('HH:mm');
			let isWholeHour = false;
			if(incIndex % (60 / FullProgramConfig.segmentDuration) === 0) {
				isWholeHour = true;
			}

			return {
				time,
				isWholeHour,
				index
			};
		});
	}

	/**
	 * Load events to hashmap by place and start time
	 * @param allEvents
	 * @private
	 */
	private loadEventsByPlaces(allEvents: IEvent[]): void {
		let dayStart;
		let eventStart;
		let eventEnd;
		let startSegment;
		let segmentCount;

		for(const event of allEvents) {
			eventStart = dayjs(event.start);
			eventEnd = dayjs(event.end);
			dayStart = eventStart.set('hour', this.#firstEventAt.hour()).set('minutes', this.#firstEventAt.minute());
			// convert to seconds -> minutes -> 15 minutes segments
			startSegment = this.getSegmentsFromMilliseconds(Math.abs(dayStart.diff(eventStart)));
			segmentCount = this.getSegmentsFromMilliseconds(Math.abs(eventStart.diff(eventEnd)));

			if(!this.eventsByPlaces[event.placeId]) {
				this.eventsByPlaces[event.placeId] = {};
			}

			this.eventsByPlaces[event.placeId][startSegment] = {
				...event,
				startSegment,
				segmentCount
			};
		}
	}

	/**
	 * Sets selected day and loads events for that day
	 * @param day
	 * @protected
	 */
	private loadEvents(day: number = this.selectedDay): void {
		this.programService.getEvents(day)
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe((events) => {
				events = this.filterEventsByDay(events, this.selectedDay);

				this.loadDays();
				this.loadDayTimeSegments(events);
				this.loadEventsByPlaces(events);
			});
	}

	private loadPlaces(): void {
		this.programService.places$
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe((places) => {
				this.places = places;
			});
	}

	private loadDays(): void {
		this.programService.days$
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe((days) => {
				this.days = this.getParsedDays(days);
			});
	}

	/**
	 * Loads days from program service and transforms them into array of objects with day name and id
	 * @protected
	 */
	private getParsedDays(days: Record<number, number>): IProgramDay[] {
		return Object.entries(days).sort().map(([id, date]) => {
			return {
				id: Number(id),
				name: dayjs(date).format('dddd'),
				date: date,
			};
		});
	}

	private findToday(days: IProgramDay[]): IProgramDay | undefined {
		const today = dayjs();
		return days.find((day) => dayjs(day.date).isSame(today, 'day'));
	}

	/**
	 * Converts milliseconds to n-minutes segments
	 * @param milliseconds
	 * @private
	 */
	private getSegmentsFromMilliseconds(milliseconds: number): number {
		return Math.ceil(milliseconds / 1000 / 60 / FullProgramConfig.segmentDuration);
	}

	private filterEventsByDay(events: IEvent[], day: number): IEvent[] {
		return events.filter((event) => {
			return dayjs(event.start).isSame(day, 'day');
		});
	}
}
