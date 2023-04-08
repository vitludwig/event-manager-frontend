import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDaySelectComponent } from './list-day-select.component';

describe('ListDaySelectComponent', () => {
  let component: ListDaySelectComponent;
  let fixture: ComponentFixture<ListDaySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ListDaySelectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListDaySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
