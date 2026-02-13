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
	return {id, name, color: '#000'};
}

function createMockEventType(id: string = 'type1'): IEventType {
	return {id, name: 'Concert', name_EN: 'Concert', color: '#f00'};
}

function createMockEvent(overrides: Partial<IEvent> = {}): IEvent {
	const place = createMockPlace('place1');
	return {
		id: 'event1',
		name: 'Test Event',
		name_EN: 'Test Event EN',
		description: '',
		description_EN: '',
		start: '2025-07-10T14:00:00Z',
		end: '2025-07-10T15:00:00Z',
		placeId: 'place1',
		place,
		favorite: false,
		type: createMockEventType(),
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
	eventTypes: IEventType[] = [];
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
				createMockEvent({id: 'e1', start: baseDay.hour(14).toISOString(), end: baseDay.hour(15).toISOString()}),
				createMockEvent({id: 'e2', start: nextDay.hour(10).toISOString(), end: nextDay.hour(12).toISOString()}),
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
				createMockEvent({id: 'e1', start: baseDay.hour(20).toISOString(), end: baseDay.hour(22).toISOString()}),
				createMockEvent({id: 'e2', start: nextDay.hour(2).toISOString(), end: nextDay.hour(4).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(2);
		});
	});

	describe('allSegments computed signal', () => {
		it('should return empty array when no events', () => {
			expect((component as any).allSegments()).toEqual([]);
		});

		it('should compute segments from events', () => {
			// Use local time to avoid timezone issues in filterEventsByDay
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const startTime = baseDay.hour(10).minute(0).second(0).toISOString();
			const endTime = baseDay.hour(11).minute(0).second(0).toISOString();
			const events = [
				createMockEvent({
					id: 'e1',
					start: startTime,
					end: endTime,
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const segments = (component as any).allSegments();
			expect(segments.length).toBeGreaterThan(0);
			// 1 hour = 4 segments of 15 minutes
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
					start: startTime,
					end: endTime,
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

		it('should group events by placeId', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', placeId: 'p1', start: baseDay.hour(10).toISOString(), end: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', placeId: 'p2', start: baseDay.hour(10).toISOString(), end: baseDay.hour(11).minute(30).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const result = (component as any).eventsByPlaces();
			expect(Object.keys(result)).toContain('p1');
			expect(Object.keys(result)).toContain('p2');
		});

		it('should compute startSegment and segmentCount', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({
					id: 'e1',
					placeId: 'p1',
					start: baseDay.hour(10).toISOString(),
					end: baseDay.hour(11).toISOString(),
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const result = (component as any).eventsByPlaces();
			const placeEvents = result['p1'];
			expect(placeEvents).toBeDefined();

			const eventValues = Object.values(placeEvents) as any[];
			expect(eventValues.length).toBe(1);
			expect(eventValues[0].segmentCount).toBe(4); // 1 hour = 4 x 15min segments
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
});
