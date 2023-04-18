import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {IEvent} from '../../types/IEvent';
import * as dayjs from 'dayjs';
import {IProgramPlace} from '../../types/IProgramPlace';
import {EEventType} from '../../types/EEventType';
import {IProgramFilterOptions} from '../../components/full-program/types/IProgramFilterOptions';

@Injectable({
	providedIn: 'root'
})
export class ProgramService {
	/**
	 * All events in program
	 * @private
	 */
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

	/**
	 * Filtered events in program
	 * This subject is used to subscribe to all changes and filtering in events, but these changes are also propagated
	 * to allEvents, so we can use it offline
	 *
	 * TODO: implement store?
	 * @private
	 */
	#events$: BehaviorSubject<IEvent[]> = new BehaviorSubject(this.#allEvents);

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

	public userFilterOptions: IProgramFilterOptions = {};

	public get allEvents(): IEvent[] {
		return this.#allEvents;
	}

	public days: Record<number, number> = {
		1: 1678489200000, // 11.3.2022 00:00
		2: 1678575600000, // 12.3.2022 00:00,
		3: 1678662000000, // 13.3.2022 00:00,
	};

	public async loadProgramData(): Promise<void> {
		// TODO: load all events and place from server on app init and store them in local storage, so we can
		// display basic data offline
	}

	public getEvents(day?: number): Observable<IEvent[]> {
		// TODO: implement websocket
		let result = this.#allEvents;
		if(day) {
			result = this.#allEvents.filter((event) => {
				return dayjs(event.start).isSame(this.days[day], 'day');
			});
		}

		this.#events$.next(result);

		return this.#events$;
	}

	/**
	 * Apply filters to events and propagate new value
	 * @param filterOptions
	 */
	public filterEvents(filterOptions: Partial<IProgramFilterOptions>): void {
		const result = this.applyEventFilters(this.#allEvents, filterOptions);

		this.#events$.next(result);
	}

	public getPlaces(): Observable<IProgramPlace[]> {
		return this.#places$;
	}

	/**
	 * Local place filtering
	 * @param placeId
	 */
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

	public getEventById(id: string): Observable<IEvent | undefined> {
		return of(this.#allEvents.find((event) => event.id === id));
	}

	public updateEvent(event: IEvent, property: keyof IEvent, value: string | number | boolean): void {
		const eventToUpdate: IEvent | undefined = this.#allEvents.find((e) => e.id === event.id);
		if(eventToUpdate && Object.prototype.hasOwnProperty.call(eventToUpdate, property)) {
			// TODO: resolve typing issue
			// @ts-ignore
			eventToUpdate[property] = value;
		}
		const newEvents = this.applyEventFilters(this.#allEvents, this.userFilterOptions);
		this.#events$.next(newEvents);
	}

	private applyEventFilters(events: IEvent[], filterOptions: IProgramFilterOptions): IEvent[] {
		let result = events;
		if(!filterOptions || !Object.keys(filterOptions).length) {
			return result;
		}

		result = result.filter((event) => {
			let include = true;

			if(filterOptions.placeId !== undefined) {
				include = !filterOptions.placeId?.includes(event.type) ?? true;
			}

			if(filterOptions.eventType !== undefined) {
				include = !filterOptions.eventType?.includes(event.type) ?? true;
			}

			if(filterOptions.onlyFavorite === true) {
				include = event.favorite
			}

			return include;
		});

		return result;
	}
}
