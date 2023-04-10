import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramVerticalListComponent } from './program-vertical-list.component';

describe('ProgramVerticalListComponent', () => {
  let component: ProgramVerticalListComponent;
  let fixture: ComponentFixture<ProgramVerticalListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ProgramVerticalListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramVerticalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
