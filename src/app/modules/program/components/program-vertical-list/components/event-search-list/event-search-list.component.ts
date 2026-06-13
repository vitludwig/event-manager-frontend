import {Component, computed, input, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TranslateModule} from '@ngx-translate/core';
import {ProgramVerticalListComponent} from '../../program-vertical-list.component';
import {IEvent} from '../../../../types/IEvent';
import {Utils} from '../../../../../../common/utils/Utils';

@Component({
	selector: 'app-event-search-list',
	imports: [
		FormsModule,
		MatButtonModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		TranslateModule,
		ProgramVerticalListComponent,
	],
	templateUrl: './event-search-list.component.html',
	styleUrls: ['./event-search-list.component.scss'],
})
export class EventSearchListComponent {
	public readonly events = input<IEvent[] | null>([]);
	public readonly onlyFavorite = input<boolean>(false);
	public readonly showBackBtn = input<boolean>(false);
	public readonly loading = input<boolean>(false);
	public readonly emptyTitle = input<string>('Dnes tu není žádná akce');
	public readonly emptySubtitle = input<string>('Zkontrolujte nastavení filtrů');

	public readonly back = output<void>();

	protected readonly search = signal('');

	protected readonly filteredEvents = computed<IEvent[]>(() => {
		let events = this.events() ?? [];

		if (this.onlyFavorite()) {
			events = events.filter((event) => event.favorite);
		}

		const searchTerm = this.search();
		if (searchTerm) {
			const normalized = Utils.replaceCzechAccentSymbols(searchTerm.toLowerCase().trim());
			events = events.filter((event) =>
				Utils.replaceCzechAccentSymbols((event.nameCs ?? '').toLowerCase().trim()).includes(normalized),
			);
		}

		return events;
	});
}
