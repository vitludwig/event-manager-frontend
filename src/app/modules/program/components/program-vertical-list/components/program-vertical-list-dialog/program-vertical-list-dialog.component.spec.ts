import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {ProgramVerticalListDialogComponent} from './program-vertical-list-dialog.component';
import {ProgramService} from '../../../../services/program/program.service';
import {IProgramEvent} from '../../../../types/IProgramPlace';

function createMockEvent(overrides: Partial<IProgramEvent> = {}): IProgramEvent {
	return {
		id: 'e1',
		name: 'Test Event',
		name_EN: 'Test Event EN',
		description: '',
		description_EN: '',
		start: '2025-07-10T14:00:00Z',
		end: '2025-07-10T15:00:00Z',
		placeId: 'p1',
		place: {id: 'p1', name: 'Place 1', color: '#000'},
		favorite: false,
		type: {id: 't1', name: 'Concert', name_EN: 'Concert', color: '#f00'},
		tags: [],
		startSegment: 0,
		segmentCount: 4,
		...overrides,
	};
}

describe('ProgramVerticalListDialogComponent', () => {
	let component: ProgramVerticalListDialogComponent;
	let mockEvents: IProgramEvent[];

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		userFilterOptions: {},
		activeFiltersCount: 0,
		allEvents: [],
		showEventDetails: false,
		favorites: [],
		eventTypes: [],
		tags: [],
		filterEvents: jasmine.createSpy('filterEvents'),
		filterPlaces: jasmine.createSpy('filterPlaces'),
		updateEvent: jasmine.createSpy('updateEvent'),
	};

	beforeEach(() => {
		mockEvents = [
			createMockEvent({id: 'e1', name: 'Rock Festival', favorite: true}),
			createMockEvent({id: 'e2', name: 'Jazz Night', favorite: false}),
			createMockEvent({id: 'e3', name: 'Rockový Koncert', favorite: true}),
		];

		TestBed.configureTestingModule({
			imports: [
				ProgramVerticalListDialogComponent,
				NoopAnimationsModule,
				TranslateModule.forRoot(),
				MatDialogModule,
			],
			providers: [
				{provide: MAT_DIALOG_DATA, useValue: {events: mockEvents}},
				{provide: ProgramService, useValue: mockProgramService},
			],
		});

		const fixture = TestBed.createComponent(ProgramVerticalListDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('filteredEvents computed', () => {
		it('should return all events by default', () => {
			expect((component as any).filteredEvents().length).toBe(3);
		});

		it('should filter by search term', () => {
			(component as any).search.set('Rock');
			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(2);
			expect(filtered.map((e: any) => e.id)).toContain('e1');
			expect(filtered.map((e: any) => e.id)).toContain('e3');
		});

		it('should filter case-insensitively', () => {
			(component as any).search.set('jazz');
			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e2');
		});

		it('should handle Czech accent normalization in search', () => {
			(component as any).search.set('Rockovy');
			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
			expect(filtered[0].id).toBe('e3');
		});

		it('should filter by favorites only', () => {
			(component as any).onlyFavorite.set(true);
			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(2);
			expect(filtered.every((e: any) => e.favorite)).toBeTrue();
		});

		it('should combine search and favorite filters', () => {
			(component as any).onlyFavorite.set(true);
			(component as any).search.set('Jazz');
			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(0);
		});

		it('should return empty when no events match search', () => {
			(component as any).search.set('nonexistent');
			expect((component as any).filteredEvents().length).toBe(0);
		});

		it('should trim search whitespace', () => {
			(component as any).search.set('  Jazz  ');
			const filtered = (component as any).filteredEvents();
			expect(filtered.length).toBe(1);
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle onlyFavorite signal', () => {
			expect((component as any).onlyFavorite()).toBeFalse();
			(component as any).toggleFavorite();
			expect((component as any).onlyFavorite()).toBeTrue();
			(component as any).toggleFavorite();
			expect((component as any).onlyFavorite()).toBeFalse();
		});
	});
});
