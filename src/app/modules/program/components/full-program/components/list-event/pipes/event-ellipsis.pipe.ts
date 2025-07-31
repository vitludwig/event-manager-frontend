import {Pipe, PipeTransform} from '@angular/core';
import {IProgramEvent} from '../../../../../types/IProgramPlace';
import * as dayjs from 'dayjs';

@Pipe({
	name: 'eventEllipsis',
	standalone: true
})
export class EventEllipsisPipe implements PipeTransform {

	public transform(name: string, event: IProgramEvent): string {
		let result = name;
		const diff = dayjs(event.end).diff(dayjs(event.start), 'minutes');

		if(diff <= 60 && name.length > 15) {
			result = name.substring(0, 15).trim() + '…';
		}

		if(diff <= 30 && name.length > 5) {
			result = name.substring(0, 5).trim() + '…';
		}

		return result;
	}

}
