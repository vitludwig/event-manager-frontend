import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FullProgramConfig} from '../../FullProgramConfig';
import {ListEventComponent} from '../list-event/list-event.component';
import {IProgramEvent, IProgramPlace} from '../../../../types/IProgramPlace';
import {IProgramSegment} from '../../types/IProgramSegment';

@Component({
	selector: 'app-list-place',
	standalone: true,
	imports: [CommonModule, ListEventComponent],
	templateUrl: './list-place.component.html',
	styleUrls: ['./list-place.component.scss']
})
export class ListPlaceComponent {
	@Input()
	public place: IProgramPlace;

	@Input()
	public segments: IProgramSegment[];

	@Input()
	public events: Record<number, IProgramEvent>;

	@Output()
	public placeSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly FullProgramConfig = FullProgramConfig;

	protected showEventDetail(event: IProgramEvent): void {
		this.placeSelect.emit(event);
	}
}
