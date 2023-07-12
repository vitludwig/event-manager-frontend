import {inject, Injectable} from '@angular/core';
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

	public get userFilterOptions(): IProgramFilterOptions {
		const savedOptions = JSON.parse(localStorage.getItem('userFilterOptions') || '{}');
		if(Object.keys(savedOptions).length > 0) {
			this.#userFilterOptions = savedOptions;
		}

		return this.#userFilterOptions;
	}

	public set userFilterOptions(value: IProgramFilterOptions) {
		this.#userFilterOptions = value;
		localStorage.setItem('userFilterOptions', JSON.stringify(value));
	}

	public favorites: IEvent[] = [];
	public selectedDay: number; // used to persist the selected day between routes
	#showEventDetails: boolean = false; // show detailed information of event in program (i.e. abbreviation of event type)


	public get showEventDetails(): boolean {
		return localStorage.getItem('showEventDetails') === 'true' ?? this.#showEventDetails;
	}

	public set showEventDetails(value: boolean) {
		this.#showEventDetails = value;
		localStorage.setItem('showEventDetails', JSON.stringify(value));
	}

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
	#userFilterOptions: IProgramFilterOptions = {};

	public places$: Observable<IProgramPlace[]> = this.#places.asObservable();
	public days$ = this.#days.asObservable();

	public get allPlaces(): IProgramPlace[] {
		return this.#allPlaces;
	}

	private readonly eventService: EventService = inject(EventService);

	public async initWebsocket(): Promise<void> {
		try {
			const localPlaces = localStorage.getItem('places');
			const localEvents = localStorage.getItem('events');
			if(localPlaces && localEvents) {
				await this.loadProgramData(JSON.parse(localPlaces), JSON.parse(localEvents));
			}

			if(window.navigator.onLine) {
				await this.eventService.initWebsocket();
				await this.loadProgramData();

				this.eventService.on<IEvent>('newEvent', (data) => {
					this.#allEvents = [...this.#allEvents, data];
					this.propagateEventUpdate();
				});

				this.eventService.on<IEvent>('updateEvent', (data) => {
					const index = this.#allEvents.findIndex((event) => event.id === data.id);
					this.#allEvents[index] = data;

					this.updateFavorites();
					this.propagateEventUpdate();
				});
			}
		} catch(e) {
			console.error('Error while initializing websocket communication: ', e);
		}
	}

	public async loadProgramData(places?: IProgramPlace[], events?: IEvent[]): Promise<void> {
		this.#allPlaces = places ?? (await this.eventService.getPlaces());
		this.#allEvents = events ?? (await this.eventService.getEvents());
		localStorage.setItem('places', JSON.stringify(this.#allPlaces));
		localStorage.setItem('events', JSON.stringify(this.#allEvents));

		for(const event of this.#allEvents) {
			event.favorite = this.favorites.map((obj) => obj.id).includes(event.id);
		}

		this.loadDays();
		this.loadFavorites(JSON.parse(localStorage.getItem('favorites') || '[]'));
	}

	public getEvents(day?: number): Observable<IEvent[]> {
		let result = this.#allEvents;

		if(day) {
			result = this.#allEvents.filter((event) => {
				return dayjs(event.start).isSame(day, 'day');
			});
		}

		this.#events.next(result);

		return this.#events;
	}

	public getEvent(id: string): IEvent | undefined {
		return this.#allEvents.find((event) => event.id === id);
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
		if(eventToUpdate) {
			// TODO: resolve typing issue
			// @ts-ignore
			eventToUpdate[property] = value;
		}
		if(property === 'favorite') {
			this.updateFavorites();
		}
		this.propagateEventUpdate();
	}

	public getFavorites(): IEvent[] {
		return this.#allEvents.filter((event) => event.favorite);
	}

	private updateFavorites(): void {
		this.favorites = this.getFavorites();
		console.log('new favorites', this.favorites);
		localStorage.setItem('favorites', JSON.stringify(this.favorites.map((obj) => obj.id)));
	}

	public loadFavorites(value: string[]): void {
		for(const event of this.#allEvents) {
			event.favorite = value.includes(event.id);
		}

		this.favorites = this.getFavorites();
		localStorage.setItem('favorites', JSON.stringify(this.favorites.map((obj) => obj.id)));

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
				include = !filterOptions.placeId.includes(event.placeId);
			}

			if(filterOptions.eventType !== undefined) {
				include = filterOptions.eventType.includes(event.type);
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
