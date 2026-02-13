import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {ListFilterComponent} from './list-filter.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('ListFilterComponent', () => {
	let component: ListFilterComponent;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<ListFilterComponent>>;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		eventTypes: [{id: 'concert', name: 'Concert', name_EN: 'Concert', color: '#f00'}],
		tags: [{id: 'rock', name: 'Rock', name_EN: 'Rock'}],
		allPlaces: [{id: 'p1', name: 'Main Stage', color: '#000'}],
		userFilterOptions: {},
		filterEvents: jasmine.createSpy('filterEvents'),
		filterPlaces: jasmine.createSpy('filterPlaces'),
	};

	function createComponent(options = {}) {
		mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

		TestBed.configureTestingModule({
			imports: [
				ListFilterComponent,
				NoopAnimationsModule,
				TranslateModule.forRoot(),
				MatDialogModule,
			],
			providers: [
				{provide: MAT_DIALOG_DATA, useValue: {options}},
				{provide: MatDialogRef, useValue: mockDialogRef},
				{provide: ProgramService, useValue: mockProgramService},
			],
		});

		const fixture = TestBed.createComponent(ListFilterComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it('should create with empty options', () => {
		createComponent();
		expect(component).toBeTruthy();
	});

	it('should initialize from provided filter options', () => {
		createComponent({
			eventType: ['concert'],
			placeId: ['p1'],
			onlyFavorite: true,
			tags: ['rock'],
		});

		expect((component as any).selectedEventType).toEqual(['concert']);
		expect((component as any).placeId).toEqual(['p1']);
		expect((component as any).onlyFavorite).toBeTrue();
		expect((component as any).selectedTags).toEqual(['rock']);
	});

	it('should load event types from service', () => {
		createComponent();
		expect((component as any).eventTypes.length).toBe(1);
		expect((component as any).eventTypes[0].id).toBe('concert');
	});

	it('should load tags from service', () => {
		createComponent();
		expect((component as any).tags.length).toBe(1);
		expect((component as any).tags[0].id).toBe('rock');
	});

	describe('applyFilters', () => {
		it('should close dialog with filter options', () => {
			createComponent();
			(component as any).selectedEventType = ['concert'];
			(component as any).onlyFavorite = true;

			(component as any).applyFilters();

			expect(mockDialogRef.close).toHaveBeenCalledWith({
				eventType: ['concert'],
				placeId: undefined,
				onlyFavorite: true,
				tags: undefined,
			});
		});

		it('should clear empty arrays to undefined', () => {
			createComponent();
			(component as any).selectedEventType = [];
			(component as any).placeId = [];

			(component as any).applyFilters();

			expect(mockDialogRef.close).toHaveBeenCalledWith(
				jasmine.objectContaining({
					eventType: undefined,
					placeId: undefined,
				})
			);
		});
	});

	describe('resetFilters', () => {
		it('should clear all filters and close dialog', () => {
			createComponent({
				eventType: ['concert'],
				placeId: ['p1'],
				onlyFavorite: true,
				tags: ['rock'],
			});

			(component as any).resetFilters();

			expect(mockDialogRef.close).toHaveBeenCalledWith({
				eventType: undefined,
				placeId: undefined,
				onlyFavorite: false,
				tags: undefined,
			});
		});
	});
});
