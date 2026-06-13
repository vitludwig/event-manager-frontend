import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';

import {FavoritesComponent} from './favorites.component';
import {ProgramService} from '../program/services/program/program.service';
import {IEvent} from '../program/types/IEvent';

function createMockEvent(overrides: Partial<IEvent> = {}): IEvent {
	return {
		id: 'e1', nameCs: 'Test', nameEn: 'Test EN',
		descriptionCs: '', descriptionEn: '',
		startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z',
		locationId: 'p1', location: {id: 'p1', name: 'Place 1'},
		favorite: false, eventType: {id: 't1', name: 'Concert', color: '#f00'},
		tags: [],
		...overrides,
	} as IEvent;
}

describe('FavoritesComponent', () => {
	let component: FavoritesComponent;

	const mockProgramService = {
		eventsLoading: signal(false),
		places: signal([]),
		days: signal({}),
		allEvents: [] as IEvent[],
	};

	beforeEach(() => {
		mockProgramService.eventsLoading.set(false);
		mockProgramService.allEvents = [
			createMockEvent({id: 'e1', favorite: true}),
			createMockEvent({id: 'e2', favorite: false}),
		];

		TestBed.configureTestingModule({
			imports: [FavoritesComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
			providers: [{provide: ProgramService, useValue: mockProgramService}],
		});

		const fixture = TestBed.createComponent(FavoritesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('exposes allEvents', () => {
		expect((component as any).events().length).toBe(2);
	});

	it('reflects allEvents once loading completes (eventsLoading true → false)', () => {
		// still loading: allEvents not populated yet
		mockProgramService.allEvents = [];
		mockProgramService.eventsLoading.set(true);
		expect((component as any).events().length).toBe(0);

		// load finished: allEvents populated and loading flips to false
		mockProgramService.allEvents = [createMockEvent({id: 'e9', favorite: true})];
		mockProgramService.eventsLoading.set(false);
		expect((component as any).events().map((e: any) => e.id)).toEqual(['e9']);
	});
});
