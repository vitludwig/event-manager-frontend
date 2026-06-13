import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {ProgramVerticalListDialogComponent} from './program-vertical-list-dialog.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('ProgramVerticalListDialogComponent', () => {
	let component: ProgramVerticalListDialogComponent;
	const closeSpy = jasmine.createSpy('close');

	beforeEach(() => {
		closeSpy.calls.reset();

		TestBed.configureTestingModule({
			imports: [
				ProgramVerticalListDialogComponent,
				NoopAnimationsModule,
				TranslateModule.forRoot(),
				MatDialogModule,
			],
			providers: [
				{provide: MAT_DIALOG_DATA, useValue: {events: []}},
				{provide: MatDialogRef, useValue: {close: closeSpy}},
				{provide: ProgramService, useValue: {places: signal([]), days: signal({})}},
			],
		});

		const fixture = TestBed.createComponent(ProgramVerticalListDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('close() closes the dialog', () => {
		(component as any).close();
		expect(closeSpy).toHaveBeenCalled();
	});
});
