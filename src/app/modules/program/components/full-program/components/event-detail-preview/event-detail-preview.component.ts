import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TruncatePipe} from '../../../../../../common/pipes/truncate/truncate.pipe';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet} from '@angular/material/bottom-sheet';
import {ProgramService} from '../../../../services/program/program.service';
import {Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {FullProgramConfig} from '../../FullProgramConfig';
import {TranslateEventPropertyPipe} from '../../../../pipes/translate-event-property/translate-event-property.pipe';
import {TranslateModule} from '@ngx-translate/core';
import {EllipsisPipe} from '../../../../../../common/pipes/ellipsis/ellipsis.pipe';
import {MatDivider} from '@angular/material/divider';

@Component({
	selector: 'app-event-detail-preview',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		TruncatePipe,
		MatDialogModule,
		TranslateEventPropertyPipe,
		TranslateModule,
		EllipsisPipe,
		MatDivider
	],
	templateUrl: './event-detail-preview.component.html',
	styleUrls: ['./event-detail-preview.component.scss']
})
export class EventDetailPreviewComponent {
	protected readonly fullProgramConfig = FullProgramConfig;

	private readonly programService: ProgramService = inject(ProgramService);
	private readonly bottomSheet: MatBottomSheet = inject(MatBottomSheet);
	private readonly router: Router = inject(Router);
	protected readonly data: { event: IProgramEvent } = inject(MAT_BOTTOM_SHEET_DATA);

	protected toggleFavorite(): void {
		this.data.event.favorite = !this.data.event.favorite;
		this.programService.updateEvent(this.data.event, 'favorite', this.data.event.favorite);
		this.bottomSheet.dismiss();
	}

	protected openFullDetail(): void {
		this.router.navigate(['/' + ERoute.EVENT_DETAIL, this.data.event.id]);
		this.bottomSheet.dismiss();
	}

	protected readonly FullProgramConfig = FullProgramConfig;
}
