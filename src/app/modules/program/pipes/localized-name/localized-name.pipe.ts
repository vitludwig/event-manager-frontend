import {inject, Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ILocalizedName, localizedName} from './localized-name';

@Pipe({
	name: 'localizedName',
	standalone: true,
})
export class LocalizedNamePipe implements PipeTransform {
	readonly #translate: TranslateService = inject(TranslateService);

	public transform(obj: ILocalizedName | null | undefined): string {
		if (!obj) {
			return '';
		}
		return localizedName(obj, this.#translate.currentLang);
	}
}
