import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatButtonModule} from '@angular/material/button';
import {IProgramEvent} from '../../types/IProgramPlace';
import {IProgramDay} from '../full-program/types/IProgramDay';
import {ProgramService} from '../../services/program/program.service';
import * as dayjs from 'dayjs';
import {IEvent} from '../../types/IEvent';

@Component({
	selector: 'app-program-vertical-list',
	standalone: true,
	imports: [
		CommonModule,
		MatListModule,
		MatButtonModule
	],
	templateUrl: './program-vertical-list.component.html',
	styleUrls: ['./program-vertical-list.component.scss']
})
export class ProgramVerticalListComponent implements OnInit{
	@Input()
	public events: IEvent[] | null = [];

	protected groupEvents: Record<number, IEvent[]> = {};

	constructor(
		private programService: ProgramService,
	) {

	}

	public ngOnInit(): void {
		this.groupEvents = this.getGroupedEventsByDay(this.events);
		console.log('groupevents', this.groupEvents);
	}

	private getGroupedEventsByDay(events: IEvent[] | null): Record<number, IEvent[]> {
		if(!events) {
			return {};
		}

		const days = Object.values(this.programService.days);
		const result: Record<number, IEvent[]> = {};

		for(const event of events) {
			const eventDayStart = dayjs(event.start).startOf('day').valueOf();
			console.log(eventDayStart);
			const day = days.find(day => day === eventDayStart);
			if(day) {
				if(!result[day]) {
					result[day] = [];
				}
				result[day].push(event);
			}
		}

		return result;
	}
}
