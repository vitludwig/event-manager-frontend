import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {ProgramService} from '../../services/program/program.service';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateEventPropertyPipe} from '../../pipes/translate-event-property/translate-event-property.pipe';
import {EventTagsComponent} from "../event-tags/event-tags.component";
import {LocalizedNamePipe} from '../../pipes/localized-name/localized-name.pipe';

@Component({
    selector: 'app-event-detail-full',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        TranslateModule,
        TranslateEventPropertyPipe,
        EventTagsComponent,
        LocalizedNamePipe,
    ],
    templateUrl: './event-detail-full.component.html',
    styleUrls: ['./event-detail-full.component.scss']
})
export class EventDetailFullComponent {
	protected readonly programService: ProgramService = inject(ProgramService);
	protected readonly translate: TranslateService = inject(TranslateService);
	protected readonly data: { event: IProgramEvent; place: IProgramPlace } = inject(MAT_DIALOG_DATA);

	protected get event(): IProgramEvent { return this.data.event; }
	protected get place(): IProgramPlace { return this.data.place; }

	protected toggleFavorite(): void {
		this.event.favorite = !this.event.favorite;
		this.programService.updateEvent(this.event, 'favorite', this.event.favorite);
	}
}
