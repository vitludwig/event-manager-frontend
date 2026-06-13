import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {TribesInfoComponent} from './tribes-info.component';
import {ComponentRef} from '@angular/core';

describe('TribesInfoComponent', () => {
	let component: TribesInfoComponent;
	let componentRef: ComponentRef<TribesInfoComponent>;
	let fixture: ComponentFixture<TribesInfoComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TribesInfoComponent, TranslateModule.forRoot()]
		});
		fixture = TestBed.createComponent(TribesInfoComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('data', []);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
