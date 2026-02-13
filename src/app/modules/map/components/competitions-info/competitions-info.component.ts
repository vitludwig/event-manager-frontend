import {Component, inject, input} from '@angular/core';
import {MatListModule} from '@angular/material/list';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-competitions-info',
    imports: [MatListModule, TranslateModule],
    templateUrl: './competitions-info.component.html',
    styleUrls: ['./competitions-info.component.scss']
})
export class CompetitionsInfoComponent {
	protected readonly translate: TranslateService = inject(TranslateService);

	readonly data = input.required<any[]>();
}
