import {inject, Pipe, PipeTransform} from '@angular/core';
import {IEvent} from '../../types/IEvent';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
	name: 'translateEventProperty',
	standalone: true,
})
export class TranslateEventPropertyPipe implements PipeTransform {
	#translate: TranslateService = inject(TranslateService);

	/**
	 * Maps property base name to the correct language-suffixed field.
	 * 'name' → nameCs / nameEn
	 * 'description' → descriptionCs / descriptionEn
	 */
	public transform(event: IEvent, propertyName: 'name' | 'description'): string {
		const accessEvent = event as unknown as Record<string, string>;
		const csSuffix = propertyName + 'Cs';
		const enSuffix = propertyName + 'En';

		if (this.#translate.currentLang === 'en' && accessEvent[enSuffix]) {
			return accessEvent[enSuffix];
		}

		return accessEvent[csSuffix] ?? '';
	}
}
