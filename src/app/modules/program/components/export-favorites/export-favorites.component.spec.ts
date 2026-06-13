import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {ExportFavoritesComponent} from './export-favorites.component';
import {ProgramService} from '../../services/program/program.service';
import {PermissionsService} from '../../../../common/services/permissions/permissions.service';

describe('ExportFavoritesComponent', () => {
	let component: ExportFavoritesComponent;

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
		getFavorites: jasmine.createSpy('getFavorites').and.returnValue([]),
		loadFavorites: jasmine.createSpy('loadFavorites'),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ExportFavoritesComponent, NoopAnimationsModule, TranslateModule.forRoot()],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: MatDialogRef, useValue: {close: jasmine.createSpy('close')}},
				{provide: PermissionsService, useValue: {requestCameraPermissions: jasmine.createSpy().and.resolveTo(false)}},
			],
		});
		const fixture = TestBed.createComponent(ExportFavoritesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
