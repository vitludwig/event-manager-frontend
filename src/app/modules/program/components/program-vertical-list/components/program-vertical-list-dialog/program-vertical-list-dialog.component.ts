import {Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {ProgramVerticalListComponent} from '../../program-vertical-list.component';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ProgramService} from '../../../../services/program/program.service';
import {Utils} from '../../../../../../common/utils/Utils';

@Component({
    selector: 'app-program-vertical-list-dialog',
    imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    ProgramVerticalListComponent,
    TranslateModule,
    MatSlideToggleModule
],
    templateUrl: './program-vertical-list-dialog.component.html',
    styleUrls: ['./program-vertical-list-dialog.component.scss']
})
export class ProgramVerticalListDialogComponent {
	protected readonly search = signal('');
	protected readonly onlyFavorite = signal(false);
	protected readonly data: { events: IProgramEvent[] } = inject(MAT_DIALOG_DATA);

	private readonly programService: ProgramService = inject(ProgramService);

	protected readonly filteredEvents = computed(() => {
		let events = this.data.events;

		if(this.onlyFavorite()) {
			events = events.filter((event: IProgramEvent) => event.favorite);
		}

		const searchTerm = this.search();
		if(searchTerm) {
			const normalized = Utils.replaceCzechAccentSymbols(searchTerm.toLowerCase().trim());
			events = events.filter((event: IProgramEvent) =>
				Utils.replaceCzechAccentSymbols(event.name.toLowerCase().trim()).includes(normalized)
			);
		}

		return events;
	});

	constructor() {
		this.onlyFavorite.set(this.programService.userFilterOptions.onlyFavorite ?? false);
	}

	protected toggleFavorite(): void {
		this.onlyFavorite.update(v => !v);
	}
}
