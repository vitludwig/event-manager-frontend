import {Component, Inject} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {IProgramEvent} from '../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';

@Component({
	selector: 'app-event-detail-full',
	standalone: true,
	imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, NgOptimizedImage],
	templateUrl: './event-detail-full.component.html',
	styleUrls: ['./event-detail-full.component.scss']
})
export class EventDetailFullComponent {

	constructor(@Inject(MAT_DIALOG_DATA) public data: { event: IProgramEvent }) {
	}
}
