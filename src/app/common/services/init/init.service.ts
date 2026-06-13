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
        await this.customizationService.load();
        await this.themeService.loadThemeBundle();
        await this.programService.loadCachedData();
    }
}
