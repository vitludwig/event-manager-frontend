import {Component, Inject} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {ProgramService} from '../../services/program/program.service';
import {Observable} from 'rxjs';

@Component({
	selector: 'app-event-detail-full',
	standalone: true,
	imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, NgOptimizedImage],
	templateUrl: './event-detail-full.component.html',
	styleUrls: ['./event-detail-full.component.scss']
})
export class EventDetailFullComponent {
	protected place$: Observable<IProgramPlace | undefined>;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { event: IProgramEvent },
		protected programService: ProgramService,
	) {
		this.place$ = this.programService.getPlaceById(this.data.event.placeId);
	}

	protected toggleFavorite(): void {
		this.data.event.favorite = !this.data.event.favorite;
		this.programService.updateEvent(this.data.event, 'favorite', this.data.event.favorite);
	}
}
