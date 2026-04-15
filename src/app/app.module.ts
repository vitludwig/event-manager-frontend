import { NgModule, inject, provideAppInitializer } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BottomMenuComponent} from './modules/layout/components/bottom-menu/bottom-menu.component';
import {HttpClient, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {appInitializerFactory} from './app-initializer.factory';
import {
    TranslateModule,
    TranslateLoader,
    MissingTranslationHandlerParams,
    MissingTranslationHandler
} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {InitService} from "./common/services/init/init.service";

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
    /**
     * in case of missing translation, use string given in template pipe
     * @param params
     */
    handle(params: MissingTranslationHandlerParams): string {
        return params.key;
    }
}

@NgModule({
    declarations: [
        AppComponent,
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatButtonModule,
        MatSnackBarModule,
        BottomMenuComponent,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            missingTranslationHandler: {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
        }),
    ],
    providers: [
        provideAppInitializer(() => {
        const initializerFn = (appInitializerFactory)(inject(InitService));
        return initializerFn();
      }),
        provideHttpClient(withInterceptorsFromDi()),
    ]
})
export class AppModule {
}
