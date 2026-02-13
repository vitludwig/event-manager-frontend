import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {ComponentRef} from '@angular/core';

import {ListTimelineComponent} from './list-timeline.component';
import {IProgramSegment} from '../../types/IProgramSegment';

describe('ListTimelineComponent', () => {
	let component: ListTimelineComponent;
	let componentRef: ComponentRef<ListTimelineComponent>;
	let fixture: ComponentFixture<ListTimelineComponent>;
	let mockContainer: HTMLElement;

	const mockSegments: IProgramSegment[] = [
		{time: '10:00', isWholeHour: true, index: 0},
		{time: '10:15', isWholeHour: false, index: 1},
		{time: '10:30', isWholeHour: false, index: 2},
		{time: '10:45', isWholeHour: false, index: 3},
		{time: '11:00', isWholeHour: true, index: 4},
	];

	beforeEach(() => {
		mockContainer = document.createElement('div');
		mockContainer.scrollTo = jasmine.createSpy('scrollTo');

		TestBed.configureTestingModule({
			imports: [ListTimelineComponent],
		});

		fixture = TestBed.createComponent(ListTimelineComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('segments', mockSegments);
		componentRef.setInput('parentContainer', mockContainer);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should accept segments input', () => {
		expect(component.segments()).toEqual(mockSegments);
	});

	it('should compute timeNow on creation', () => {
		expect((component as any).timeNow).toBeTruthy();
		expect((component as any).timeNow).toMatch(/^\d{2}:\d{2}$/);
	});

	it('should round timeNow to 15-minute intervals', () => {
		const timeNow = (component as any).timeNow;
		const minutes = parseInt(timeNow.split(':')[1], 10);
		expect(minutes % 15).toBe(0);
	});

	describe('scrollToNowSegment', () => {
		it('should not throw when segmentNow is not present', () => {
			expect(() => component.scrollToNowSegment()).not.toThrow();
		});
	});

	describe('interval cleanup', () => {
		it('should clean up interval on destroy', fakeAsync(() => {
			spyOn(window, 'clearInterval');
			fixture.destroy();
			expect(window.clearInterval).toHaveBeenCalled();
		}));
	});
});
