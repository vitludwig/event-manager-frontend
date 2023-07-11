import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {TranslateModule} from '@ngx-translate/core';
import {OpeningHoursComponent} from './components/opening-hours/opening-hours.component';

@Component({
	selector: 'app-map',
	standalone: true,
	imports: [CommonModule, MatTabsModule, NgOptimizedImage, TranslateModule, OpeningHoursComponent],
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.scss']
})
export class MapComponent {

	constructor() {

	}
}
