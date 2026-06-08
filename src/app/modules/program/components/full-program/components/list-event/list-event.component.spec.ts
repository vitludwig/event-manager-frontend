import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {ListEventComponent} from './list-event.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('ListEventComponent', () => {
	let component: ListEventComponent;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		updateEvent: jasmine.createSpy('updateEvent'),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ListEventComponent, TranslateModule.forRoot()],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
			],
		});

		const fixture = TestBed.createComponent(ListEventComponent);
		component = fixture.componentInstance;
		component.event = {
			id: 'e1', nameCs: 'Test', nameEn: 'Test EN',
			descriptionCs: '', descriptionEn: '',
			startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z',
			locationId: 'p1', favorite: false,
			eventType: {id: 't1', name: 'Concert', color: '#f00'},
			tags: [], startSegment: 0, segmentCount: 4, lane: 0,
		} as any;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
