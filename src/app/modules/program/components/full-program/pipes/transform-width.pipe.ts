import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'transformWidth',
	standalone: true
})
export class TransformWidthPipe implements PipeTransform {

	transform(width: number, multiplier: number): string {
		return width * multiplier + 'px';
	}

}
