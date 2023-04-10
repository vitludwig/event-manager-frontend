import {EEventType} from '../../../types/EEventType';

export interface IProgramFilterOptions {
	eventType: EEventType[] | null;
	placeId: string[] | null;

}
