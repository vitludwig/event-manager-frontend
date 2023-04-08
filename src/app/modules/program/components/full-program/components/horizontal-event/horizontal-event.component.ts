import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {FullProgramConfig} from '../../FullProgramConfig';
import {TruncatePipe} from '../../../../../../common/pipes/truncate/truncate.pipe';
import {MatIconModule} from '@angular/material/icon';

@Component({
	selector: 'app-horizontal-event',
	standalone: true,
	imports: [CommonModule, MatButtonModule, TruncatePipe, MatIconModule],
	templateUrl: './horizontal-event.component.html',
	styleUrls: ['./horizontal-event.component.scss']
})
export class HorizontalEventComponent {
	@Input()
	public event: IProgramEvent;

	@Output()
	public eventSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly FullProgramConfig = FullProgramConfig;

	protected showDetail(event: IProgramEvent): void {
		this.eventSelect.emit(event);
		console.log('showEventDetail', event);
	}
}
