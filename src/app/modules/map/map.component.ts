import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {TranslateModule} from '@ngx-translate/core';
import {TribesInfoComponent} from './components/tribes-info/tribes-info.component';
import {CompetitionsInfoComponent} from './components/competitions-info/competitions-info.component';
import {environment} from "../../../environments/environment";
import {EFestivalID} from "../../common/types/EFestivalID";

@Component({
	selector: 'app-map',
	standalone: true,
	imports: [CommonModule, MatTabsModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent],
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.scss']
})
export class MapComponent {
    protected readonly environment = environment;
	protected readonly EFestivalID = EFestivalID;
}
