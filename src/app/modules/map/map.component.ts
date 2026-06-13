import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TribesInfoComponent} from './components/tribes-info/tribes-info.component';
import {CompetitionsInfoComponent} from './components/competitions-info/competitions-info.component';
import {PinchZoomComponent} from "@meddv/ngx-pinch-zoom";
import {CustomizationService, IMapImage} from "../../common/services/customization/customization.service";

@Component({
    selector: 'app-map',
    imports: [MatTabsModule, MatProgressSpinnerModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent, PinchZoomComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
    private readonly customizationService = inject(CustomizationService);
    private readonly translate = inject(TranslateService);
    private readonly cdr = inject(ChangeDetectorRef);

    constructor() {
        // Tab titles are dynamic data (not via the translate pipe), so refresh on language change under OnPush.
        this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
    }

    protected get festivalMap(): string | undefined {
        return this.getMap('map1')?.value;
    }

    protected get festivalMapLabel(): string {
        return this.mapLabel(this.getMap('map1'));
    }

    protected get competitionMap(): string | undefined {
        return this.getMap('map2')?.value;
    }

    protected get competitionMapLabel(): string {
        return this.mapLabel(this.getMap('map2'));
    }

    protected get tribesMap(): string | undefined {
        return this.getMap('map3')?.value;
    }

    protected get tribesMapLabel(): string {
        return this.mapLabel(this.getMap('map3'));
    }

    protected get competitionsInfo() {
        return this.customizationService.competitionsInfo;
    }

    protected get tribesInfo() {
        return this.customizationService.tribesInfo;
    }

    private getMap(name: string): IMapImage | undefined {
        return this.customizationService.maps.find(m => m.name === name);
    }

    private mapLabel(map: IMapImage | undefined): string {
        const cs = this.translate.currentLang === 'cs';
        return (cs ? map?.labelCs : map?.labelEn)
            || (cs ? map?.labelEn : map?.labelCs)
            || this.translate.instant('Mapa');
    }
}
