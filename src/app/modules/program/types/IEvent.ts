import {IProgramPlace} from './IProgramPlace';
import {IEventType} from "./IEventType";
import {IEventTag} from "./IEventTag";

export interface IEventAttribute {
	name: string;
	type: string;
	value: string | boolean | Date | null;
}

export interface IEvent {
	id: string;
	nameCs: string;
	nameEn: string;
	descriptionCs: string;
	descriptionEn: string;
	startAt: string;
	endAt: string;
	locationId: string;
	location: IProgramPlace;
	favorite: boolean;
	eventType: IEventType;
	tags: IEventTag[];
	attributes?: IEventAttribute[];
}
