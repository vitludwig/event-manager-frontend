import { Component, inject, OnInit } from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { TribesInfoComponent } from './components/tribes-info/tribes-info.component';
import { CompetitionsInfoComponent } from './components/competitions-info/competitions-info.component';
import { environment } from "../../../environments/environment";
import { MapService, IMapImage } from "./services/map.service";

@Component({
    selector: 'app-map',
    imports: [MatTabsModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
	protected readonly environment = environment;
	private readonly mapService = inject(MapService);

	protected festivalMap: string | undefined;
	protected competitionMap: string | undefined;
	protected tribesMap: string | undefined;

	ngOnInit() {
        this.mapService.getMaps().subscribe(maps => {
            this.festivalMap = this.getMapContent(maps, 'map1');
            this.competitionMap = this.getMapContent(maps, 'map2');
            this.tribesMap = this.getMapContent(maps, 'map3');
        });
	}

	private getMapContent(maps: IMapImage[], name: string): string | undefined {
		const map = maps.find(m => m.name === name);
		return map ? `data:image/png;base64,${map.content}` : undefined;
	}
}
