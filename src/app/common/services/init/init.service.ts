import {inject, Injectable} from '@angular/core';
import {ProgramService} from "../../../modules/program/services/program/program.service";
import {ThemeService} from "../theme/theme.service";
import {CustomizationService} from "../customization/customization.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    private programService = inject(ProgramService);
    private themeService = inject(ThemeService);
    private customizationService = inject(CustomizationService);

    public async init(): Promise<void> {
        // Register before load() so even a cold start (which awaits the network) can purge program
        // data cached under a previous festival the moment a switch is detected.
        this.customizationService.onFestivalChange(() => this.programService.resetForNewFestival());
        await this.customizationService.load();
        await this.themeService.loadThemeBundle();
        await this.programService.loadCachedData();
    }
}
