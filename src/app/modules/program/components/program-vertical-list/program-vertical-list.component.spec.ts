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
});
