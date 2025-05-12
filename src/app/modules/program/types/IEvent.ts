import {IProgramPlace} from './IProgramPlace';

export interface IEvent {
	id: string;
	name: string;
	name_EN: string;
	description: string;
	description_EN: string;
	image?: string;
	start: string;
	end: string;
	placeId: string;
	place: IProgramPlace;
	favorite: boolean;
	type: number;
}
