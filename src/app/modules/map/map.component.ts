import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TribesInfoComponent} from './components/tribes-info/tribes-info.component';
import {CompetitionsInfoComponent} from './components/competitions-info/competitions-info.component';
import {PinchZoomComponent} from "@meddv/ngx-pinch-zoom";
import {CustomizationService, IMapImage} from "../../common/services/customization/customization.service";

@Component({
    selector: 'app-map',
    imports: [MatTabsModule, MatIconModule, MatProgressSpinnerModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent, PinchZoomComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
    private readonly customizationService = inject(CustomizationService);
    private readonly translate = inject(TranslateService);
    private readonly cdr = inject(ChangeDetectorRef);

    // Map images are loaded from the network; flag a failed load so we can show
    // an offline placeholder instead of a broken/blank image.
    protected readonly festivalMapError = signal(false);
    protected readonly competitionMapError = signal(false);
    protected readonly tribesMapError = signal(false);

    constructor() {
        // Tab titles are dynamic data (not via the translate pipe), so refresh on language change under OnPush.
        this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
    }

    protected get festivalMap(): string | undefined {
        return this.mapValue(this.getMap('map1'));
    }

    protected get festivalMapLabel(): string {
        return this.mapLabel(this.getMap('map1'));
    }

    protected get competitionMap(): string | undefined {
        return this.mapValue(this.getMap('map2'));
    }

    protected get competitionMapLabel(): string {
        return this.mapLabel(this.getMap('map2'));
    }

    protected get tribesMap(): string | undefined {
        return this.mapValue(this.getMap('map3'));
    }

    protected get tribesMapLabel(): string {
        return this.mapLabel(this.getMap('map3'));
    }

    // Treat an empty info array as "no info" so we don't render an empty tab
    // when there's neither a map nor any "more info" content.
    protected get competitionsInfo() {
        const info = this.customizationService.competitionsInfo;
        return info && info.length > 0 ? info : undefined;
    }

    protected get tribesInfo() {
        const info = this.customizationService.tribesInfo;
        return info && info.length > 0 ? info : undefined;
    }

    private getMap(name: string): IMapImage | undefined {
        return this.customizationService.maps.find(m => m.name === name);
    }

    private mapValue(map: IMapImage | undefined): string | undefined {
        if (!map) {
            return undefined;
        }
        return this.translate.currentLang === 'en' && map.valueEn ? map.valueEn : map.value;
    }

    private mapLabel(map: IMapImage | undefined): string {
        const cs = this.translate.currentLang === 'cs';
        return (cs ? map?.labelCs : map?.labelEn)
            || (cs ? map?.labelEn : map?.labelCs)
            || this.translate.instant('Mapa');
    }
}
