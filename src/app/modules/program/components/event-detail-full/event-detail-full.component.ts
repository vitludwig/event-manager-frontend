import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {ProgramService} from '../../services/program/program.service';
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
        TranslateModule,
        TranslateEventPropertyPipe,
        EventTagsComponent,
    ],
	templateUrl: './event-detail-full.component.html',
	styleUrls: ['./event-detail-full.component.scss']
})
export class EventDetailFullComponent implements OnInit {
	protected readonly programService: ProgramService = inject(ProgramService);
	protected readonly translate: TranslateService = inject(TranslateService);
	protected data: { event: IProgramEvent; place: IProgramPlace } = inject(MAT_DIALOG_DATA);

	protected place: IProgramPlace | undefined;
	protected event: IEvent | undefined;
	protected loading: boolean = false;

	public async ngOnInit(): Promise<void> {
		try {
			this.loading = true;
			this.event = this.data.event;
			this.place = this.data.place;
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

}
