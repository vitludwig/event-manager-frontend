import {TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {EventLegendComponent} from './event-legend.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('EventLegendComponent', () => {
	const mockProgramService = {
		eventTypes: [{id: 'concert', name: 'Concert', color: 'rgb(255, 0, 0)'}],
	};

	function createComponent() {
		TestBed.configureTestingModule({
			imports: [EventLegendComponent, TranslateModule.forRoot()],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
			],
		});
		const fixture = TestBed.createComponent(EventLegendComponent);
		fixture.detectChanges();
		return fixture;
	}

	afterEach(() => {
		mockProgramService.eventTypes = [{id: 'concert', name: 'Concert', color: 'rgb(255, 0, 0)'}];
	});

	it('should create', () => {
		const fixture = createComponent();
		expect(fixture.componentInstance).toBeTruthy();
	});
});
