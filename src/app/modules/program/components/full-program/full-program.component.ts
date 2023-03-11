import {
	Component,
	OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IEvent} from '../../types/IEvent';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import * as dayjs from 'dayjs';
import {TransformWidthPipe} from './pipes/transform-width.pipe';

@Component({
	selector: 'app-full-program',
	standalone: true,
	imports: [CommonModule, TransformWidthPipe],
	templateUrl: './full-program.component.html',
	styleUrls: ['./full-program.component.scss']
})
export class FullProgramComponent implements OnInit {
	public segmentWidth = 80; // in px
	public places: IProgramPlace[] = [
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
	public allSegments: { time: string | null, index: number }[] = [];

	private events: IEvent[] = [
		{
			id: '0',
			name: 'event0',
			description: 'desc0',
			start: 1678518900000, // 8:15 | 11.3 in seconds
			end: 1678520700000, // 8:45 | 11.3
		},
		{
			id: '1',
			name: 'event1',
			description: 'desc1',
			start: 1678523400000, // 9:30 | 11.3
			end: 1678525200000, // 10:00 | 11.3
		},
		{
			id: '2',
			name: 'event1',
			description: 'desc1',
			start: 1678532400000, // 12:00 | 11.3
			end: 1678539600000, // 14:00 | 11.3
		},
	];

	constructor() {
		// load timeline segments
		// TODO: do this only once and save it into localstorage
		const time = dayjs('00');
		this.allSegments = Array(96).fill(1).map((value, index) => {
			return {
				time: (index * 15) % 4 === 0 ? time.add(index * 15, 'minutes').format('HH:mm') : null,
				index: index
			};
		});


	}

	public ngOnInit(): void {
		this.loadEvents();
	}

	private loadEvents(): void {
		let dayStart;
		let eventStart;
		let eventEnd;
		let startSegment;
		let segmentCount;
		const events: IProgramEvent[] = [];

		for(const event of this.events) {
			eventStart = dayjs(event.start);
			eventEnd = dayjs(event.end);
			dayStart = eventStart.set('hour', 0).set('minutes', 0);
			// convert to seconds -> minutes -> 15 minutes segments
			startSegment = Math.ceil(Math.abs(dayStart.diff(eventStart)) / 1000 / 60 / 15);
			segmentCount = Math.ceil(Math.abs(eventStart.diff(eventEnd)) / 1000 / 60 / 15);

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
}
