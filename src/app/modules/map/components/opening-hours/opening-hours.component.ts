import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-opening-hours',
	standalone: true,
	imports: [CommonModule, MatListModule, TranslateModule],
	templateUrl: './opening-hours.component.html',
	styleUrls: ['./opening-hours.component.scss']
})
export class OpeningHoursComponent {

	protected readonly translate: TranslateService = inject(TranslateService);
}
