import {Component, EventEmitter, Inject, Input, Output} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TruncatePipe} from '../../../../../../common/pipes/truncate/truncate.pipe';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {EventDetailFullComponent} from '../../../event-detail-full/event-detail-full.component';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet} from '@angular/material/bottom-sheet';
import {ProgramService} from '../../../../services/program/program.service';

@Component({
	selector: 'app-event-detail-preview',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, TruncatePipe, MatDialogModule],
	templateUrl: './event-detail-preview.component.html',
	styleUrls: ['./event-detail-preview.component.scss']
})
export class EventDetailPreviewComponent {

	constructor(
		private programService: ProgramService,
		private dialog: MatDialog,
		private bottomSheet: MatBottomSheet,
		@Inject(MAT_BOTTOM_SHEET_DATA) public data: {event: IProgramEvent},
	) {
	}

	protected toggleFavorite(): void {
		this.data.event.favorite = !this.data.event.favorite;
		this.programService.updateEvent(this.data.event, 'favorite', this.data.event.favorite);
		this.bottomSheet.dismiss();
	}

	protected openFullDetail(): void {
		this.dialog.open(EventDetailFullComponent, {
			data: {
				event: this.data.event,
			},
			width: '100%',
			height: '100%',
			panelClass: 'full-overlay',
			closeOnNavigation: true,
		});
		this.bottomSheet.dismiss();
	}
}
