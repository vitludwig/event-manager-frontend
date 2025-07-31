import {IProgramPlace} from './IProgramPlace';
import {IEventType} from "./IEventType";
import {IEventTag} from "./IEventTag";

export interface IEvent {
	id: string;
	name: string;
	name_EN: string;
	name_Secondary?: string;
	description: string;
	description_EN: string;
	image?: string;
	start: string;
	end: string;
	placeId: string;
	place: IProgramPlace;
	favorite: boolean;
	type: IEventType;
	tags: IEventTag[];
}
