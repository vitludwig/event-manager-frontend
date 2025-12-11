import {inject, Injectable} from '@angular/core';
import {ProgramService} from "../../../modules/program/services/program/program.service";
import {ThemeService} from "../theme/theme.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    private programService = inject(ProgramService);
    private themeService = inject(ThemeService);

    public async init(): Promise<void> {
        await this.themeService.loadThemeBundle();
        await this.programService.loadCachedData()
    }
}
