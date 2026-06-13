import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {IEvent} from '../../../../types/IEvent';
import {EventSearchListComponent} from '../event-search-list/event-search-list.component';

@Component({
	selector: 'app-program-vertical-list-dialog',
	imports: [MatDialogModule, EventSearchListComponent],
	templateUrl: './program-vertical-list-dialog.component.html',
	styleUrls: ['./program-vertical-list-dialog.component.scss'],
})
export class ProgramVerticalListDialogComponent {
	protected readonly data: {events: IEvent[]} = inject(MAT_DIALOG_DATA);
	private readonly dialogRef = inject(MatDialogRef<ProgramVerticalListDialogComponent>);

	protected close(): void {
		this.dialogRef.close();
	}
}
