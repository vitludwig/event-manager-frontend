import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FullProgramConfig} from '../../FullProgramConfig';
import {IProgramSegment} from '../../types/IProgramSegment';

@Component({
	selector: 'app-list-timeline',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './list-timeline.component.html',
	styleUrls: ['./list-timeline.component.scss']
})
export class ListTimelineComponent {
	@Input()
	public segments: IProgramSegment[];

	protected readonly FullProgramConfig = FullProgramConfig;
}
