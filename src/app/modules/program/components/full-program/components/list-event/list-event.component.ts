import {Component, EventEmitter, inject, Input, Output} from '@angular/core';

import {MatButtonModule} from '@angular/material/button';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {IProgramEventLayout} from '../../types/IProgramPlaceLayout';
import {FullProgramConfig} from '../../FullProgramConfig';
import {MatIconModule} from '@angular/material/icon';
import {TranslateEventPropertyPipe} from '../../../../pipes/translate-event-property/translate-event-property.pipe';
import {ProgramService} from '../../../../services/program/program.service';
import {TranslateService} from "@ngx-translate/core";
import {CustomizationService} from '../../../../../../common/services/customization/customization.service';
import {IEventTag} from '../../../../types/IEventTag';
import dayjs from 'dayjs';

@Component({
    selector: 'app-list-event',
    imports: [MatButtonModule, MatIconModule, TranslateEventPropertyPipe],
    templateUrl: './list-event.component.html',
    styleUrls: ['./list-event.component.scss']
})
export class ListEventComponent {
	@Input()
	public event: IProgramEventLayout;

	@Output()
	public eventSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly fullProgramConfig = FullProgramConfig;
	protected readonly programService: ProgramService = inject(ProgramService);
	protected readonly translate: TranslateService = inject(TranslateService);
	private readonly customizationService: CustomizationService = inject(CustomizationService);

	protected get cardWidthPx(): number {
		return FullProgramConfig.segmentWidth * (this.event?.segmentCount ?? 0) - 2;
	}

	protected get visibleTags(): IEventTag[] {
		let limit = this.customizationService.eventCardTagCount ?? 1;

		const durationMinutes = dayjs(this.event?.endAt).diff(dayjs(this.event?.startAt), 'minutes');
		if (durationMinutes < 60) {
			limit = Math.min(limit, 1);
		}

		if (this.cardWidthPx < FullProgramConfig.minTagWidthPx) {
			limit = 0;
		}

		return (this.event?.tags ?? []).slice(0, limit);
	}

	protected showDetail(event: IProgramEvent): void {
		this.eventSelect.emit(event);
	}
}
