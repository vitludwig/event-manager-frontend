import {TestBed} from '@angular/core/testing';
import {Component, signal} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {ProgramComponent} from './program.component';
import {FullProgramComponent} from './components/full-program/full-program.component';
import {ProgramService} from './services/program/program.service';
import {SettingsService} from '../../common/services/settings/settings.service';
import {EDisplayDevice} from '../../common/types/EDisplayDevice';

// Stub with the same selector so the program template renders without FullProgram's deps.
@Component({selector: 'app-full-program', template: '', standalone: true})
class FullProgramStubComponent {}

describe('ProgramComponent', () => {
	let component: ProgramComponent;
	let fixture: ReturnType<typeof TestBed.createComponent<ProgramComponent>>;

	const mockProgramService = {
		events: signal<any[]>([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		eventsLoading: signal(true),
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

	function setup(): void {
		TestBed.configureTestingModule({
			imports: [ProgramComponent, NoopAnimationsModule, TranslateModule.forRoot(), HttpClientTestingModule],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: SettingsService, useValue: mockSettingsService},
			],
		});
		TestBed.overrideComponent(ProgramComponent, {
			remove: {imports: [FullProgramComponent]},
			add: {imports: [FullProgramStubComponent]},
		});

		fixture = TestBed.createComponent(ProgramComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	beforeEach(() => {
		mockProgramService.events.set([]);
		mockProgramService.eventsLoading.set(true);
	});

	it('should create', () => {
		setup();
		expect(component).toBeTruthy();
	});

	it('shows the spinner while loading with no cached data', () => {
		mockProgramService.events.set([]);
		mockProgramService.eventsLoading.set(true);
		setup();
		expect(fixture.nativeElement.querySelector('.program__loading')).toBeTruthy();
		expect(fixture.nativeElement.querySelector('app-full-program')).toBeNull();
	});

	it('shows the program (no spinner) when cached data is present even while still loading', () => {
		mockProgramService.events.set([{id: 'e1'} as any]);
		mockProgramService.eventsLoading.set(true);
		setup();
		expect(fixture.nativeElement.querySelector('.program__loading')).toBeNull();
		expect(fixture.nativeElement.querySelector('app-full-program')).toBeTruthy();
	});
});
