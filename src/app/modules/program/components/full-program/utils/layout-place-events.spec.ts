import {IProgramEvent} from '../../../types/IProgramPlace';
import {layoutPlaceEvents} from './layout-place-events';

function makeEvent(id: string, startSegment: number, segmentCount: number): IProgramEvent {
	return {
		id,
		nameCs: id, nameEn: id,
		descriptionCs: '', descriptionEn: '',
		startAt: '', endAt: '',
		locationId: 'p1',
		location: {id: 'p1', name: 'P1'},
		favorite: false,
		eventType: {id: 't1', name: 'T', color: '#000'},
		tags: [],
		startSegment, segmentCount,
	};
}

describe('layoutPlaceEvents', () => {
	it('returns a single empty lane for no events', () => {
		const layout = layoutPlaceEvents([]);
		expect(layout.laneCount).toBe(1);
		expect(layout.hasOverlap).toBeFalse();
		expect(layout.eventsByStartSegment).toEqual({});
	});

	it('puts a single event in one lane', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 4)]);
		expect(layout.laneCount).toBe(1);
		expect(layout.hasOverlap).toBeFalse();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
	});

	it('shares one lane for touching edges (one ends where the next starts)', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 6), makeEvent('e2', 6, 2)]);
		expect(layout.laneCount).toBe(1);
		expect(layout.hasOverlap).toBeFalse();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
		expect(layout.eventsByStartSegment[6][0].lane).toBe(0);
	});

	it('splits two time-overlapping events into two lanes', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 4), makeEvent('e2', 2, 4)]);
		expect(layout.laneCount).toBe(2);
		expect(layout.hasOverlap).toBeTrue();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
		expect(layout.eventsByStartSegment[2][0].lane).toBe(1);
	});

	it('keeps both events that share the same start segment (bug fix)', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 2), makeEvent('e2', 0, 2)]);
		expect(layout.laneCount).toBe(2);
		expect(layout.hasOverlap).toBeTrue();
		expect(layout.eventsByStartSegment[0].length).toBe(2);
		const lanes = layout.eventsByStartSegment[0].map((e) => e.lane).sort();
		expect(lanes).toEqual([0, 1]);
	});

	it('grows to three lanes for three concurrent events, each in its own lane', () => {
		const layout = layoutPlaceEvents([
			makeEvent('e1', 0, 6),
			makeEvent('e2', 1, 6),
			makeEvent('e3', 2, 6),
		]);
		expect(layout.laneCount).toBe(3);
		expect(layout.hasOverlap).toBeTrue();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
		expect(layout.eventsByStartSegment[1][0].lane).toBe(1);
		expect(layout.eventsByStartSegment[2][0].lane).toBe(2);
	});

	it('reuses a freed lane: three events fit in two lanes', () => {
		const layout = layoutPlaceEvents([
			makeEvent('e1', 0, 4), // lane 0, ends at segment 4
			makeEvent('e2', 2, 4), // lane 1 (overlaps e1)
			makeEvent('e3', 4, 2), // starts at 4 — reuses lane 0 (e1 finished)
		]);
		expect(layout.laneCount).toBe(2);
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
		expect(layout.eventsByStartSegment[2][0].lane).toBe(1);
		expect(layout.eventsByStartSegment[4][0].lane).toBe(0);
	});

	it('assigns lanes deterministically regardless of input order', () => {
		const a = layoutPlaceEvents([makeEvent('late', 2, 2), makeEvent('early', 0, 4)]);
		const b = layoutPlaceEvents([makeEvent('early', 0, 4), makeEvent('late', 2, 2)]);
		expect(a.eventsByStartSegment[0][0].lane).toBe(0);
		expect(a.eventsByStartSegment[2][0].lane).toBe(1);
		expect(b.eventsByStartSegment[0][0].lane).toBe(0);
		expect(b.eventsByStartSegment[2][0].lane).toBe(1);
	});
});
