import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramVerticalListDialogComponent } from './program-vertical-list-dialog.component';

describe('ProgramVerticalListDialogComponent', () => {
  let component: ProgramVerticalListDialogComponent;
  let fixture: ComponentFixture<ProgramVerticalListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ProgramVerticalListDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramVerticalListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
