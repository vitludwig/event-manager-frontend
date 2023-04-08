import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TruncatePipe} from '../../../../../../common/pipes/truncate/truncate.pipe';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {EventDetailFullComponent} from '../../../event-detail-full/event-detail-full.component';

@Component({
	selector: 'app-event-detail-preview',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, TruncatePipe, MatDialogModule],
	templateUrl: './event-detail-preview.component.html',
	styleUrls: ['./event-detail-preview.component.scss']
})
export class EventDetailPreviewComponent {
	@Input()
	public event: IProgramEvent;

	@Output()
	public favoriteChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	constructor(private dialog: MatDialog) {
	}

	protected toggleFavorite(): void {
		this.favoriteChange.emit(!this.event.favorite);
		this.event.favorite = !this.event.favorite;
	}

	protected openFullDetail(): void {
		this.dialog.open(EventDetailFullComponent, {
			data: {
				event: this.event,
			},
			width: '100%',
			height: '100%',
			panelClass: 'event-detail-full-overlay',
			closeOnNavigation: true,
		});
	}
}
