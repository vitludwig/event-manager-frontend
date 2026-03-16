import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {EventDetailFullComponent} from './event-detail-full.component';
import {ProgramService} from '../../services/program/program.service';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';

describe('EventDetailFullComponent', () => {
	let component: EventDetailFullComponent;
	let mockEvent: IProgramEvent;
	let mockPlace: IProgramPlace;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		updateEvent: jasmine.createSpy('updateEvent'),
	};

	beforeEach(() => {
		mockPlace = {id: 'p1', name: 'Main Stage'};
		mockEvent = {
			id: 'e1',
			nameCs: 'Test Event',
			nameEn: 'Test Event EN',
			descriptionCs: 'Description',
			descriptionEn: 'Description EN',
			startAt: '2025-07-10T14:00:00Z',
			endAt: '2025-07-10T15:00:00Z',
			locationId: 'p1',
			location: mockPlace,
			favorite: false,
			eventType: {id: 't1', name: 'Concert', color: '#f00'},
			tags: [],
			startSegment: 0,
			segmentCount: 4,
		};

		mockProgramService.updateEvent.calls.reset();

		TestBed.configureTestingModule({
			imports: [
				EventDetailFullComponent,
				NoopAnimationsModule,
				TranslateModule.forRoot(),
				MatDialogModule,
			],
			providers: [
				{provide: MAT_DIALOG_DATA, useValue: {event: mockEvent, place: mockPlace}},
				{provide: ProgramService, useValue: mockProgramService},
			],
		});

		const fixture = TestBed.createComponent(EventDetailFullComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should expose event from dialog data', () => {
		expect((component as any).event).toBe(mockEvent);
	});

	it('should expose place from dialog data', () => {
		expect((component as any).place).toBe(mockPlace);
	});

	describe('toggleFavorite', () => {
		it('should toggle event favorite and call updateEvent', () => {
			expect(mockEvent.favorite).toBeFalse();

			(component as any).toggleFavorite();

			expect(mockEvent.favorite).toBeTrue();
			expect(mockProgramService.updateEvent).toHaveBeenCalledWith(mockEvent, 'favorite', true);
		});

		it('should unfavorite when already favorited', () => {
			mockEvent.favorite = true;

			(component as any).toggleFavorite();

			expect(mockEvent.favorite).toBeFalse();
			expect(mockProgramService.updateEvent).toHaveBeenCalledWith(mockEvent, 'favorite', false);
		});
	});
});
