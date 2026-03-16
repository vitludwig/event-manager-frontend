import {AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, Renderer2, Signal, signal, ViewChild, WritableSignal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {IEvent} from '../../types/IEvent';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import dayjs, {Dayjs} from 'dayjs';
import {ProgramService} from '../../services/program/program.service';
import {MatTabsModule} from '@angular/material/tabs';
import {IProgramSegment} from './types/IProgramSegment';
import {FullProgramConfig} from './FullProgramConfig';
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
import {TranslateModule} from '@ngx-translate/core';
import {LanguageMenuComponent} from '../../../../common/components/language-menu/language-menu.component';
import {ExportFavoritesComponent} from '../export-favorites/export-favorites.component';
import {MatMenuModule} from '@angular/material/menu';
import {IProgramDay} from './types/IProgramDay';
import {UserInfoComponent} from '../../../../common/components/user-info/user-info.component';
import {SettingsService} from "../../../../common/services/settings/settings.service";
import {EDisplayDevice} from "../../../../common/types/EDisplayDevice";
import ProgramConfig from "../../config/ProgramConfig";
import {MatBadge} from "@angular/material/badge";
import {CustomizationService} from "../../../../common/services/customization/customization.service";


@Component({
    selector: 'app-full-program',
    imports: [
    MatTabsModule,
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
    MatBadge
],
    templateUrl: './full-program.component.html',
    styleUrls: ['./full-program.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullProgramComponent implements AfterViewInit {
	@ViewChild('secondaryToolbar')
	public secondaryToolbar: ElementRef;

	@ViewChild(ListTimelineComponent)
	public timeline: ListTimelineComponent;

	@ViewChild('programList')
	private programListRef: ElementRef<HTMLDivElement>;

	protected selectedEvent: IProgramEvent | null = null;

	protected readonly EDisplayDevice = EDisplayDevice;

	protected readonly programService: ProgramService = inject(ProgramService);
	private readonly customizationService: CustomizationService = inject(CustomizationService);

	protected get logoUrl(): string | undefined { return this.customizationService.logoUrl; }
	protected get festivalId(): string | undefined { return this.customizationService.festivalId; }
	private readonly bottomSheet: MatBottomSheet = inject(MatBottomSheet);
	private readonly dialog: MatDialog = inject(MatDialog);
	private readonly renderer: Renderer2 = inject(Renderer2);
	protected readonly settingsService: SettingsService = inject(SettingsService);
	private readonly destroyRef: DestroyRef = inject(DestroyRef);

	protected readonly zoomLevel: WritableSignal<number> = signal(1.0);
	private readonly MIN_ZOOM = 0.4;
	private readonly MAX_ZOOM = 1.0;
	private pinchStartDistance: number | null = null;
	private pinchStartZoom: number = 1.0;
	private readonly boundTouchMove = (e: TouchEvent) => this.onTouchMove(e);

	protected readonly days: Signal<IProgramDay[]> = computed(() => {
		return this.getParsedDays(this.programService.days());
	});

	protected get selectedDay(): number | undefined {
		return this.programService.selectedDay();
	}

	protected set selectedDay(value: number) {
		this.programService.selectedDay.set(value);
		this.applyFilters(this.programService.userFilterOptions);

		if(this.timeline) {
			setTimeout(() => {
				this.timeline?.scrollToNowSegment();
			}, 0);
		}
	}

	protected readonly filteredEvents: Signal<IEvent[]> = computed(() => {
		const selectedDay = this.programService.selectedDay();
		const events = this.programService.events();
		if(!selectedDay) {
			return events;
		}
		return this.filterEventsByDay(events, selectedDay);
	});

	/**
	 * Events filtered by place for segment computation (excludes empty start/end segments)
	 */
	readonly #eventsForSegments: Signal<IEvent[]> = computed(() => {
		const events = this.filteredEvents();
		if(events.length === 0) {
			return [];
		}

		const placeFilter = this.programService.userFilterOptions.locationId;
		if(Array.isArray(placeFilter) && placeFilter.length > 0) {
			return events.filter((event) => placeFilter.includes(event.locationId));
		}
		return events;
	});

	readonly #firstEventAt: Signal<Dayjs | null> = computed(() => {
		const events = this.#eventsForSegments();
		if(events.length === 0) {
			return null;
		}
		const allStarts = events.map((event) => event.startAt);
		const firstEventAt = allStarts.reduce((prev, curr) => prev < curr ? prev : curr);
		return dayjs(firstEventAt).set('minutes', 0);
	});

	protected readonly allSegments: Signal<IProgramSegment[]> = computed(() => {
		const events = this.#eventsForSegments();
		const firstEventAt = this.#firstEventAt();
		if(events.length === 0 || !firstEventAt) {
			return [];
		}

		const allEnds = events.map((event) => event.endAt);
		const lastEventAt = allEnds.reduce((prev, curr) => prev > curr ? prev : curr);
		const segmentCount = this.getSegmentsFromMilliseconds(Math.abs(firstEventAt.diff(dayjs(lastEventAt))));

		return Array(segmentCount).fill(1).map((value, index) => {
			const incIndex = index * FullProgramConfig.segmentDuration;
			const time = firstEventAt.add(incIndex, 'minutes').format('HH:mm');
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
	});

	protected readonly places: Signal<IProgramPlace[]> = computed(() => {
		return this.programService.places();
	});

	protected readonly eventsByPlaces: Signal<Record<string, Record<number, IProgramEvent>>> = computed(() => {
		const allEvents = this.filteredEvents();
		const firstEventAt = this.#firstEventAt();
		const selectedDay = this.programService.selectedDay();
		if(!firstEventAt || !selectedDay) {
			return {};
		}

		const result: Record<string, Record<number, IProgramEvent>> = {};

		for(const event of allEvents) {
			const selectedDayJs = dayjs(selectedDay);
			const eventStart = dayjs(event.startAt);
			const eventEnd = dayjs(event.endAt);
			const dayStart = eventStart.set('hour', firstEventAt.hour()).set('minutes', firstEventAt.minute()).set('date', selectedDayJs.get('date'));
			const startSegment = this.getSegmentsFromMilliseconds(Math.abs(dayStart.diff(eventStart)));
			const segmentCount = this.getSegmentsFromMilliseconds(Math.abs(eventStart.diff(eventEnd)));

			if(!result[event.locationId]) {
				result[event.locationId] = {};
			}

			result[event.locationId][startSegment] = {
				...event,
				startSegment,
				segmentCount
			};
		}

		return result;
	});

	constructor() {
	}

	public ngAfterViewInit(): void {
		this.programListRef?.nativeElement.addEventListener('touchmove', this.boundTouchMove, { passive: false });
		this.destroyRef.onDestroy(() => {
			this.programListRef?.nativeElement.removeEventListener('touchmove', this.boundTouchMove);
		});
	}

	protected showEventDetail(event: IProgramEvent, place: IProgramPlace): void {
		this.bottomSheet.open(EventDetailPreviewComponent, {
			data: {
				event, place
			},
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

		dialog.afterClosed().pipe(
			takeUntilDestroyed(this.destroyRef),
		).subscribe((result) => {
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
		const today = this.findToday(this.days());
		this.programService.selectedDay.set(today?.id ?? 0);
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

		this.programService.filterPlaces(options.locationId);
		this.programService.filterEvents({
			eventType: options.eventType,
			onlyFavorite: options.onlyFavorite,
			tags: options.tags,
		});
	}

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

	private getSegmentsFromMilliseconds(milliseconds: number): number {
		return Math.ceil(milliseconds / 1000 / 60 / FullProgramConfig.segmentDuration);
	}

	private filterEventsByDay(events: IEvent[], day?: number): IEvent[] {
		return events.filter((event) => {
			const eventStart = dayjs(event.startAt);
			const nextDay = dayjs(day).add(1, 'day');
			const isEarlyNextDayEvent = eventStart.isSame(nextDay, 'day') && (eventStart.get('hour') <= ProgramConfig.eventStartHourThreshold);
			const isSelectedDayEvent = eventStart.isSame(day, 'day') && eventStart.get('hour') > ProgramConfig.eventStartHourThreshold;
			return isSelectedDayEvent || isEarlyNextDayEvent;
		});
	}

	protected onTouchStart(event: TouchEvent): void {
		if (event.touches.length === 2) {
			this.pinchStartDistance = this.getTouchDistance(event.touches);
			this.pinchStartZoom = this.zoomLevel();
		}
	}

	protected onTouchMove(event: TouchEvent): void {
		if (event.touches.length === 2 && this.pinchStartDistance !== null) {
			event.preventDefault();
			const currentDistance = this.getTouchDistance(event.touches);
			const scale = currentDistance / this.pinchStartDistance;
			this.zoomLevel.set(Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, this.pinchStartZoom * scale)));
		}
	}

	protected onTouchEnd(event: TouchEvent): void {
		if (event.touches.length < 2) {
			this.pinchStartDistance = null;
		}
	}

	private getTouchDistance(touches: TouchList): number {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}
}
