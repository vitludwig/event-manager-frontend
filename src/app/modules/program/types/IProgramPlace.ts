import {IEvent} from './IEvent';

export interface IProgramPlace {
	name: string;
	color: string;
	events: Record<number, IProgramEvent>
}

export interface IProgramEvent extends IEvent {
	startSegment: number; // in which 15-minute segment event starts
	segmentCount: number; // how many segments event lasts
}
