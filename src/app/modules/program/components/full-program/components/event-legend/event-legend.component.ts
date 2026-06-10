import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {ProgramService} from '../../../../services/program/program.service';
import {IEventType} from '../../../../types/IEventType';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-event-legend',
	imports: [],
	templateUrl: './event-legend.component.html',
	styleUrls: ['./event-legend.component.scss'],
	// Default CD (not OnPush): programService.eventTypes is a plain array filled by an
	// HTTP request that emits no signal afterwards. An OnPush component without inputs
	// would render empty and never refresh. The component is trivial, so default CD is cheap.
	changeDetection: ChangeDetectionStrategy.Default,
})
export class EventLegendComponent {
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly translate: TranslateService = inject(TranslateService);

	protected get eventTypes(): IEventType[] {
		return [...this.programService.eventTypes]
			.sort((a, b) => a.name.localeCompare(b.name, this.translate.currentLang));
	}
}
