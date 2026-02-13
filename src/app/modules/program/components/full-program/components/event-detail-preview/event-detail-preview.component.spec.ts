import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet} from '@angular/material/bottom-sheet';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {EventDetailPreviewComponent} from './event-detail-preview.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('EventDetailPreviewComponent', () => {
	let component: EventDetailPreviewComponent;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		updateEvent: jasmine.createSpy('updateEvent'),
	};

	const mockEvent = {
		id: 'e1', name: 'Test', name_EN: 'Test EN',
		description: 'Desc', description_EN: 'Desc EN',
		start: '2025-07-10T14:00:00Z', end: '2025-07-10T15:00:00Z',
		placeId: 'p1', favorite: false,
		type: {id: 't1', name: 'Concert', name_EN: 'Concert', color: '#f00'},
		tags: [], startSegment: 0, segmentCount: 4,
	};

	const mockPlace = {id: 'p1', name: 'Main Stage', color: '#000'};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [EventDetailPreviewComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: MAT_BOTTOM_SHEET_DATA, useValue: {event: mockEvent, place: mockPlace}},
				{provide: MatBottomSheet, useValue: {dismiss: jasmine.createSpy('dismiss')}},
				{provide: MatDialog, useValue: {open: jasmine.createSpy('open')}},
			],
		});

		const fixture = TestBed.createComponent(EventDetailPreviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
