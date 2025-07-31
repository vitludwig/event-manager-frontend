import {Component, inject, OnInit} from '@angular/core';
import {CommonModule, Location, NgOptimizedImage} from '@angular/common';
import {MatDialogModule} from '@angular/material/dialog';
import {IProgramPlace} from '../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {ProgramService} from '../../services/program/program.service';
import {firstValueFrom,} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {IEvent} from '../../types/IEvent';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateEventPropertyPipe} from '../../pipes/translate-event-property/translate-event-property.pipe';
import {EventTagsComponent} from "../event-tags/event-tags.component";

@Component({
	selector: 'app-event-detail-full',
	standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        NgOptimizedImage,
        TranslateModule,
        TranslateEventPropertyPipe,
        EventTagsComponent,
    ],
	templateUrl: './event-detail-full.component.html',
	styleUrls: ['./event-detail-full.component.scss']
})
export class EventDetailFullComponent implements OnInit {
	protected readonly programService: ProgramService = inject(ProgramService);
	private readonly route: ActivatedRoute = inject(ActivatedRoute);
	private readonly location: Location = inject(Location);
	protected readonly translate: TranslateService = inject(TranslateService);

	protected place: IProgramPlace | undefined;
	protected event: IEvent | undefined;
	protected loading: boolean = false;

	public async ngOnInit(): Promise<void> {
		try {
			this.loading = true;
			await this.loadData();
		} catch (e) {
			console.error(e);
		} finally {
			this.loading = false;
		}
	}

	protected toggleFavorite(): void {
		if(this.event) {
			this.event.favorite = !this.event.favorite;
			this.programService.updateEvent(this.event, 'favorite', this.event.favorite);
		}
	}

	protected navigateBack(): void {
		this.location.back();
	}

	private async loadData(): Promise<void> {
		const eventId = this.route.snapshot.paramMap.get('id');
		if(eventId) {
			this.event = await firstValueFrom(this.programService.getEventById(eventId));

			if(this.event) {
				this.place = await firstValueFrom(this.programService.getPlaceById(this.event.placeId));
			}
		}
	}
}
