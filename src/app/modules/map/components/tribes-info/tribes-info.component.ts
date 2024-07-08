import { Component } from '@angular/core';
import {MatList, MatListItem} from '@angular/material/list';
import {TranslateModule} from '@ngx-translate/core';
import {
	MatAccordion, MatExpansionModule,
} from '@angular/material/expansion';

@Component({
  selector: 'app-tribes-info',
  standalone: true,
	imports: [
		MatList,
		MatListItem,
		TranslateModule,
		MatAccordion,
		MatExpansionModule
	],
  templateUrl: './tribes-info.component.html',
  styleUrl: './tribes-info.component.scss'
})
export class TribesInfoComponent {

}
