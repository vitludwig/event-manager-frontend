import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {ProgramService} from '../../../../services/program/program.service';
import {IEventType} from '../../../../types/IEventType';
import {TranslateService} from '@ngx-translate/core';
import {LocalizedNamePipe} from '../../../../pipes/localized-name/localized-name.pipe';
import {localizedName} from '../../../../pipes/localized-name/localized-name';

@Component({
	selector: 'app-event-legend',
	imports: [LocalizedNamePipe],
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
		const lang = this.translate.currentLang;
		return [...this.programService.eventTypes()]
			.sort((a, b) => localizedName(a, lang).localeCompare(localizedName(b, lang), lang));
	}
}
