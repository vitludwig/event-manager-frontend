import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {IEvent} from '../../types/IEvent';
import * as dayjs from 'dayjs';
import {IProgramPlace} from '../../types/IProgramPlace';
import {IProgramFilterOptions} from '../../components/full-program/types/IProgramFilterOptions';
import {EventService} from '../event/event.service';

@Injectable({
	providedIn: 'root'
})
export class ProgramService {
	public userFilterOptions: IProgramFilterOptions = {};
	public get allEvents(): IEvent[] {
		return this.#allEvents;
	}

	/**
	 * All events in program
	 * @private
	 */
	#allEvents: IEvent[] = [];

	#allPlaces: IProgramPlace[] = [];

	/**
	 * Filtered events in program
	 * This subject is used to subscribe to all changes and filtering in events, but these changes are also propagated
	 * to allEvents, so we can use it offline
	 *
	 * TODO: implement store?
	 * @private
	 */
	#events: BehaviorSubject<IEvent[]> = new BehaviorSubject(this.#allEvents);
	#places: BehaviorSubject<IProgramPlace[]> = new BehaviorSubject(this.#allPlaces);
	#days: BehaviorSubject<Record<number, number>> = new BehaviorSubject<Record<number, number>>({});

	public places$: Observable<IProgramPlace[]> = this.#places.asObservable();
	public days$ = this.#days.asObservable();

	constructor(
		private eventService: EventService,
	) { }

	public async initWebsocket(): Promise<void> {
		try {
			await this.eventService.initWebsocket()
			await this.loadProgramData();

			this.eventService.on<IEvent>('newEvent', (data) => {
				console.log('new event: ', data);
				this.#allEvents = [...this.#allEvents, data];

				this.propagateEventUpdate();
			});

			this.eventService.on<IEvent>('updateEvent', (data) => {
				console.log('update event: ', data);
				const index = this.#allEvents.findIndex((event) => event.id === data.id);
				this.#allEvents[index] = data;

				this.propagateEventUpdate();
			});
		} catch(e) {
			console.error('Error while initializing websocket communication: ', e);
		}
	}

	public async loadProgramData(): Promise<void> {
		this.#allPlaces = await this.eventService.getPlaces();
		this.#allEvents = await this.eventService.getEvents();
		console.log('allevents', this.#allEvents);
		this.loadDays();

		// TODO: store them in local storage, so we can display basic data offline
	}

	public getEvents(day?: number): Observable<IEvent[]> {
		// TODO: implement websocket
		let result = this.#allEvents;

		if(day) {
			result = this.#allEvents.filter((event) => {
				return dayjs(event.start).isSame(day, 'day');
			});
		}

		this.#events.next(result);

		return this.#events;
	}

	/**
	 * Apply filters to events and propagate new value
	 * @param filterOptions
	 */
	public filterEvents(filterOptions: Partial<IProgramFilterOptions>): void {
		const result = this.applyEventFilters(this.#allEvents, filterOptions);

		this.#events.next(result);
	}

	/**
	 * Local place filtering
	 * @param placeId
	 */
	public filterPlaces(placeId: string[] | null = null): void {
		if(placeId) {
			const newPlaces = this.#allPlaces.filter((place) => placeId.includes(place.id));
			this.#places.next(newPlaces);
		} else {
			this.#places.next(this.#allPlaces);
		}
	}

	public getPlaceById(id: string): Observable<IProgramPlace | undefined> {
		return of(this.#allPlaces.find((place) => place.id === id));
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

		this.propagateEventUpdate();
	}

	private propagateEventUpdate(): void {
		const newEvents = this.applyEventFilters(this.#allEvents, this.userFilterOptions);
		this.#events.next(newEvents);
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

	private loadDays(): void {
		const days = this.#days.getValue();
		this.#allEvents.forEach((event) => {
			const date = dayjs(event.start).startOf('day').valueOf();
			if(!days[date]) {
				days[date] = date;
			}
		});
		this.#days.next(days);
	}
}
