import {IProgramPlace} from './IProgramPlace';

export interface IEvent {
	id: string;
	name: string;
	name_EN: string;
	description: string;
	description_EN: string;
	image?: string;
	start: number;
	end: number;
	placeId: string;
	place: IProgramPlace;
	favorite: boolean;
	type: number;
}
