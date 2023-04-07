import {
	Component,
	OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IEvent} from '../../types/IEvent';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import * as dayjs from 'dayjs';
import {TransformWidthPipe} from './pipes/transform-width.pipe';
import {ProgramService} from '../../services/program/program.service';
import {MatTabsModule} from '@angular/material/tabs';
import {PersonalProgramComponent} from '../personal-program/personal-program.component';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {Dayjs} from 'dayjs';

@Component({
	selector: 'app-full-program',
	standalone: true,
	imports: [CommonModule, TransformWidthPipe, MatTabsModule, PersonalProgramComponent, MatButtonToggleModule],
	templateUrl: './full-program.component.html',
	styleUrls: ['./full-program.component.scss']
})
export class FullProgramComponent implements OnInit {
	protected segmentWidth: number = 80; // in px
	protected places: IProgramPlace[] = [
		{
			name: 'namesti',
			color: '#d2348a',
			events: {},
		},
		{
			name: 'bunkr1',
			color: '#d2348a',
			events: {},
		},
		{
			name: 'bunkr2',
			color: '#d2348a',
			events: {},
		}

	];

	/**
	 * There are 96 15-minutes segments in a day
	 * Create array of number with value 1-96
	 */
	protected allSegments: { time: string | null, index: number }[] = [];
	protected days: {id: number; name: string}[] = [];
	protected selectedDay: number = 1;

	#firstEventAt: Dayjs;

	constructor(
		private programService: ProgramService,
	) {

	}

	public ngOnInit(): void {
		this.loadDays();
		this.setDay(1);
	}

	/**
	 * Loads all segments for day based from day's events start and end times
	 *
	 * @param events
	 * @protected
	 */
	protected loadDayTimeSegments(events: IEvent[]): void {
		if(events.length === 0) {
			this.allSegments = [];
			return;
		}
		// TODO: find a way how to optimize this - store days and compute this only if they differ
		const allStarts = events.map((event) => event.start);
		const allEnds = events.map((event) => event.end);
		const firstEventAt = allStarts.reduce((prev, curr) => prev < curr ? prev : curr);
		this.#firstEventAt = dayjs(firstEventAt);
		const lastEventAt = allEnds.reduce((prev, curr) => prev > curr ? prev : curr);
		const segmentCount = this.getSegmentsFromMilliseconds(Math.abs(this.#firstEventAt.diff(dayjs(lastEventAt))));
		console.log('segmentCount', segmentCount);

		const time = dayjs(firstEventAt);
		this.allSegments = Array(segmentCount).fill(1).map((value, index) => {
			return {
				time: (index * 15) % 4 === 0 ? time.add(index * 15, 'minutes').format('HH:mm') : null,
				index: index
			};
		});
	}

	/**
	 * Loads days from program service and transforms them into array of objects with day name and id
	 * @protected
	 */
	protected loadDays(): void {
		this.days = Object.entries(this.programService.days).map(([id, date]) => {
			return {
				id: Number(id),
				name: dayjs(date).format('dddd')
			};
		});
	}

	/**
	 * Sets selected day and loads events for that day
	 * @param day
	 * @protected
	 */
	protected setDay(day: number): void {
		this.selectedDay = day;
		this.programService.getEvents(day).subscribe((events) => {
			this.loadDayTimeSegments(events);
			this.loadEvents(events);
		});
	}


	/**
	 * Loads events into places
	 * @param allEvents
	 * @private
	 */
	private loadEvents(allEvents: IEvent[]): void {
		let dayStart;
		let eventStart;
		let eventEnd;
		let startSegment;
		let segmentCount;
		const events: IProgramEvent[] = [];

		for(const event of allEvents) {
			eventStart = dayjs(event.start);
			eventEnd = dayjs(event.end);
			dayStart = eventStart.set('hour', this.#firstEventAt.hour()).set('minutes', this.#firstEventAt.minute());
			// convert to seconds -> minutes -> 15 minutes segments
			startSegment = this.getSegmentsFromMilliseconds(Math.abs(dayStart.diff(eventStart)));
			segmentCount = this.getSegmentsFromMilliseconds(Math.abs(eventStart.diff(eventEnd)));

			events[startSegment] = {
				...event,
				startSegment,
				segmentCount
			};
		}

		for(const place of this.places) {
			place.events = events;
		}
	}

	private getSegmentsFromMilliseconds(milliseconds: number): number {
		return Math.ceil(milliseconds / 1000 / 60 / 15);
	}
}
