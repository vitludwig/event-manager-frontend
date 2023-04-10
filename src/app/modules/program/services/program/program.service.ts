import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {IEvent} from '../../types/IEvent';
import * as dayjs from 'dayjs';
import {IProgramPlace} from '../../types/IProgramPlace';
import {EEventType} from '../../types/EEventType';

@Injectable({
	providedIn: 'root'
})
export class ProgramService {
	#allEvents: IEvent[] = [
		{
			id: '0',
			name: 'worksop1',
			description: 'desc0',
			start: 1678518900000, // 8:15 | 11.3 in seconds
			end: 1678520700000, // 8:45 | 11.3
			favorite: false,
			placeId: '1',
			type: EEventType.WORKSHOP,
		},
		{
			id: '1',
			name: 'prednaska1',
			description: 'desc1',
			start: 1678523400000, // 9:30 | 11.3
			end: 1678525200000, // 10:00 | 11.3
			favorite: false,
			placeId: '1',
			type: EEventType.LECTURE,
		},
		{
			id: '2',
			name: 'Neco jineho 1',
			description: 'desc2',
			start: 1678532400000, // 12:00 | 11.3
			end: 1678539600000, // 14:00 | 11.3
			favorite: false,
			placeId: '2',
			type: EEventType.OTHER,
		},
		{
			id: '3',
			name: 'koncert 1',
			description: 'desc3',
			start: 1678572000000, // 23:00 | 11.3
			end: 1678579200000, // 02:00 | 12.3
			favorite: false,
			placeId: '2',
			type: EEventType.CONCERT,
		},
		{
			id: '4',
			name: 'prednaska 2',
			description: 'desc4',
			start: 1678572000000, // 23:00 | 11.3
			end: 1678579200000, // 02:00 | 12.3
			favorite: false,
			placeId: '3',
			type: EEventType.LECTURE,
		},
		{
			id: '5',
			name: 'worksop 2',
			description: 'desc5',
			start: 1678611600000, // 10:00 | 12.3
			end: 1678618800000, // 12:00 | 12.3
			favorite: false,
			placeId: '3',
			type: EEventType.WORKSHOP,
		},
		{
			id: '6',
			name: 'koncert 3',
			description: 'desc6',
			start: 1678604400000, // 08:00 | 12.3
			end: 1678608000000, // 09:00 | 12.3
			favorite: false,
			placeId: '3',
			type: EEventType.CONCERT,
		},

	];
	#allEvents$: BehaviorSubject<IEvent[]> = new BehaviorSubject(this.#allEvents);

	#places: IProgramPlace[] = [
		{
			id: '1',
			name: 'namesti',
			color: '#d2348a',
		},
		{
			id: '2',
			name: 'bunkr1',
			color: '#d2348a',
		},
		{
			id: '3',
			name: 'bunkr2',
			color: '#d2348a',
		}
	];
	#places$: BehaviorSubject<IProgramPlace[]> = new BehaviorSubject(this.#places);

	public days: Record<number, number> = {
		1: 1678489200000, // 11.3.2022 00:00
		2: 1678575600000, // 12.3.2022 00:00,
		3: 1678662000000, // 13.3.2022 00:00,
	};

	public getEvents(day: number): Observable<IEvent[]> {
		const result = this.#allEvents.filter((event) => {
			return dayjs(event.start).isSame(this.days[day], 'day');
		});

		this.#allEvents$.next(result);

		return this.#allEvents$;
	}

	public filterEvents(day: number, eventType: EEventType[] | null = null): void {
		let result = this.#allEvents.filter((event) => {
			return dayjs(event.start).isSame(this.days[day], 'day');
		});

		if(eventType) {
			result = result.filter((event) => eventType.includes(event.type));
		}
		this.#allEvents$.next(result);
	}

	public getPlaces(): Observable<IProgramPlace[]> {
		return this.#places$;
	}

	public filterPlaces(placeId: string[] | null = null): void {
		if(placeId) {
			const newPlaces = this.#places.filter((place) => placeId.includes(place.id));
			this.#places$.next(newPlaces);
		} else {
			this.#places$.next(this.#places);
		}
	}

	public getPlaceById(id: string): Observable<IProgramPlace | undefined> {
		return of(this.#places.find((place) => place.id === id));
	}

	public setEventFavorite(id: string, favorite: boolean): void {
		const newEvents = this.#allEvents$.getValue().map((event) => {
			if(event.id === id) {
				event.favorite = favorite;
			}
			return event;
		});
		this.#allEvents$.next(newEvents);
	}
}
