import {Component, Inject, OnInit} from '@angular/core';
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
		ProgramVerticalListComponent
	],
	templateUrl: './program-vertical-list-dialog.component.html',
	styleUrls: ['./program-vertical-list-dialog.component.scss']
})
export class ProgramVerticalListDialogComponent implements OnInit {
	protected search: string = '';
	protected filteredEvents: IProgramEvent[] = [];

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { events: IProgramEvent[] },
	) {

	}

	public ngOnInit(): void {
		this.filteredEvents = this.data.events;
	}


	@debounce()
	protected searchEvents(search: string): void {
		if(!search) {
			this.filteredEvents = this.data.events;
			return;
		}

		this.filteredEvents = this.data.events.filter((event: IProgramEvent) => (event.name).toLowerCase().trim().includes(search.toLowerCase().trim()));
	}
}
