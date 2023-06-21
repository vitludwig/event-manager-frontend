import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {FullProgramConfig} from '../../FullProgramConfig';
import {TruncatePipe} from '../../../../../../common/pipes/truncate/truncate.pipe';
import {MatIconModule} from '@angular/material/icon';

@Component({
	selector: 'app-list-event',
	standalone: true,
	imports: [CommonModule, MatButtonModule, TruncatePipe, MatIconModule],
	templateUrl: './list-event.component.html',
	styleUrls: ['./list-event.component.scss']
})
export class ListEventComponent {
	@Input()
	public event: IProgramEvent;

	@Output()
	public eventSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly fullProgramConfig = FullProgramConfig;

	protected showDetail(event: IProgramEvent): void {
		this.eventSelect.emit(event);
		console.log('showEventDetail', event);
	}
}
