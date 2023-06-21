import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
	name: 'stringToJson',
	standalone: true
})
export class StringToJsonPipe implements PipeTransform {

	public transform(value: string | undefined): Record<string, string | number> {
		try {
			return value ? JSON.parse(value) : {};
		} catch(e) {
			return {};
		}
	}

}
