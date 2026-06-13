import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FullProgramConfig} from '../../FullProgramConfig';
import {ListEventComponent} from '../list-event/list-event.component';
import {IProgramEvent, IProgramPlace} from '../../../../types/IProgramPlace';
import {IProgramSegment} from '../../types/IProgramSegment';
import {IProgramPlaceLayout} from '../../types/IProgramPlaceLayout';
import {LocalizedNamePipe} from '../../../../pipes/localized-name/localized-name.pipe';

@Component({
    selector: 'app-list-place',
    imports: [ListEventComponent, LocalizedNamePipe],
    templateUrl: './list-place.component.html',
    styleUrls: ['./list-place.component.scss']
})
export class ListPlaceComponent {
	@Input()
	public place: IProgramPlace;

	@Input()
	public segments: IProgramSegment[];

	@Input()
	public layout: IProgramPlaceLayout;

	@Output()
	public placeSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly FullProgramConfig = FullProgramConfig;

	/** Výška řádku/buňky podle počtu pruhů; pro 1 pruh = 65px (dnešní výška). */
	protected rowHeight(): number {
		return this.layout.laneCount * FullProgramConfig.laneStride - FullProgramConfig.laneGap;
	}

	protected showEventDetail(event: IProgramEvent): void {
		this.placeSelect.emit(event);
	}
}
