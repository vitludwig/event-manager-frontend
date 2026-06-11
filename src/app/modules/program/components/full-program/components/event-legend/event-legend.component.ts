import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {ProgramService} from '../../../../services/program/program.service';
import {IEventType} from '../../../../types/IEventType';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-event-legend',
	imports: [],
	templateUrl: './event-legend.component.html',
	styleUrls: ['./event-legend.component.scss'],
	// OnPush: the template reads programService.eventTypes() (a signal) via this getter,
	// so the view is re-checked whenever event types load — including after a websocket
	// reconnect — and the getter no longer sorts on every change-detection cycle.
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLegendComponent {
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly translate: TranslateService = inject(TranslateService);

	protected get eventTypes(): IEventType[] {
		return [...this.programService.eventTypes()]
			.sort((a, b) => a.name.localeCompare(b.name, this.translate.currentLang));
	}
}
