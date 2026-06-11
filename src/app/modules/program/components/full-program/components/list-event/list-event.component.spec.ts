import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {ListEventComponent} from './list-event.component';
import {ProgramService} from '../../../../services/program/program.service';
import {CustomizationService} from '../../../../../../common/services/customization/customization.service';

describe('ListEventComponent', () => {
	let component: ListEventComponent;
	let fixture: ReturnType<typeof TestBed.createComponent<ListEventComponent>>;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		updateEvent: jasmine.createSpy('updateEvent'),
	};

	const mockCustomizationService = {
		eventCardTagCount: undefined as number | undefined,
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ListEventComponent, TranslateModule.forRoot()],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: CustomizationService, useValue: mockCustomizationService},
			],
		});

		fixture = TestBed.createComponent(ListEventComponent);
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

	describe('visibleTags', () => {
		const tags = [
			{id: 'a', nameCs: 'A', nameEn: 'A', color: '#000'},
			{id: 'b', nameCs: 'B', nameEn: 'B', color: '#000'},
			{id: 'c', nameCs: 'C', nameEn: 'C', color: '#000'},
		];

		afterEach(() => {
			mockCustomizationService.eventCardTagCount = undefined;
		});

		it('shows one tag by default (unset)', () => {
			mockCustomizationService.eventCardTagCount = undefined;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a']);
		});

		it('shows no tags when the count is 0', () => {
			mockCustomizationService.eventCardTagCount = 0;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags).toEqual([]);
		});

		it('shows the first N tags', () => {
			mockCustomizationService.eventCardTagCount = 2;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a', 'b']);
		});

		it('shows all tags when the count exceeds the available tags', () => {
			mockCustomizationService.eventCardTagCount = 5;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a', 'b', 'c']);
		});

		it('returns an empty array when the event has no tags', () => {
			mockCustomizationService.eventCardTagCount = 3;
			component.event = {...component.event, tags: []} as any;
			expect((component as any).visibleTags).toEqual([]);
		});

		it('renders the visible tags in the DOM, falling back to nameCs when nameEn is null', () => {
			mockCustomizationService.eventCardTagCount = 2;
			component.event = {...component.event, tags: [
				{id: 'a', nameCs: 'Akce', nameEn: 'Action', color: '#000'},
				{id: 'b', nameCs: 'Bota', nameEn: null, color: '#000'},
			]} as any;
			fixture.detectChanges();

			const pills = fixture.nativeElement.querySelectorAll('.tag');
			expect(pills.length).toBe(2);
			// default lang (not cs) → nameEn, with fallback to nameCs when nameEn is null
			expect(pills[0].textContent.trim()).toBe('Action');
			expect(pills[1].textContent.trim()).toBe('Bota');
		});
	});
});
