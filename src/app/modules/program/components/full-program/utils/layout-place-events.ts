import {IProgramEvent} from '../../../types/IProgramPlace';
import {IProgramEventLayout, IProgramPlaceLayout} from '../types/IProgramPlaceLayout';

/**
 * Greedy interval partitioning — přiřadí každému eventu nejnižší volný pruh,
 * čímž naskládá časově se překrývající eventy pod sebe s minimem pruhů.
 * Dotykové hrany (jeden končí v segmentu N, druhý začíná v N) sdílejí pruh.
 */
export function layoutPlaceEvents(events: IProgramEvent[]): IProgramPlaceLayout {
	const sorted = [...events].sort((a, b) => {
		if (a.startSegment !== b.startSegment) {
			return a.startSegment - b.startSegment;
		}
		return b.segmentCount - a.segmentCount;
	});

	const lanesEnd: number[] = []; // koncový segment (exkluzivně) posledního eventu v pruhu
	const eventsByStartSegment: Record<number, IProgramEventLayout[]> = {};

	for (const event of sorted) {
		const end = event.startSegment + event.segmentCount;

		let lane = lanesEnd.findIndex((laneEnd) => laneEnd <= event.startSegment);
		if (lane === -1) {
			lane = lanesEnd.length;
		}
		lanesEnd[lane] = end;

		const layoutEvent: IProgramEventLayout = {...event, lane};
		if (!eventsByStartSegment[event.startSegment]) {
			eventsByStartSegment[event.startSegment] = [];
		}
		eventsByStartSegment[event.startSegment].push(layoutEvent);
	}

	const laneCount = Math.max(1, lanesEnd.length);

	return {
		eventsByStartSegment,
		laneCount,
		hasOverlap: laneCount > 1,
	};
}
