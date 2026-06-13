import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';

import {EventSearchListComponent} from './event-search-list.component';
import {ProgramService} from '../../../../services/program/program.service';
import {IProgramEvent} from '../../../../types/IProgramPlace';

function createMockEvent(overrides: Partial<IProgramEvent> = {}): IProgramEvent {
	return {
		id: 'e1', nameCs: 'Test', nameEn: 'Test EN',
		descriptionCs: '', descriptionEn: '',
		startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z',
		locationId: 'p1', location: {id: 'p1', name: 'Place 1'},
		favorite: false, eventType: {id: 't1', name: 'Concert', color: '#f00'},
		tags: [], startSegment: 0, segmentCount: 4,
		...overrides,
	} as IProgramEvent;
}

describe('EventSearchListComponent', () => {
	let component: EventSearchListComponent;
	let fixture: ReturnType<typeof TestBed.createComponent<EventSearchListComponent>>;

	const events: IProgramEvent[] = [
		createMockEvent({id: 'e1', nameCs: 'Rock Festival', favorite: true}),
		createMockEvent({id: 'e2', nameCs: 'Jazz Night', favorite: false}),
		createMockEvent({id: 'e3', nameCs: 'Rockový Koncert', favorite: true}),
	];

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [EventSearchListComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
			providers: [{provide: ProgramService, useValue: {places: signal([]), days: signal({})}}],
		});
		fixture = TestBed.createComponent(EventSearchListComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('events', events);
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('filteredEvents', () => {
		it('returns all events by default (onlyFavorite false)', () => {
			expect((component as any).filteredEvents().length).toBe(3);
		});

		it('filters by accent- and case-insensitive search', () => {
			(component as any).search.set('rockovy');
			const f = (component as any).filteredEvents();
			expect(f.length).toBe(1);
			expect(f[0].id).toBe('e3');
		});

		it('filters favorites only when onlyFavorite=true', () => {
			fixture.componentRef.setInput('onlyFavorite', true);
			const f = (component as any).filteredEvents();
			expect(f.length).toBe(2);
			expect(f.every((e: any) => e.favorite)).toBeTrue();
		});

		it('combines favorites and search', () => {
			fixture.componentRef.setInput('onlyFavorite', true);
			(component as any).search.set('Jazz');
			expect((component as any).filteredEvents().length).toBe(0);
		});

		it('returns empty when nothing matches', () => {
			(component as any).search.set('nonexistent');
			expect((component as any).filteredEvents().length).toBe(0);
		});

		it('trims search whitespace', () => {
			(component as any).search.set('  Jazz  ');
			expect((component as any).filteredEvents().length).toBe(1);
		});

		it('does not crash when an event has a null nameCs while searching', () => {
			fixture.componentRef.setInput('events', [
				createMockEvent({id: 'x', nameCs: null as any}),
				createMockEvent({id: 'e2', nameCs: 'Jazz Night'}),
			]);
			(component as any).search.set('jazz');
			const f = (component as any).filteredEvents();
			expect(f.length).toBe(1);
			expect(f[0].id).toBe('e2');
		});
	});

	it('shows the back button and emits back when showBackBtn=true', () => {
		fixture.componentRef.setInput('showBackBtn', true);
		fixture.detectChanges();
		let emitted = false;
		component.back.subscribe(() => (emitted = true));
		const btn = fixture.nativeElement.querySelector('.event-list__header__back');
		expect(btn).toBeTruthy();
		btn.click();
		expect(emitted).toBeTrue();
	});

	it('hides the back button when showBackBtn=false', () => {
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('.event-list__header__back')).toBeNull();
	});

	it('shows a spinner (not the empty-state) while loading with no results', () => {
		fixture.componentRef.setInput('events', []);
		fixture.componentRef.setInput('loading', true);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('.event-list__content__loading')).toBeTruthy();
		expect(fixture.nativeElement.querySelector('.event-list__content__no-events')).toBeNull();
	});

	it('shows the empty-state (not a spinner) when not loading and no results', () => {
		fixture.componentRef.setInput('events', []);
		fixture.componentRef.setInput('loading', false);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('.event-list__content__no-events')).toBeTruthy();
		expect(fixture.nativeElement.querySelector('.event-list__content__loading')).toBeNull();
	});
});
