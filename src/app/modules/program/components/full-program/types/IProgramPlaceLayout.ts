import {IProgramEvent} from '../../../types/IProgramPlace';

export interface IProgramEventLayout extends IProgramEvent {
	lane: number; // 0-based vodorovný pruh
}

export interface IProgramPlaceLayout {
	// víc eventů na stejný startovní segment → pole (žádný přepis)
	eventsByStartSegment: Record<number, IProgramEventLayout[]>;
	laneCount: number;   // ≥ 1; pro prázdné místo = 1 (řádek 65px jako dnes)
	hasOverlap: boolean; // laneCount > 1
}
