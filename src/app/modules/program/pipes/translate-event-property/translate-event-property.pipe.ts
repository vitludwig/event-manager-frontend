import {inject, Pipe, PipeTransform} from '@angular/core';
import {IEvent} from '../../types/IEvent';
import {TranslateService} from '@ngx-translate/core';
import {IProgramPlace} from '../../types/IProgramPlace';

@Pipe({
	name: 'translateEventProperty',
	standalone: true,
})
export class TranslateEventPropertyPipe implements PipeTransform {
	#translate: TranslateService = inject(TranslateService);

	/**
	 * Due to property language suffix, we use property name based on chosen language
	 *
	 * @param event
	 * @param propertyName
	 */
	public transform(event: IEvent, propertyName: keyof IEvent): string | number | boolean | IProgramPlace {
		const accessEvent = event as unknown as Record<string, string | number | boolean | IProgramPlace>;

		if(this.#translate.currentLang === 'en' && Object.hasOwn(accessEvent, propertyName + '_EN')) {
			return accessEvent[propertyName + '_EN'];
		}

		return accessEvent[propertyName];
	}

}
