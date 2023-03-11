import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalProgramComponent } from './personal-program.component';

describe('PersonalProgramComponent', () => {
  let component: PersonalProgramComponent;
  let fixture: ComponentFixture<PersonalProgramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PersonalProgramComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
