import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProgramEvent, IProgramPlace} from '../../../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet} from '@angular/material/bottom-sheet';
import {ProgramService} from '../../../../services/program/program.service';
import {FullProgramConfig} from '../../FullProgramConfig';
import {TranslateEventPropertyPipe} from '../../../../pipes/translate-event-property/translate-event-property.pipe';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {EllipsisPipe} from '../../../../../../common/pipes/ellipsis/ellipsis.pipe';
import {MatDivider} from '@angular/material/divider';
import {EventTagsComponent} from "../../../event-tags/event-tags.component";
import {EventDetailFullComponent} from "../../../event-detail-full/event-detail-full.component";
import {LocalizedNamePipe} from '../../../../pipes/localized-name/localized-name.pipe';

@Component({
    selector: 'app-event-detail-preview',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        TranslateEventPropertyPipe,
        TranslateModule,
        EllipsisPipe,
        MatDivider,
        EventTagsComponent,
        LocalizedNamePipe,
    ],
    templateUrl: './event-detail-preview.component.html',
    styleUrls: ['./event-detail-preview.component.scss']
})
export class EventDetailPreviewComponent {
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly bottomSheet: MatBottomSheet = inject(MatBottomSheet);
	protected readonly data: { event: IProgramEvent; place: IProgramPlace } = inject(MAT_BOTTOM_SHEET_DATA);
	protected readonly translate: TranslateService = inject(TranslateService);
	private readonly dialog: MatDialog = inject(MatDialog);

	protected toggleFavorite(): void {
		this.data.event.favorite = !this.data.event.favorite;
		this.programService.updateEvent(this.data.event, 'favorite', this.data.event.favorite);
		this.bottomSheet.dismiss();
	}

	protected openFullDetail(): void {
		this.dialog.open(EventDetailFullComponent, {
			data: {
				event: this.data.event,
				place: this.data.place,
			},
			panelClass: 'full-overlay',
		});
		this.bottomSheet.dismiss();
	}

	protected readonly FullProgramConfig = FullProgramConfig;
}
