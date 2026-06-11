import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {EventLegendComponent} from './event-legend.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('EventLegendComponent', () => {
	const mockProgramService = {
		eventTypes: signal([{id: 'concert', name: 'Concert', color: 'rgb(255, 0, 0)'}]),
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
		mockProgramService.eventTypes.set([{id: 'concert', name: 'Concert', color: 'rgb(255, 0, 0)'}]);
	});

	it('should create', () => {
		const fixture = createComponent();
		expect(fixture.componentInstance).toBeTruthy();
	});

	it('renders one chip per event type', () => {
		mockProgramService.eventTypes.set([
			{id: 'a', name: 'Concert', color: 'rgb(255, 0, 0)'},
			{id: 'b', name: 'Workshop', color: 'rgb(0, 255, 0)'},
		]);

		const fixture = createComponent();

		const items = fixture.nativeElement.querySelectorAll('.event-legend__item');
		expect(items.length).toBe(2);
	});

	it('shows the event type name', () => {
		const fixture = createComponent();

		const label = fixture.nativeElement.querySelector('.event-legend__label');
		expect(label.textContent.trim()).toBe('Concert');
	});

	it('sets the swatch background to the type color', () => {
		const fixture = createComponent();

		const swatch = fixture.nativeElement.querySelector('.event-legend__swatch');
		expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
	});

	it('sorts event types alphabetically by name', () => {
		mockProgramService.eventTypes.set([
			{id: 'c', name: 'Cinema', color: 'rgb(0, 0, 0)'},
			{id: 'a', name: 'Adventure', color: 'rgb(0, 0, 0)'},
			{id: 'b', name: 'Ballet', color: 'rgb(0, 0, 0)'},
		]);

		const fixture = createComponent();

		const labels = (Array.from(fixture.nativeElement.querySelectorAll('.event-legend__label')) as HTMLElement[])
			.map((el) => el.textContent?.trim());
		expect(labels).toEqual(['Adventure', 'Ballet', 'Cinema']);
	});

	it('renders nothing when there are no event types', () => {
		mockProgramService.eventTypes.set([]);

		const fixture = createComponent();

		expect(fixture.nativeElement.querySelector('.event-legend')).toBeNull();
	});

	it('does not mutate the service array', () => {
		mockProgramService.eventTypes.set([
			{id: 'c', name: 'Cinema', color: 'rgb(0, 0, 0)'},
			{id: 'a', name: 'Adventure', color: 'rgb(0, 0, 0)'},
		]);

		createComponent();

		expect(mockProgramService.eventTypes().map((t) => t.id)).toEqual(['c', 'a']);
	});
});
