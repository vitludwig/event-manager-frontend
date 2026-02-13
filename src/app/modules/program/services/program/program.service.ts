import {inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {IEvent} from '../../types/IEvent';
import dayjs from 'dayjs';
import {IProgramPlace} from '../../types/IProgramPlace';
import {IProgramFilterOptions} from '../../components/full-program/types/IProgramFilterOptions';
import {EventService} from '../event/event.service';
import {HttpClient} from "@angular/common/http";
import {IEventType} from "../../types/IEventType";
import {environment} from "../../../../../environments/environment";
import ProgramConfig from "../../config/ProgramConfig";
import {IEventTag} from "../../types/IEventTag";

@Injectable({
	providedIn: 'root'
})
export class ProgramService {
	private readonly http: HttpClient = inject(HttpClient);

	public get userFilterOptions(): IProgramFilterOptions {
		const savedOptions = JSON.parse(localStorage.getItem('userFilterOptions') || '{}');
		if(Object.keys(savedOptions).length > 0) {
			this.#userFilterOptions = savedOptions;
		}

		return this.#userFilterOptions;
	}

	public set userFilterOptions(value: IProgramFilterOptions) {
		this.#userFilterOptions = value;
		this.activeFiltersCount = Object.values(value).filter((v) => !!v).length;
		localStorage.setItem('userFilterOptions', JSON.stringify(value));
	}

	public activeFiltersCount: number = 0;
	public favorites: IEvent[] = [];
	public eventTypes: IEventType[] = [];
	public tags: IEventTag[] = [];
	public selectedDay = signal<number | undefined>(undefined);
	#showEventDetails: boolean = false;


	public get showEventDetails(): boolean {
        const showDetails = localStorage.getItem('showEventDetails');
        if(showDetails == null) {
            return this.#showEventDetails;
        }
		return localStorage.getItem('showEventDetails') === 'true';
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
	 * @private
	 */
	#events = signal<IEvent[]>([]);
	#places = signal<IProgramPlace[]>([]);
	#days = signal<Record<number, number>>({});
	#userFilterOptions: IProgramFilterOptions = {};

	public readonly places = this.#places.asReadonly();
	public readonly days = this.#days.asReadonly();
	public readonly events = this.#events.asReadonly();

	public get allPlaces(): IProgramPlace[] {
		return this.#allPlaces;
	}

	private readonly eventService: EventService = inject(EventService);

	public async loadCachedData(): Promise<void> {
		try {
			await this.checkCacheValidity();

			const localPlaces = localStorage.getItem('places');
			const localEvents = localStorage.getItem('events');
			if (localPlaces && localEvents) {
				await this.loadProgramData(JSON.parse(localPlaces), JSON.parse(localEvents));
			}
		} catch(e) {
			console.error("Cannot load program from cached data", e);
		}
	}

	public async initWebsocket(): Promise<void> {
		try {
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
					localStorage.setItem('events', JSON.stringify(this.#allEvents));

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

		this.#places.set(this.#allPlaces);
		this.loadDays();
		this.loadFavorites(JSON.parse(localStorage.getItem('favorites') || '[]'));
		await this.loadEventTypes();
		await this.loadTags();
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
		this.#events.set(result);
	}

	/**
	 * Local place filtering
	 * @param placeId
	 */
	public filterPlaces(placeId: string[] | null = null): void {
		if(placeId) {
			const newPlaces = this.#allPlaces.filter((place) => placeId.includes(place.id));
			this.#places.set(newPlaces);
		} else {
			this.#places.set(this.#allPlaces);
		}
	}

	public getPlaceById(id: string): IProgramPlace | undefined {
		return this.#allPlaces.find((place) => place.id === id);
	}

	public getEventById(id: string): IEvent | undefined {
		return this.#allEvents.find((event) => event.id === id);
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

	public async loadEventTypes(): Promise<void> {
		this.eventTypes = await firstValueFrom(this.http.get<IEventType[]>(`${environment.apiUrl}/eventTypes`));
	}

	public async loadTags(): Promise<void> {
		this.tags = await firstValueFrom(this.http.get<IEventType[]>(`${environment.apiUrl}/tags`));
	}

	private propagateEventUpdate(): void {
		const newEvents = this.applyEventFilters(this.#allEvents, this.userFilterOptions);
		this.#events.set(newEvents);
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
				include = filterOptions.eventType.includes(event.type.id);
			}

			if(filterOptions.tags !== undefined && filterOptions.tags.length > 0) {
				const eventTagIds = event.tags.map((tag) => tag.id);
				include = filterOptions.tags.some((tag) => eventTagIds.includes(tag));
			}

			if(filterOptions.onlyFavorite === true) {
				include = event.favorite
			}

			return include;
		});

		return result;
	}

	private loadDays(): void {
		const days = {...this.#days()};
		for(const event of this.#allEvents) {
			const startDate = dayjs(event.start).startOf('day').valueOf();
			const endDate = dayjs(event.end);

			if(Object.values(days).length > 0 && endDate.get('hour') <= ProgramConfig.eventEndHourThreshold) {
				continue;
			}

			if(!days[startDate]) {
				days[startDate] = startDate;
			}
		}

		this.#days.set(days);
	}

	private async checkCacheValidity(): Promise<void> {
		try {
			const appEventIdStored = localStorage.getItem('appEventId');
			const appEventId = await this.getAppEventId();
			if (appEventIdStored !== appEventId) {
				localStorage.clear();
				localStorage.setItem('appEventId', appEventId);
			}
		} catch(e) {
			localStorage.clear();
		}
	}

	/**
	 * Used to invalidate events in local storage from another event
	 * @private
	 */
	private getAppEventId(): Promise<string> {
		return firstValueFrom(this.http.get<string>('/public/appEventId.txt', { responseType: 'text' as 'json'}));
	}
}
