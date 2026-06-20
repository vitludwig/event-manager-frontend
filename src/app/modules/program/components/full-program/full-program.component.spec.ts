import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';

import {FullProgramComponent} from './full-program.component';
import {ProgramService} from '../../services/program/program.service';
import {IEvent} from '../../types/IEvent';
import {IProgramPlace} from '../../types/IProgramPlace';
import {IProgramFilterOptions} from './types/IProgramFilterOptions';
import {IEventType} from '../../types/IEventType';
import dayjs from 'dayjs';

function createMockPlace(id: string, name: string = `Place ${id}`): IProgramPlace {
	return {id, name};
}

function createMockEventType(id: string = 'type1'): IEventType {
	return {id, name: 'Concert', color: '#f00'};
}

function createMockEvent(overrides: Partial<IEvent> = {}): IEvent {
	const location = createMockPlace('place1');
	return {
		id: 'event1',
		nameCs: 'Test Event',
		nameEn: 'Test Event EN',
		descriptionCs: '',
		descriptionEn: '',
		startAt: '2025-07-10T14:00:00Z',
		endAt: '2025-07-10T15:00:00Z',
		locationId: 'place1',
		location,
		favorite: false,
		eventType: createMockEventType(),
		tags: [],
		...overrides,
	};
}

class MockProgramService {
	selectedDay = signal<number | undefined>(undefined);
	events = signal<IEvent[]>([]);
	places = signal<IProgramPlace[]>([]);
	days = signal<Record<number, number>>({});
	userFilterOptions: IProgramFilterOptions = {};
	activeFiltersCount = 0;
	allEvents: IEvent[] = [];
	showEventDetails = false;
	favorites: IEvent[] = [];
	eventTypes = signal<IEventType[]>([]);
	tags: any[] = [];

	filterEvents = jasmine.createSpy('filterEvents');
	filterPlaces = jasmine.createSpy('filterPlaces');
	updateEvent = jasmine.createSpy('updateEvent');
}

describe('FullProgramComponent', () => {
	let component: FullProgramComponent;
	let mockProgramService: MockProgramService;

	beforeEach(async () => {
		mockProgramService = new MockProgramService();

		await TestBed.configureTestingModule({
			imports: [
				FullProgramComponent,
				NoopAnimationsModule,
				TranslateModule.forRoot(),
			],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: ActivatedRoute, useValue: {queryParams: of({})}},
			],
		}).compileComponents();

		const fixture = TestBed.createComponent(FullProgramComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('days computed signal', () => {
		it('should return empty array when no days', () => {
			expect((component as any).days()).toEqual([]);
		});

		it('should parse days from service days signal', () => {
			const dayTimestamp = dayjs('2025-07-10').startOf('day').valueOf();
			mockProgramService.days.set({[dayTimestamp]: dayTimestamp});

			TestBed.flushEffects();

			const days = (component as any).days();
			expect(days.length).toBe(1);
			expect(days[0].id).toBe(dayTimestamp);
			expect(days[0].date).toBe(dayTimestamp);
			expect(days[0].name).toBeTruthy();
		});

		it('should sort days chronologically', () => {
			const day1 = dayjs('2025-07-10').startOf('day').valueOf();
			const day2 = dayjs('2025-07-11').startOf('day').valueOf();
			mockProgramService.days.set({[day2]: day2, [day1]: day1});

			TestBed.flushEffects();

			const days = (component as any).days();
			expect(days[0].id).toBe(day1);
			expect(days[1].id).toBe(day2);
		});
	});

	describe('selectedDay', () => {
		it('should read selectedDay from service', () => {
			expect((component as any).selectedDay).toBeUndefined();
			mockProgramService.selectedDay.set(123);
			expect((component as any).selectedDay).toBe(123);
		});
	});

	describe('filteredEvents computed signal', () => {
		it('should return all events when no selectedDay', () => {
			const events = [createMockEvent({id: 'e1'}), createMockEvent({id: 'e2'})];
			mockProgramService.events.set(events);

			TestBed.flushEffects();

			expect((component as any).filteredEvents().length).toBe(2);
		});

		it('should filter events by selectedDay', () => {
			const baseDay = dayjs('2025-07-10');
			const nextDay = dayjs('2025-07-11');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', startAt: baseDay.hour(14).toISOString(), endAt: baseDay.hour(15).toISOString()}),
				createMockEvent({id: 'e2', startAt: nextDay.hour(10).toISOString(), endAt: nextDay.hour(12).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e1');
		});

		it('should include early morning next-day events in current day', () => {
			const baseDay = dayjs('2025-07-10');
			const nextDay = dayjs('2025-07-11');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', startAt: baseDay.hour(20).toISOString(), endAt: baseDay.hour(22).toISOString()}),
				createMockEvent({id: 'e2', startAt: nextDay.hour(2).toISOString(), endAt: nextDay.hour(4).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(2);
		});

		it('should include events starting after the threshold hour on selected day', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', startAt: baseDay.hour(7).toISOString(), endAt: baseDay.hour(8).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e1');
		});

		it('should assign events at threshold hour to previous day (early next-day)', () => {
			const baseDay = dayjs('2025-07-10');
			const nextDay = dayjs('2025-07-11');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', startAt: nextDay.hour(6).toISOString(), endAt: nextDay.hour(8).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e1');
		});

		it('should exclude pre-threshold events from their own calendar day', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', startAt: baseDay.hour(5).toISOString(), endAt: baseDay.hour(6).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(0);
		});

		it('should show after-midnight favorite events on previous day', () => {
			const baseDay = dayjs('2025-07-10');
			const nextDay = dayjs('2025-07-11');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', favorite: true, startAt: baseDay.hour(22).toISOString(), endAt: nextDay.hour(2).toISOString()}),
				createMockEvent({id: 'e2', favorite: true, startAt: nextDay.hour(1).toISOString(), endAt: nextDay.hour(3).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(2);
			expect(filtered.map((e: any) => e.id)).toContain('e1');
			expect(filtered.map((e: any) => e.id)).toContain('e2');
		});
	});

	describe('allSegments computed signal', () => {
		it('should return empty array when no events', () => {
			expect((component as any).allSegments()).toEqual([]);
		});

		it('should compute segments from events', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const startTime = baseDay.hour(10).minute(0).second(0).toISOString();
			const endTime = baseDay.hour(11).minute(0).second(0).toISOString();
			const events = [
				createMockEvent({
					id: 'e1',
					startAt: startTime,
					endAt: endTime,
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const segments = (component as any).allSegments();
			expect(segments.length).toBeGreaterThan(0);
			expect(segments.length).toBe(4);
			expect(segments[0].isWholeHour).toBeTrue();
			expect(segments[0].index).toBe(0);
		});

		it('should mark only whole hours', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const startTime = baseDay.hour(10).minute(0).second(0).toISOString();
			const endTime = baseDay.hour(11).minute(0).second(0).toISOString();
			const events = [
				createMockEvent({
					id: 'e1',
					startAt: startTime,
					endAt: endTime,
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const segments = (component as any).allSegments();
			expect(segments.length).toBe(4);
			expect(segments[0].isWholeHour).toBeTrue();
			expect(segments[1].isWholeHour).toBeFalse();
			expect(segments[2].isWholeHour).toBeFalse();
			expect(segments[3].isWholeHour).toBeFalse();
		});
	});

	describe('eventsByPlaces computed signal', () => {
		it('should return empty object when no events', () => {
			expect((component as any).eventsByPlaces()).toEqual({});
		});

		it('should group events by locationId', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', locationId: 'p2', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).minute(30).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const result = (component as any).eventsByPlaces();
			expect(Object.keys(result)).toContain('p1');
			expect(Object.keys(result)).toContain('p2');
		});

		it('should produce a single-lane layout with startSegment/segmentCount', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({
					id: 'e1',
					locationId: 'p1',
					startAt: baseDay.hour(10).toISOString(),
					endAt: baseDay.hour(11).toISOString(),
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout).toBeDefined();
			expect(layout.laneCount).toBe(1);
			expect(layout.hasOverlap).toBeFalse();

			const startEvents = layout.eventsByStartSegment[0];
			expect(startEvents.length).toBe(1);
			expect(startEvents[0].segmentCount).toBe(4);
			expect(startEvents[0].lane).toBe(0);
		});

		it('should keep both events that share the same start segment (no data loss)', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout.laneCount).toBe(2);
			expect(layout.hasOverlap).toBeTrue();
			expect(layout.eventsByStartSegment[0].length).toBe(2);
		});

		it('should position an after-midnight-only event at the top of the timeline (startSegment 0)', () => {
			// Regression: with "only favorites" active and favorites containing ONLY an
			// after-midnight event (belonging to the previous festival day), that event is
			// the earliest/only one. dayStart must follow firstEventAt, not the selected
			// calendar date — otherwise the event is pushed a full day down and vanishes.
			const baseDay = dayjs('2025-07-10');
			const nextDay = dayjs('2025-07-11');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({
					id: 'e1',
					locationId: 'p1',
					favorite: true,
					startAt: nextDay.hour(1).minute(0).second(0).toISOString(),
					endAt: nextDay.hour(2).minute(0).second(0).toISOString(),
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout).toBeDefined();
			expect(layout.eventsByStartSegment[0]).toBeDefined();
			expect(layout.eventsByStartSegment[0].length).toBe(1);
			expect(layout.eventsByStartSegment[0][0].id).toBe('e1');
			expect(layout.eventsByStartSegment[0][0].startSegment).toBe(0);
		});

		it('should split two time-overlapping events into two lanes', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', locationId: 'p1', startAt: baseDay.hour(10).minute(30).toISOString(), endAt: baseDay.hour(11).minute(30).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout.laneCount).toBe(2);
			expect(layout.hasOverlap).toBeTrue();
		});
	});

	describe('places computed signal', () => {
		it('should mirror programService places', () => {
			const places = [createMockPlace('p1'), createMockPlace('p2')];
			mockProgramService.places.set(places);

			TestBed.flushEffects();

			expect((component as any).places()).toEqual(places);
		});
	});

	describe('applyFilters (only favorites integration)', () => {
		it('should call filterEvents with onlyFavorite from filter dialog result', () => {
			const filterOptions = {onlyFavorite: true, locationId: undefined, eventType: undefined, tags: undefined};

			(component as any).applyFilters(filterOptions);

			expect(mockProgramService.filterPlaces).toHaveBeenCalledWith(undefined);
			expect(mockProgramService.filterEvents).toHaveBeenCalledWith({
				eventType: undefined,
				onlyFavorite: true,
				tags: undefined,
			});
		});

		it('should show only favorite events in filteredEvents after filterEvents updates signal', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const favoriteEvent = createMockEvent({
				id: 'e1',
				favorite: true,
				startAt: baseDay.hour(14).toISOString(),
				endAt: baseDay.hour(15).toISOString(),
			});

			mockProgramService.events.set([favoriteEvent]);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e1');
			expect(filtered[0].favorite).toBeTrue();
		});
	});

	describe('pinch-to-zoom', () => {
		function createTouchEvent(points: { clientX: number; clientY: number }[]): TouchEvent {
			const touchList = {
				length: points.length,
				item: (i: number) => points[i] as Touch,
				...points.reduce((acc, p, i) => ({ ...acc, [i]: p as Touch }), {}),
			} as TouchList;
			return { touches: touchList, preventDefault: jasmine.createSpy('preventDefault') } as unknown as TouchEvent;
		}

		it('should initialise zoomLevel to 1.0', () => {
			expect((component as any).zoomLevel()).toBe(1.0);
		});

		it('should record start distance and zoom on two-finger touchstart', () => {
			const event = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]);
			(component as any).onTouchStart(event);
			expect((component as any).pinchStartDistance).toBeCloseTo(100, 1);
			expect((component as any).pinchStartZoom).toBe(1.0);
		});

		it('should not set pinchStartDistance for single-finger touchstart', () => {
			const event = createTouchEvent([{ clientX: 0, clientY: 0 }]);
			(component as any).onTouchStart(event);
			expect((component as any).pinchStartDistance).toBeNull();
		});

		it('should zoom out when fingers move closer together (pinch-in = zoom out)', () => {
			const start = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]);
			(component as any).onTouchStart(start);

			const move = createTouchEvent([{ clientX: 25, clientY: 0 }, { clientX: 75, clientY: 0 }]);
			(component as any).onTouchMove(move);

			expect((component as any).zoomLevel()).toBeCloseTo(0.5, 1);
		});

		it('should clamp zoomLevel to MIN_ZOOM (0.4) when pinch would go lower', () => {
			const start = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]);
			(component as any).onTouchStart(start);

			const move = createTouchEvent([{ clientX: 45, clientY: 0 }, { clientX: 55, clientY: 0 }]);
			(component as any).onTouchMove(move);

			expect((component as any).zoomLevel()).toBe(0.4);
		});

		it('should clamp zoomLevel to MAX_ZOOM (1.0) when scale > 1', () => {
			(component as any).zoomLevel.set(0.6);
			const start = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]);
			(component as any).onTouchStart(start);

			const move = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 300, clientY: 0 }]);
			(component as any).onTouchMove(move);

			expect((component as any).zoomLevel()).toBe(1.0);
		});

		it('should not change zoomLevel on touchmove without prior touchstart', () => {
			(component as any).zoomLevel.set(0.7);
			const move = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 200, clientY: 0 }]);
			(component as any).onTouchMove(move);
			expect((component as any).zoomLevel()).toBe(0.7);
		});

		it('should reset pinchStartDistance on touchend', () => {
			const start = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]);
			(component as any).onTouchStart(start);
			expect((component as any).pinchStartDistance).not.toBeNull();

			const end = createTouchEvent([{ clientX: 0, clientY: 0 }]);
			(component as any).onTouchEnd(end);
			expect((component as any).pinchStartDistance).toBeNull();
		});

		it('should reset pinchStartDistance on touchcancel', () => {
			const start = createTouchEvent([{ clientX: 0, clientY: 0 }, { clientX: 100, clientY: 0 }]);
			(component as any).onTouchStart(start);
			expect((component as any).pinchStartDistance).not.toBeNull();

			const cancel = createTouchEvent([]);
			(component as any).onTouchEnd(cancel);
			expect((component as any).pinchStartDistance).toBeNull();
		});
	});
});
