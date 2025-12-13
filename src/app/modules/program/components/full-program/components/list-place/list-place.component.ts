import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FullProgramConfig} from '../../FullProgramConfig';
import {ListEventComponent} from '../list-event/list-event.component';
import {IProgramEvent, IProgramPlace} from '../../../../types/IProgramPlace';
import {IProgramSegment} from '../../types/IProgramSegment';

@Component({
    selector: 'app-list-place',
    imports: [ListEventComponent],
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
