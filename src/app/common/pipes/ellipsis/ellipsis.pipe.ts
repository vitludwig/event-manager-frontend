import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
	name: 'ellipsis',
	standalone: true
})
export class EllipsisPipe implements PipeTransform {

	public transform(value: string, limit: number): string {
		if(limit && value.length > limit) {
			return value.substring(0, limit).concat('…');
		}
		return value;
	}

}
