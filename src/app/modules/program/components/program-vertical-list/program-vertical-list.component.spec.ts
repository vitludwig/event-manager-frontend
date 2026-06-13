import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateModule} from '@ngx-translate/core';

import {ProgramVerticalListComponent} from './program-vertical-list.component';
import {ProgramService} from '../../services/program/program.service';

describe('ProgramVerticalListComponent', () => {
	let component: ProgramVerticalListComponent;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ProgramVerticalListComponent, TranslateModule.forRoot()],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: MatDialog, useValue: {open: jasmine.createSpy('open')}},
			],
		});

		const fixture = TestBed.createComponent(ProgramVerticalListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('groups events by their own day even when days() does not list that day', () => {
		// days() is empty in the mock — previously every event was silently dropped.
		component.events = [
			{id: 'a', startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z', favorite: false} as any,
			{id: 'b', startAt: '2025-07-10T16:00:00Z', endAt: '2025-07-10T17:00:00Z', favorite: false} as any,
		];
		const groups = (component as any).groupEvents();
		const dayKeys = Object.keys(groups);
		expect(dayKeys.length).toBe(1);
		expect(groups[dayKeys[0]].map((e: any) => e.id)).toEqual(['a', 'b']);
	});
});
