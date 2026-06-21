import {AfterViewInit, Component, DestroyRef, ElementRef, inject, input, ViewChild} from '@angular/core';

import {FullProgramConfig} from '../../FullProgramConfig';
import {IProgramSegment} from '../../types/IProgramSegment';
import {roundToQuarterHour} from '../../utils/round-to-quarter-hour';
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

	protected timeNow: string;

	protected readonly FullProgramConfig = FullProgramConfig;

	constructor() {
		const destroyRef = inject(DestroyRef);

		this.setRoundedNow();

		const intervalId = setInterval(() => {
			this.setRoundedNow();
		}, 300000);

		destroyRef.onDestroy(() => clearInterval(intervalId));
	}

	public ngAfterViewInit(): void {
		this.scrollToNowSegment();
	}

	public scrollToNowSegment(): void {
		if(!this.segmentNow) {
			return;
		}

		// Measure live: the now-segment's position depends on the selected day, the
		// zoom level and the current scroll offset, so a cached value goes stale as
		// soon as any of those change. getBoundingClientRect() is viewport-relative,
		// so translate it into the container's scroll coordinate space.
		const container = this.parentContainer();
		const segmentLeft = this.segmentNow.nativeElement.getBoundingClientRect().left;
		const containerLeft = container.getBoundingClientRect().left;

		container.scrollTo({
			left: container.scrollLeft + (segmentLeft - containerLeft) - 200,
		});
	}

	private setRoundedNow() {
		this.timeNow = roundToQuarterHour(dayjs());
	}
}
