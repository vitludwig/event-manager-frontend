import {Component, inject} from '@angular/core';
import {MatList, MatListItem, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {
	MatAccordion, MatExpansionModule,
} from '@angular/material/expansion';
import {HttpClient} from "@angular/common/http";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-tribes-info',
  standalone: true,
	imports: [
		MatList,
		MatListItem,
		TranslateModule,
		MatAccordion,
		MatExpansionModule,
		AsyncPipe,
		MatListItemLine,
		MatListItemTitle
	],
  templateUrl: './tribes-info.component.html',
  styleUrl: './tribes-info.component.scss'
})
export class TribesInfoComponent {
	protected readonly translate: TranslateService = inject(TranslateService);
	private readonly http: HttpClient = inject(HttpClient);

	protected tribesInfo$;

	constructor() {
		this.tribesInfo$ = this.http.get<any[]>('/assets/tribe-info.json');
	}
}
