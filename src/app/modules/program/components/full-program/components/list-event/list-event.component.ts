import {Component, EventEmitter, inject, Input, Output} from '@angular/core';

import {MatButtonModule} from '@angular/material/button';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {FullProgramConfig} from '../../FullProgramConfig';
import {MatIconModule} from '@angular/material/icon';
import {TranslateEventPropertyPipe} from '../../../../pipes/translate-event-property/translate-event-property.pipe';
import {ProgramService} from '../../../../services/program/program.service';
import {EventEllipsisPipe} from './pipes/event-ellipsis.pipe';
import {TranslateService} from "@ngx-translate/core";

@Component({
    selector: 'app-list-event',
    imports: [MatButtonModule, MatIconModule, TranslateEventPropertyPipe, EventEllipsisPipe],
    templateUrl: './list-event.component.html',
    styleUrls: ['./list-event.component.scss']
})
export class ListEventComponent {
	@Input()
	public event: IProgramEvent;

	@Output()
	public eventSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly fullProgramConfig = FullProgramConfig;
	protected readonly programService: ProgramService = inject(ProgramService);
	protected readonly translate: TranslateService = inject(TranslateService);

	protected showDetail(event: IProgramEvent): void {
		this.eventSelect.emit(event);
	}
}
