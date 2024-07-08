import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TribesInfoComponent } from './tribes-info.component';

describe('TribesInfoComponent', () => {
  let component: TribesInfoComponent;
  let fixture: ComponentFixture<TribesInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TribesInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TribesInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
