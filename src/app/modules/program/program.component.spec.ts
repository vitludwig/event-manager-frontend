import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {ProgramComponent} from './program.component';
import {ProgramService} from './services/program/program.service';
import {SettingsService} from '../../common/services/settings/settings.service';
import {EDisplayDevice} from '../../common/types/EDisplayDevice';

describe('ProgramComponent', () => {
	let component: ProgramComponent;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		eventTypes: [],
		tags: [],
		allPlaces: [],
		userFilterOptions: {},
		filterEvents: jasmine.createSpy('filterEvents'),
		filterPlaces: jasmine.createSpy('filterPlaces'),
	};

	const mockSettingsService = {
		device: signal(EDisplayDevice.BASIC),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ProgramComponent, NoopAnimationsModule, TranslateModule.forRoot(), HttpClientTestingModule],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: SettingsService, useValue: mockSettingsService},
			],
		});

		const fixture = TestBed.createComponent(ProgramComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
