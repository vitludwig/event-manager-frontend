import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TranslateModule} from '@ngx-translate/core';
import {TribesInfoComponent} from './components/tribes-info/tribes-info.component';
import {CompetitionsInfoComponent} from './components/competitions-info/competitions-info.component';
import {PinchZoomComponent} from "@meddv/ngx-pinch-zoom";
import {CustomizationService} from "../../common/services/customization/customization.service";

@Component({
    selector: 'app-map',
    imports: [MatTabsModule, MatProgressSpinnerModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent, PinchZoomComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
    private readonly customizationService = inject(CustomizationService);

    protected get festivalMap(): string | undefined {
        return this.getMapContent('map1');
    }

    protected get competitionMap(): string | undefined {
        return this.getMapContent('map2');
    }

    protected get tribesMap(): string | undefined {
        return this.getMapContent('map3');
    }

    protected get competitionsInfo() {
        return this.customizationService.competitionsInfo;
    }

    protected get tribesInfo() {
        return this.customizationService.tribesInfo;
    }

    private getMapContent(name: string): string | undefined {
        const map = this.customizationService.maps.find(m => m.name === name);
        return map?.value;
    }
}
