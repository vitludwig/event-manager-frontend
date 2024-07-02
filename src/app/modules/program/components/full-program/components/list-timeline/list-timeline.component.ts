import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FullProgramConfig} from '../../FullProgramConfig';
import {IProgramSegment} from '../../types/IProgramSegment';
import * as dayjs from 'dayjs';

@Component({
	selector: 'app-list-timeline',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './list-timeline.component.html',
	styleUrls: ['./list-timeline.component.scss']
})
export class ListTimelineComponent implements AfterViewInit {
	@Input()
	public segments: IProgramSegment[];

	@Input()
	public parentContainer: HTMLElement;

	@ViewChild('segmentNow')
	public segmentNow: ElementRef;

	protected segmentNowLeft: number;
	protected timeNow: string;

	protected readonly FullProgramConfig = FullProgramConfig;

	constructor() {
		setInterval(() => {
			this.setRoundedNow();
			if(this.segmentNow) {
				this.segmentNowLeft = this.segmentNow.nativeElement.getBoundingClientRect().left;
			}
		}, 300000);

		this.setRoundedNow();
	}

	public ngAfterViewInit(): void {
		if(this.segmentNow) {
			this.segmentNowLeft = this.segmentNow.nativeElement.getBoundingClientRect().left;
			this.scrollToNowSegment();
		}
	}

	public scrollToNowSegment(): void {
		if(!this.segmentNow) {
			return;
		}
		console.log(this.parentContainer.scrollLeft);
		this.parentContainer.scrollTo({
			left: this.segmentNowLeft - 200,
		})
	}

	/**
	 * Round current time to nearest 15 minutes
	 * @private
	 */
	private setRoundedNow() {
		const hours = dayjs().hour();
		const minutes = (Math.round(dayjs().minute() / 15) * 15) % 60;
		const hour =  ((((minutes/105) + .5) | 0) + hours) % 24;

		this.timeNow = dayjs()
			.set('hour', hour)
			.set('minutes', minutes)
			.format('HH:mm');
	}
}
