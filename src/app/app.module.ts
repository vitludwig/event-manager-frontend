import {NgModule, APP_INITIALIZER} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ServiceWorkerModule} from '@angular/service-worker';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {BottomMenuComponent} from './modules/layout/components/bottom-menu/bottom-menu.component';
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {appInitializerFactory} from './app-initializer.factory';
import {ProgramService} from './modules/program/services/program/program.service';
import {TranslateModule, TranslateLoader, MissingTranslationHandlerParams, MissingTranslationHandler} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

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
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		MatToolbarModule,
		MatSidenavModule,
		MatIconModule,
		MatButtonModule,
		BottomMenuComponent,
		HttpClientModule,
		TranslateModule.forRoot({
			defaultLanguage: 'cs',
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			},
			missingTranslationHandler: {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
		}),
		ServiceWorkerModule.register('ngsw-worker.js', {
			enabled: true,
			// Register the ServiceWorker as soon as the application is stable
			// or after 30 seconds (whichever comes first).
			registrationStrategy: 'registerWhenStable:30000'
		}),
	],
	providers: [
		{provide: APP_INITIALIZER, useFactory: appInitializerFactory, deps: [ProgramService], multi: true},
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
