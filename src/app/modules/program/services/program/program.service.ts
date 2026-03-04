import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IEvent } from '../../types/IEvent';
import dayjs from 'dayjs';
import { IProgramPlace } from '../../types/IProgramPlace';
import { IProgramFilterOptions } from '../../components/full-program/types/IProgramFilterOptions';
import { EventService } from '../event/event.service';
import { HttpClient } from "@angular/common/http";
import { IEventType } from "../../types/IEventType";
import { environment } from "../../../../../environments/environment";
import ProgramConfig from "../../config/ProgramConfig";
import { IEventTag } from "../../types/IEventTag";

@Injectable({
	providedIn: 'root'
})
export class ProgramService {
	private readonly http: HttpClient = inject(HttpClient);

	public get userFilterOptions(): IProgramFilterOptions {
		const savedOptions = JSON.parse(localStorage.getItem('userFilterOptions') || '{}');
		if (Object.keys(savedOptions).length > 0) {
			this.#userFilterOptions = savedOptions;
		}

		return this.#userFilterOptions;
	}

	public set userFilterOptions(value: IProgramFilterOptions) {
		this.#userFilterOptions = value;
		this.activeFiltersCount = Object.values(value).filter((v) => {
			if(Array.isArray(v)) {
				return v?.length > 0;
			}
			return !!v;
		}).length;
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
		if (showDetails == null) {
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
		} catch (e) {
			console.error("Cannot load program from cached data", e);
		}
	}

	public async initWebsocket(): Promise<void> {
		try {
			if (window.navigator.onLine) {
				await this.eventService.initWebsocket();
				await this.loadProgramData();
				this.registerWebsocketHandlers();

				this.eventService.onReconnected(async () => {
					try {
						await this.loadProgramData();
					} catch (e) {
						console.error('Error reloading data after reconnection: ', e);
					}
				});
			}
		} catch (e) {
			console.error('Error while initializing websocket communication: ', e);
		}
	}

	private registerWebsocketHandlers(): void {
		this.eventService.off('newEvent');
		this.eventService.off('updateEvent');

		this.eventService.on<IEvent>('newEvent', (data) => {
			this.#allEvents = [...this.#allEvents, data];
			this.propagateEventUpdate();
		});

		this.eventService.on<IEvent>('updateEvent', (data) => {
			const index = this.#allEvents.findIndex((event) => event.id === data.id);
			if (index === -1) {
				return;
			}
			this.#allEvents = [...this.#allEvents.slice(0, index), data, ...this.#allEvents.slice(index + 1)];
			localStorage.setItem('events', JSON.stringify(this.#allEvents));

			this.updateFavorites();
			this.propagateEventUpdate();
		});
	}

	public async loadProgramData(places?: IProgramPlace[], events?: IEvent[]): Promise<void> {
		this.#allPlaces = places ?? (await this.eventService.getPlaces());
		this.#allEvents = events ?? (await this.eventService.getEvents());
		localStorage.setItem('places', JSON.stringify(this.#allPlaces));
		localStorage.setItem('places', JSON.stringify(this.#allPlaces));
		localStorage.setItem('events', JSON.stringify(this.#allEvents));

		for (const event of this.#allEvents) {
			event.favorite = this.favorites.map((obj) => obj.id).includes(event.id);
		}

		this.#places.set(this.#allPlaces);
		this.loadDays();
		this.autoSelectDay();
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
		if (placeId) {
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

	public updateEvent<K extends keyof IEvent>(event: IEvent, property: K, value: IEvent[K]): void {
		const index = this.#allEvents.findIndex((e) => e.id === event.id);
		if (index !== -1) {
			this.#allEvents = this.#allEvents.map((e, i) =>
				i === index ? { ...e, [property]: value } : e
			);
		}
		if (property === 'favorite') {
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
		for (const event of this.#allEvents) {
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
		this.tags = await firstValueFrom(this.http.get<IEventTag[]>(`${environment.apiUrl}/tags`));
	}

	private propagateEventUpdate(): void {
		const newEvents = this.applyEventFilters(this.#allEvents, this.userFilterOptions);
		this.#events.set(newEvents);
	}

	private applyEventFilters(events: IEvent[], filterOptions: IProgramFilterOptions): IEvent[] {
		if (!filterOptions || !Object.keys(filterOptions).length) {
			return events;
		}

		return events.filter((event) => {
			if (filterOptions.placeId !== undefined && filterOptions.placeId.length > 0) {
				if (!filterOptions.placeId.includes(event.placeId)) {
					return false;
				}
			}

			if (filterOptions.eventType !== undefined && filterOptions.eventType.length > 0) {
				if (!filterOptions.eventType.includes(event.type.id)) {
					return false;
				}
			}

			if (filterOptions.tags !== undefined && filterOptions.tags.length > 0) {
				const eventTagIds = event.tags.map((tag) => tag.id);
				if (!filterOptions.tags.some((tag) => eventTagIds.includes(tag))) {
					return false;
				}
			}

			if (filterOptions.onlyFavorite === true) {
				if (!event.favorite) {
					return false;
				}
			}

			return true;
		});
	}

	private autoSelectDay(): void {
		if (this.selectedDay() !== undefined) {
			return;
		}
		const days = this.#days();
		const entries = Object.entries(days).sort();
		if (entries.length === 0) {
			return;
		}
		const today = dayjs();
		const todayEntry = entries.find(([_, date]) => dayjs(date).isSame(today, 'day'));
		this.selectedDay.set(todayEntry ? Number(todayEntry[0]) : Number(entries[0][0]));
	}

	private loadDays(): void {
		const days = { ...this.#days() };
		for (const event of this.#allEvents) {
			const startDate = dayjs(event.start).startOf('day').valueOf();
			const endDate = dayjs(event.end);

			if (Object.values(days).length > 0 && endDate.get('hour') <= ProgramConfig.eventEndHourThreshold) {
				continue;
			}

			if (!days[startDate]) {
				days[startDate] = startDate;
			}
		}

		this.#days.set(days);
	}

	private readonly programCacheKeys = ['events', 'places', 'favorites', 'userFilterOptions', 'showEventDetails', 'appEventId'];

	private clearProgramCache(): void {
		for (const key of this.programCacheKeys) {
			localStorage.removeItem(key);
		}
	}

	private async checkCacheValidity(): Promise<void> {
		try {
			const appEventIdStored = localStorage.getItem('appEventId');
			const appEventId = await this.getAppEventId();
			if (appEventIdStored !== appEventId) {
				this.clearProgramCache();
				localStorage.setItem('appEventId', appEventId);
			}
		} catch (e) {
			this.clearProgramCache();
		}
	}

	/**
	 * Used to invalidate events in local storage from another event
	 * @private
	 */
	private getAppEventId(): Promise<string> {
		return firstValueFrom(this.http.get(`${environment.signalrUrl}/public/appEventId.txt`, { responseType: 'text' }));
	}
}
