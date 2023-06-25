import {inject, Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {IEvent} from '../../../program/types/IEvent';

@Pipe({
	name: 'translateNotificationProperties',
	standalone: true
})
export class TranslateNotificationPropertiesPipe implements PipeTransform {
	#translate = inject(TranslateService);

	public transform(value: string | undefined): {name: string, value: string | number}[] {
		const result: {name: string, value: string | number}[] = [];

		try {
			const parsedProperties = value ? JSON.parse(value) : {} as Partial<IEvent>;
			if(this.#translate.currentLang === 'en') {
				if(parsedProperties.name_EN) {
					parsedProperties.name = parsedProperties.name_EN
				}

				if(parsedProperties.description_EN) {
					parsedProperties.description = parsedProperties.description_EN;
				}
			}
			// only these properties have dual language
			// TODO: do this dynamically in cycle, so when dual language property is added, it will be modified automatically
			delete parsedProperties.name_EN;
			delete parsedProperties.description_EN;

			for(const key in parsedProperties) {
				result.push({
					name: key,
					value: parsedProperties[key],
				})
			}
		} catch(e) {
			return [];
		}
		console.log('result', result);
		return result
	}

}
