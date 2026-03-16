import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';

import {ProgramService} from './program.service';
import {EventService} from '../event/event.service';
import {IEvent} from '../../types/IEvent';
import {IProgramPlace} from '../../types/IProgramPlace';
import {IEventType} from '../../types/IEventType';
import {environment} from '../../../../../environments/environment';
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
		endAt: '2025-07-10T16:00:00Z',
		locationId: 'place1',
		location,
		favorite: false,
		eventType: createMockEventType(),
		tags: [],
		...overrides,
	};
}

/**
 * Helper to call loadProgramData and flush the HTTP requests it makes
 */
function loadAndFlush(
	service: ProgramService,
	httpTesting: HttpTestingController,
	places: IProgramPlace[],
	events: IEvent[],
): void {
	service.loadProgramData(places, events);
	tick();
	httpTesting.expectOne(`${environment.apiUrl}/public/event-types`).flush([]);
	tick();
}

describe('ProgramService', () => {
	let service: ProgramService;
	let httpTesting: HttpTestingController;
	let mockEventService: jasmine.SpyObj<EventService>;

	beforeEach(() => {
		mockEventService = jasmine.createSpyObj('EventService', ['initWebsocket', 'on', 'off', 'onReconnected', 'getEvents', 'getPlaces']);
		mockEventService.getEvents.and.resolveTo([]);
		mockEventService.getPlaces.and.resolveTo([]);

		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{provide: EventService, useValue: mockEventService},
			],
		});
		service = TestBed.inject(ProgramService);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpTesting.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('signals initial state', () => {
		it('should have empty events signal', () => {
			expect(service.events()).toEqual([]);
		});

		it('should have empty places signal', () => {
			expect(service.places()).toEqual([]);
		});

		it('should have empty days signal', () => {
			expect(service.days()).toEqual({});
		});

		it('should have undefined selectedDay', () => {
			expect(service.selectedDay()).toBeUndefined();
		});
	});

	describe('loadProgramData', () => {
		it('should populate places signal with provided places', fakeAsync(() => {
			const places = [createMockPlace('p1'), createMockPlace('p2')];
			const events = [createMockEvent({id: 'e1', locationId: 'p1'})];

			loadAndFlush(service, httpTesting, places, events);

			expect(service.places()).toEqual(places);
			expect(service.allPlaces).toEqual(places);
		}));

		it('should compute days from events', fakeAsync(() => {
			const events = [
				createMockEvent({id: 'e1', startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T16:00:00Z'}),
				createMockEvent({id: 'e2', startAt: '2025-07-11T10:00:00Z', endAt: '2025-07-11T12:00:00Z'}),
			];

			loadAndFlush(service, httpTesting, [], events);

			const days = service.days();
			const dayKeys = Object.keys(days);
			expect(dayKeys.length).toBe(2);
		}));

		it('should persist events and places to localStorage', fakeAsync(() => {
			const places = [createMockPlace('p1')];
			const events = [createMockEvent()];

			loadAndFlush(service, httpTesting, places, events);

			expect(JSON.parse(localStorage.getItem('places')!)).toEqual(places);
			expect(JSON.parse(localStorage.getItem('events')!)).toEqual(jasmine.arrayContaining([
				jasmine.objectContaining({id: 'event1'}),
			]));
		}));

		it('should load event types from API', fakeAsync(() => {
			const eventTypes: IEventType[] = [createMockEventType('t1')];

			service.loadProgramData([], []);
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/public/event-types`).flush(eventTypes);
			tick();

			expect(service.eventTypes).toEqual(eventTypes);
		}));
	});

	describe('autoSelectDay', () => {
		it('should auto-select first day when days are loaded and no day is selected', fakeAsync(() => {
			const events = [
				createMockEvent({id: 'e1', startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T16:00:00Z'}),
				createMockEvent({id: 'e2', startAt: '2025-07-11T10:00:00Z', endAt: '2025-07-11T12:00:00Z'}),
			];

			loadAndFlush(service, httpTesting, [], events);

			expect(service.selectedDay()).toBeDefined();
		}));

		it('should not override selectedDay if already set', fakeAsync(() => {
			service.selectedDay.set(999);
			const events = [
				createMockEvent({id: 'e1', startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T16:00:00Z'}),
			];

			loadAndFlush(service, httpTesting, [], events);

			expect(service.selectedDay()).toBe(999);
		}));

		it('should not set selectedDay when no events (no days)', fakeAsync(() => {
			loadAndFlush(service, httpTesting, [], []);

			expect(service.selectedDay()).toBeUndefined();
		}));

		it('should auto-select today if it exists in days', fakeAsync(() => {
			const today = dayjs();
			const events = [
				createMockEvent({id: 'e1', startAt: today.hour(14).toISOString(), endAt: today.hour(16).toISOString()}),
				createMockEvent({id: 'e2', startAt: '2025-01-15T10:00:00Z', endAt: '2025-01-15T12:00:00Z'}),
			];

			loadAndFlush(service, httpTesting, [], events);

			const todayTimestamp = today.startOf('day').valueOf();
			expect(service.selectedDay()).toBe(todayTimestamp);
		}));
	});

	describe('filterEvents', () => {
		beforeEach(fakeAsync(() => {
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', eventType: createMockEventType('concert')}),
				createMockEvent({id: 'e2', locationId: 'p2', eventType: createMockEventType('workshop')}),
				createMockEvent({id: 'e3', locationId: 'p1', eventType: createMockEventType('concert')}),
			];

			// Pre-set favorites in localStorage so loadProgramData marks e3 as favorite
			localStorage.setItem('favorites', JSON.stringify(['e3']));
			loadAndFlush(service, httpTesting, [createMockPlace('p1'), createMockPlace('p2')], events);
		}));

		it('should filter events by event type', () => {
			service.filterEvents({eventType: ['concert']});
			const filtered = service.events();
			expect(filtered.length).toBe(2);
			expect(filtered.every(e => e.eventType.id === 'concert')).toBeTrue();
		});

		it('should filter events by favorites only', () => {
			service.filterEvents({onlyFavorite: true});
			const filtered = service.events();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e3');
		});

		it('should filter events by favorites combined with event type', () => {
			service.filterEvents({onlyFavorite: true, eventType: ['concert']});
			const filtered = service.events();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e3');
		});

		it('should filter events by place', () => {
			service.filterEvents({locationId: ['p1']});
			const filtered = service.events();
			expect(filtered.length).toBe(2);
			expect(filtered.every(e => e.locationId === 'p1')).toBeTrue();
		});

		it('should combine place and event type filters', () => {
			service.filterEvents({locationId: ['p2'], eventType: ['workshop']});
			const filtered = service.events();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e2');
		});

		it('should return no events when filters have no match', () => {
			service.filterEvents({locationId: ['p2'], eventType: ['concert']});
			const filtered = service.events();
			expect(filtered.length).toBe(0);
		});

		it('should apply onlyFavorite via propagateEventUpdate when userFilterOptions is set', () => {
			service.userFilterOptions = {onlyFavorite: true};
			// Toggle a favorite to trigger propagateEventUpdate
			const event = service.getEvent('e1')!;
			service.updateEvent(event, 'favorite', true);
			const filtered = service.events();
			expect(filtered.length).toBe(2);
			expect(filtered.every(e => e.favorite)).toBeTrue();
		});

		it('should return all events with empty filter options', () => {
			service.filterEvents({});
			expect(service.events().length).toBe(3);
		});

		it('should ignore empty arrays in filter options', () => {
			service.filterEvents({locationId: [], eventType: [], tags: []});
			expect(service.events().length).toBe(3);
		});
	});

	describe('filterPlaces', () => {
		beforeEach(fakeAsync(() => {
			const places = [createMockPlace('p1'), createMockPlace('p2'), createMockPlace('p3')];
			loadAndFlush(service, httpTesting, places, []);
		}));

		it('should filter places by IDs', () => {
			service.filterPlaces(['p1', 'p3']);
			expect(service.places().length).toBe(2);
			expect(service.places().map(p => p.id)).toEqual(['p1', 'p3']);
		});

		it('should return all places when null is passed', () => {
			service.filterPlaces(['p1']);
			expect(service.places().length).toBe(1);

			service.filterPlaces(null);
			expect(service.places().length).toBe(3);
		});
	});

	describe('selectedDay signal', () => {
		it('should be writable', () => {
			service.selectedDay.set(123);
			expect(service.selectedDay()).toBe(123);
		});
	});

	describe('getEvent / getEventById / getPlaceById', () => {
		beforeEach(fakeAsync(() => {
			loadAndFlush(service, httpTesting,
				[createMockPlace('p1')],
				[createMockEvent({id: 'e1'})],
			);
		}));

		it('should find event by id', () => {
			expect(service.getEvent('e1')).toBeDefined();
			expect(service.getEvent('nonexistent')).toBeUndefined();
		});

		it('should find event by id via getEventById', () => {
			expect(service.getEventById('e1')).toBeDefined();
			expect(service.getEventById('nonexistent')).toBeUndefined();
		});

		it('should find place by id', () => {
			expect(service.getPlaceById('p1')).toBeDefined();
			expect(service.getPlaceById('nonexistent')).toBeUndefined();
		});
	});

	describe('updateEvent', () => {
		beforeEach(fakeAsync(() => {
			loadAndFlush(service, httpTesting,
				[createMockPlace('p1')],
				[createMockEvent({id: 'e1', favorite: false})],
			);
		}));

		it('should update event property', () => {
			const event = service.getEvent('e1')!;
			service.updateEvent(event, 'favorite', true);
			expect(service.getEvent('e1')!.favorite).toBeTrue();
		});

		it('should update favorites list when toggling favorite', () => {
			const event = service.getEvent('e1')!;
			service.updateEvent(event, 'favorite', true);
			expect(service.favorites.length).toBe(1);
			expect(service.favorites[0].id).toBe('e1');
		});

		it('should propagate update to events signal', () => {
			const event = service.getEvent('e1')!;
			service.updateEvent(event, 'nameCs', 'Updated Name');
			const signalEvents = service.events();
			expect(signalEvents.find(e => e.id === 'e1')!.nameCs).toBe('Updated Name');
		});
	});

	describe('userFilterOptions', () => {
		it('should persist to localStorage on set', () => {
			service.userFilterOptions = {onlyFavorite: true};
			const stored = JSON.parse(localStorage.getItem('userFilterOptions')!);
			expect(stored.onlyFavorite).toBeTrue();
		});

		it('should read from localStorage on get', () => {
			localStorage.setItem('userFilterOptions', JSON.stringify({onlyFavorite: true}));
			expect(service.userFilterOptions.onlyFavorite).toBeTrue();
		});

		it('should update activeFiltersCount', () => {
			service.userFilterOptions = {onlyFavorite: true, eventType: ['concert']};
			expect(service.activeFiltersCount).toBe(2);
		});
	});

	describe('showEventDetails', () => {
		it('should persist to localStorage', () => {
			service.showEventDetails = true;
			expect(service.showEventDetails).toBeTrue();
			expect(localStorage.getItem('showEventDetails')).toBe('true');
		});

		it('should read from localStorage', () => {
			localStorage.setItem('showEventDetails', 'true');
			expect(service.showEventDetails).toBeTrue();
		});

		it('should return false by default', () => {
			expect(service.showEventDetails).toBeFalse();
		});
	});

	describe('loadFavorites', () => {
		beforeEach(fakeAsync(() => {
			loadAndFlush(service, httpTesting,
				[],
				[createMockEvent({id: 'e1'}), createMockEvent({id: 'e2'})],
			);
		}));

		it('should mark matching events as favorite', () => {
			service.loadFavorites(['e1']);
			expect(service.getEvent('e1')!.favorite).toBeTrue();
			expect(service.getEvent('e2')!.favorite).toBeFalse();
			expect(service.favorites.length).toBe(1);
		});
	});
});
