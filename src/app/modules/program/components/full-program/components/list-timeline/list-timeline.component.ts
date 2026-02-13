import {AfterViewInit, Component, DestroyRef, ElementRef, inject, input, ViewChild} from '@angular/core';

import {FullProgramConfig} from '../../FullProgramConfig';
import {IProgramSegment} from '../../types/IProgramSegment';
import dayjs from 'dayjs';

@Component({
    selector: 'app-list-timeline',
    imports: [],
    templateUrl: './list-timeline.component.html',
    styleUrls: ['./list-timeline.component.scss']
})
export class ListTimelineComponent implements AfterViewInit {
	readonly segments = input.required<IProgramSegment[]>();
	readonly parentContainer = input.required<HTMLElement>();

	@ViewChild('segmentNow')
	public segmentNow: ElementRef;

	protected segmentNowLeft: number;
	protected timeNow: string;

	protected readonly FullProgramConfig = FullProgramConfig;

	constructor() {
		const destroyRef = inject(DestroyRef);

		this.setRoundedNow();

		const intervalId = setInterval(() => {
			this.setRoundedNow();
			if(this.segmentNow) {
				this.segmentNowLeft = this.segmentNow.nativeElement.getBoundingClientRect().left;
			}
		}, 300000);

		destroyRef.onDestroy(() => clearInterval(intervalId));
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

		this.parentContainer().scrollTo({
			left: this.segmentNowLeft - 200,
		})
	}

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
