import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
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
import { StorageService } from "../../../../common/services/storage/storage.service";
import { NetworkService } from "../../../../common/services/network/network.service";
import { EventReminderService } from "../../../notifications/services/event-reminder/event-reminder.service";
import { retryWithBackoff } from "../../../../common/utils/retry-with-backoff";

const PLACES_CACHE_KEY = 'places';
const EVENTS_CACHE_KEY = 'events';
const FAVORITES_CACHE_KEY = 'favorites';

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
	readonly #eventTypes = signal<IEventType[]>([]);
	// Signal so OnPush consumers (e.g. the event legend) refresh when types load,
	// including after a websocket reconnect (loadEventTypes fires no other signal).
	public readonly eventTypes = this.#eventTypes.asReadonly();
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
	private readonly storage: StorageService = inject(StorageService);
	private readonly networkService: NetworkService = inject(NetworkService);
	private readonly reminderService: EventReminderService = inject(EventReminderService);

	#websocketInitialized = false;
	#networkListenerRegistered = false;
	#connectInFlight: Promise<void> | null = null;
	// Set while a festival switch is being applied, so the stale-festival cache isn't loaded back in.
	#festivalChangePending = false;

	public async loadCachedData(): Promise<void> {
		// A festival switch is being applied concurrently — loading the old festival's cache here would
		// race the purge and could resurrect stale data. Skip it; the reset reloads fresh data itself.
		if (this.#festivalChangePending) {
			return;
		}
		try {
			const [localPlaces, localEvents] = await Promise.all([
				this.storage.get(PLACES_CACHE_KEY),
				this.storage.get(EVENTS_CACHE_KEY),
			]);
			if (localPlaces && localEvents) {
				await this.loadProgramData(JSON.parse(localPlaces), JSON.parse(localEvents));
			}
		} catch (e) {
			console.error("Cannot load program from cached data", e);
		}
	}

	public readonly eventsLoadFailed = signal(false);
	public readonly eventsLoading = signal(true);

	public async initWebsocket(): Promise<void> {
		try {
			await this.networkService.init();
			this.registerNetworkListener();

			if (await this.networkService.isConnected()) {
				await this.connectAndLoad();
			}
			this.eventsLoadFailed.set(false);
		} catch (e) {
			console.error('Error while initializing websocket communication: ', e);
			this.eventsLoadFailed.set(true);
		} finally {
			this.eventsLoading.set(false);
		}
	}

	/**
	 * Bring up the socket (once) and load fresh data. Idempotent: if the socket is
	 * already up we just refresh data — we never open a second socket or re-register
	 * handlers, which protects against duplicate websocket events / notifications.
	 */
	private connectAndLoad(): Promise<void> {
		// Re-entrancy guard: initial init, app-resume and network-regain can all call
		// this concurrently. Without it, overlapping calls (before #websocketInitialized
		// is set, several awaits in) would each run loadProgramData and re-register
		// handlers. Coalesce concurrent callers onto a single in-flight operation.
		if (this.#connectInFlight) {
			return this.#connectInFlight;
		}
		this.#connectInFlight = this.#runConnectAndLoad().finally(() => {
			this.#connectInFlight = null;
		});
		return this.#connectInFlight;
	}

	async #runConnectAndLoad(): Promise<void> {
		if (this.#websocketInitialized) {
			await this.loadProgramData();
			return;
		}

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

		this.#websocketInitialized = true;
	}

	/**
	 * Called on app resume and when connectivity returns. Safe to call repeatedly:
	 * connects the socket only if it was never started (e.g. app launched offline),
	 * otherwise lets socket.io's own reconnection handle the live link.
	 */
	public async ensureConnected(): Promise<void> {
		try {
			if (await this.networkService.isConnected()) {
				await this.connectAndLoad();
				this.eventsLoadFailed.set(false);
			}
		} catch (e) {
			console.error('Error ensuring websocket connection: ', e);
		}
	}

	private registerNetworkListener(): void {
		if (this.#networkListenerRegistered) {
			return;
		}
		this.#networkListenerRegistered = true;
		this.networkService.addConnectedListener((connected) => {
			if (connected) {
				void this.ensureConnected();
			}
		});
	}

	private registerWebsocketHandlers(): void {
		this.eventService.off('eventCreated');
		this.eventService.off('eventUpdated');
		this.eventService.off('eventDeleted');

		this.eventService.on<IEvent>('eventCreated', (data) => {
			this.#allEvents = [...this.#allEvents, data];
			this.propagateEventUpdate();
		});

		this.eventService.on<IEvent>('eventUpdated', (data) => {
			const index = this.#allEvents.findIndex((event) => event.id === data.id);
			if (index === -1) {
				return;
			}
			this.#allEvents = [...this.#allEvents.slice(0, index), data, ...this.#allEvents.slice(index + 1)];
			void this.storage.set(EVENTS_CACHE_KEY, JSON.stringify(this.#allEvents));

			this.updateFavorites();
			this.propagateEventUpdate();
		});

		this.eventService.on<string>('eventDeleted', (eventId) => {
			this.#allEvents = this.#allEvents.filter((event) => event.id !== eventId);
			void this.storage.set(EVENTS_CACHE_KEY, JSON.stringify(this.#allEvents));

			this.updateFavorites();
			this.propagateEventUpdate();
		});
	}

	public async loadProgramData(places?: IProgramPlace[], events?: IEvent[]): Promise<void> {
		// Fetch the two heavy resources concurrently instead of serially — saves a
		// full round-trip on high-latency mobile links. (Event types stay sequential
		// below: they're non-critical and must not be requested if these fail.)
		const [resolvedPlaces, resolvedEvents] = await Promise.all([
			places ?? this.eventService.getPlaces(),
			events ?? this.eventService.getEvents(),
		]);
		this.#allPlaces = resolvedPlaces;
		this.#allEvents = resolvedEvents;
		void this.storage.set(PLACES_CACHE_KEY, JSON.stringify(this.#allPlaces));
		void this.storage.set(EVENTS_CACHE_KEY, JSON.stringify(this.#allEvents));

		for (const event of this.#allEvents) {
			event.favorite = this.favorites.map((obj) => obj.id).includes(event.id);
		}

		const cachedFavorites = await this.storage.get(FAVORITES_CACHE_KEY);
		this.#places.set(this.#allPlaces);
		this.loadDays();
		this.autoSelectDay();
		this.loadFavorites(JSON.parse(cachedFavorites || '[]'));
		this.extractTags();
		// Event types are non-critical (legend/filter only) and populate a signal
		// reactively — never await them, or a slow/offline /event-types (with retry)
		// would block the awaited startup path (loadCachedData runs in APP_INITIALIZER).
		this.loadEventTypes().catch((e) => console.error('Cannot load event types: ', e));
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
		void this.storage.set(FAVORITES_CACHE_KEY, JSON.stringify(this.favorites.map((obj) => obj.id)));
		void this.reminderService.sync(this.favorites);
	}

	public loadFavorites(value: string[]): void {
		for (const event of this.#allEvents) {
			event.favorite = value.includes(event.id);
		}

		this.favorites = this.getFavorites();
		void this.storage.set(FAVORITES_CACHE_KEY, JSON.stringify(this.favorites.map((obj) => obj.id)));
		void this.reminderService.sync(this.favorites);

		this.propagateEventUpdate();
	}

	public async loadEventTypes(): Promise<void> {
		const types = await firstValueFrom(
			this.http.get<IEventType[]>(`${environment.apiUrl}/public/event-types`).pipe(timeout(10_000), retryWithBackoff())
		);
		this.#eventTypes.set(types);
		// An active "event type" filter resolves event names → ids via #eventTypes, and the
		// filter pass in loadProgramData runs before types are loaded. Re-apply now so a saved
		// eventType filter doesn't leave the program empty until the user interacts.
		this.propagateEventUpdate();
	}

	/**
	 * Extract unique tags from loaded events (no standalone public tags endpoint)
	 */
	private extractTags(): void {
		const tagMap = new Map<string, IEventTag>();
		for (const event of this.#allEvents) {
			for (const tag of event.tags) {
				if (!tagMap.has(tag.id)) {
					tagMap.set(tag.id, tag);
				}
			}
		}
		this.tags = Array.from(tagMap.values());
	}

	private propagateEventUpdate(): void {
		const newEvents = this.applyEventFilters(this.#allEvents, this.userFilterOptions);
		this.#events.set(newEvents);
	}

	private applyEventFilters(events: IEvent[], filterOptions: IProgramFilterOptions): IEvent[] {
		if (!filterOptions || !Object.keys(filterOptions).length) {
			return events;
		}

		// Events embed their eventType as {name, color} without an id, while the
		// filter selects ids from the /public/event-types endpoint. Bridge the two
		// by resolving the event's type id via its name (id is used directly when present).
		const typeIdByName = new Map(this.#eventTypes().map((type) => [type.name, type.id]));

		return events.filter((event) => {
			if (filterOptions.locationId !== undefined && filterOptions.locationId.length > 0) {
				if (!filterOptions.locationId.includes(event.locationId)) {
					return false;
				}
			}

			if (filterOptions.eventType !== undefined && filterOptions.eventType.length > 0) {
				const eventTypeId = event.eventType?.id ?? typeIdByName.get(event.eventType?.name);
				if (eventTypeId === undefined || !filterOptions.eventType.includes(eventTypeId)) {
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
			const startDate = dayjs(event.startAt).startOf('day').valueOf();
			const endDate = dayjs(event.endAt);

			if (Object.values(days).length > 0 && endDate.get('hour') <= ProgramConfig.eventEndHourThreshold) {
				continue;
			}

			if (!days[startDate]) {
				days[startDate] = startDate;
			}
		}

		this.#days.set(days);
	}

	// Program data cached via StorageService (Preferences: native SharedPreferences/UserDefaults,
	// web localStorage under a "CapacitorStorage." prefix).
	private readonly storageCacheKeys = [EVENTS_CACHE_KEY, PLACES_CACHE_KEY, FAVORITES_CACHE_KEY];
	// User preferences written directly to window.localStorage (NOT via StorageService), so they
	// need a raw removeItem — Preferences.remove would target a differently-prefixed key and miss them.
	private readonly rawLocalStorageKeys = ['userFilterOptions', 'showEventDetails'];

	// Awaited so callers can sequence the reset against other cache writes (avoids a stale
	// loadProgramData().storage.set landing after these removes). localStorage access is wrapped:
	// removeItem can throw (Safari private mode / storage disabled) and must not abort the reset.
	private async clearProgramCache(): Promise<void> {
		await Promise.all(this.storageCacheKeys.map((key) => this.storage.remove(key)));
		for (const key of this.rawLocalStorageKeys) {
			try {
				localStorage.removeItem(key);
			} catch (e) {
				console.error(`Failed to clear localStorage key "${key}"`, e);
			}
		}
	}

	/**
	 * Called when the backend switches to a new festival: everything cached for the previous one
	 * (events, places, favorites, filters, view prefs) is now stale, so wipe both the persisted
	 * cache and the in-memory state, then reload fresh program data for the new festival.
	 *
	 * Throws if it can't complete (e.g. offline): the caller then keeps the old festival marker so
	 * the switch is retried on the next launch rather than leaving the user with a blank program.
	 */
	public async resetForNewFestival(): Promise<void> {
		// Don't wipe the cache until we know we can fetch the replacement — blanking the app offline
		// would be worse than briefly showing the previous festival.
		if (!(await this.networkService.isConnected())) {
			throw new Error('Cannot switch festival while offline');
		}

		this.#festivalChangePending = true;
		try {
			await this.clearProgramCache();

			this.#allEvents = [];
			this.#allPlaces = [];
			this.favorites = [];
			this.#userFilterOptions = {};
			this.activeFiltersCount = 0;
			this.#showEventDetails = false;
			this.selectedDay.set(undefined);
			this.#days.set({});
			this.#events.set([]);
			this.#places.set([]);

			// Reload through the same in-flight guard as the websocket path so a reset reload and a
			// websocket-triggered load can never overlap and clobber each other's state.
			await this.connectAndLoad();
		} finally {
			this.#festivalChangePending = false;
		}
	}
}
