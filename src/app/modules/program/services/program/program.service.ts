import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {IEvent} from '../../types/IEvent';
import * as dayjs from 'dayjs';

@Injectable({
	providedIn: 'root'
})
export class ProgramService {
	private allEvents: IEvent[] = [
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
		{
			id: '3',
			name: 'event3',
			description: 'desc3',
			start: 1678572000000, // 23:00 | 11.3
			end: 1678579200000, // 02:00 | 12.3
		},
		{
			id: '3',
			name: 'event3',
			description: 'desc3',
			start: 1678572000000, // 23:00 | 11.3
			end: 1678579200000, // 02:00 | 12.3
		},
		{
			id: '4',
			name: 'event4',
			description: 'desc4',
			start: 1678611600000, // 10:00 | 12.3
			end: 1678618800000, // 12:00 | 12.3
		},
		{
			id: '5',
			name: 'event5',
			description: 'desc5',
			start: 1678604400000, // 08:00 | 12.3
			end: 1678608000000, // 09:00 | 12.3
		},

	];

	public days: Record<number, number> = {
		1: 1678489200000, // 11.3.2022 00:00
		2: 1678575600000, // 12.3.2022 00:00,
		3: 1678662000000, // 13.3.2022 00:00,
	};

	public getEvents(day: number): Observable<IEvent[]> {
		// calculate timestamp in milliseocnds for date 11:00 13.3 2023

		const result = this.allEvents.filter((event) => {
			return dayjs(event.start).isSame(this.days[day], 'day');
		});
      
		return of(result);
	}
}
