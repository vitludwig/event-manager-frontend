import {EEventType} from './EEventType';
import {IProgramPlace} from './IProgramPlace';

export interface IEvent {
	id: string;
	name: string;
	description: string;
	image?: string;
	start: number;
	end: number;
	placeId: string;
	place: IProgramPlace;
	favorite: boolean;
	type: number;
}
