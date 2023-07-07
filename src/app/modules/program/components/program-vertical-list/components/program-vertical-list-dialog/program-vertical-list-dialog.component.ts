import {Component, inject, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {ProgramVerticalListComponent} from '../../program-vertical-list.component';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {debounce} from '../../../../../../common/decorators/debounce';
import {TranslateModule} from '@ngx-translate/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ProgramService} from '../../../../services/program/program.service';
import {Utils} from '../../../../../../common/utils/Utils';

@Component({
	selector: 'app-program-vertical-list-dialog',
	standalone: true,
	imports: [
		CommonModule,
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
export class ProgramVerticalListDialogComponent implements OnInit {
	protected search: string = '';
	protected filteredEvents: IProgramEvent[] = [];
	protected data: { events: IProgramEvent[] } = inject(MAT_DIALOG_DATA);
	protected onlyFavorite: boolean = false;

	private readonly programService: ProgramService = inject(ProgramService);

	public ngOnInit(): void {
		this.filteredEvents = this.data.events;
		this.onlyFavorite = this.programService.userFilterOptions.onlyFavorite ?? false;
	}

	@debounce()
	protected searchEvents(search: string): void {
		if(!search) {
			this.filteredEvents = this.data.events;
			return;
		}
		search = Utils.replaceCzechAccentSymbols(search.toLowerCase().trim());
		this.filteredEvents = this.data.events.filter((event: IProgramEvent) => Utils.replaceCzechAccentSymbols(event.name.toLowerCase().trim()).includes(search));
	}

	protected toggleFavorite(): void {
		this.onlyFavorite = !this.onlyFavorite;

		if(this.onlyFavorite) {
			this.filteredEvents = this.data.events.filter((event: IProgramEvent) => event.favorite);
		} else {
			this.filteredEvents = this.data.events
		}
	}
}
