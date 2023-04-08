import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
	name: 'truncate',
	standalone: true
})
export class TruncatePipe implements PipeTransform {

	transform(value: string, length: number = 20): string {
		return value.substring(0, length) + '…';
	}

}
