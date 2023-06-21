import {EEventType} from '../../../types/EEventType';

export interface IProgramFilterOptions {
	eventType?: EEventType[];
	placeId?: string[];
	onlyFavorite?: boolean;

}
