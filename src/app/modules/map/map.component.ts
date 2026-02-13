import {Component, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs';
import {MatTabsModule} from '@angular/material/tabs';
import {TranslateModule} from '@ngx-translate/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {TribesInfoComponent} from './components/tribes-info/tribes-info.component';
import {CompetitionsInfoComponent} from './components/competitions-info/competitions-info.component';
import {environment} from "../../../environments/environment";
import {IMapImage, MapService} from "./services/map.service";

@Component({
    selector: 'app-map',
    imports: [MatTabsModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent {
    protected readonly environment = environment;
    private readonly mapService = inject(MapService);
    private readonly http = inject(HttpClient);

    protected readonly mapsResource = rxResource({
        stream: () => this.mapService.getMaps().pipe(
            map(maps => ({
                festivalMap: this.getMapContent(maps, 'map1'),
                competitionMap: this.getMapContent(maps, 'map2'),
                tribesMap: this.getMapContent(maps, 'map3'),
            }))
        ),
    });

    protected readonly competitionsInfo = rxResource({
        stream: () => this.http.get<any[]>(`${environment.signalrUrl}/public/competitions-info.json`),
    });

    protected readonly tribesInfo = rxResource({
        stream: () => this.http.get<any[]>(`${environment.signalrUrl}/public/tribe-info.json`),
    });

    private getMapContent(maps: IMapImage[], name: string): string | undefined {
        const map = maps.find(m => m.name === name);
        return map ? `${map.value}` : undefined;
    }
}
