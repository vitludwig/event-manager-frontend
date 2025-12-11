import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpClient} from "@angular/common/http";

@Component({
	selector: 'app-competitions-info',
	standalone: true,
	imports: [CommonModule, MatListModule, TranslateModule],
	templateUrl: './competitions-info.component.html',
	styleUrls: ['./competitions-info.component.scss']
})
export class CompetitionsInfoComponent {
	protected readonly translate: TranslateService = inject(TranslateService);
	private readonly http: HttpClient = inject(HttpClient);

	protected competitionsInfo$;

	constructor() {
		this.competitionsInfo$ = this.http.get<any[]>('/assets/competitions-info.json');
	}

}
