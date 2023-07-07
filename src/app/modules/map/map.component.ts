import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {TranslateModule} from '@ngx-translate/core';

@Component({
	selector: 'app-map',
	standalone: true,
	imports: [CommonModule, MatTabsModule, NgOptimizedImage, TranslateModule],
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.scss']
})
export class MapComponent {

	constructor() {

	}
}
