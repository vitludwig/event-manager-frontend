import {Component, computed, inject} from '@angular/core';
import {ProgramService} from '../program/services/program/program.service';
import {IEvent} from '../program/types/IEvent';
import {EventSearchListComponent} from '../program/components/program-vertical-list/components/event-search-list/event-search-list.component';

@Component({
	selector: 'app-favorites',
	imports: [EventSearchListComponent],
	templateUrl: './favorites.component.html',
	styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent {
	private readonly programService = inject(ProgramService);

	protected readonly loading = this.programService.eventsLoading;

	protected readonly events = computed<IEvent[]>(() => {
		// Re-read once the program finishes loading (allEvents is not a signal).
		this.programService.eventsLoading();
		return this.programService.allEvents;
	});
}
