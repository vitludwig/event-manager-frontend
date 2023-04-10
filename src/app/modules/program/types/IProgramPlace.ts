import {IEvent} from './IEvent';

export interface IProgramPlace {
	id: string;
	name: string;
	color: string;
}

export interface IProgramEvent extends IEvent {
	startSegment: number; // in which 15-minute segment event starts
	segmentCount: number; // how many segments event lasts
}
