import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomMenuComponent } from './bottom-menu.component';

describe('TopMenuComponent', () => {
  let component: BottomMenuComponent;
  let fixture: ComponentFixture<BottomMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BottomMenuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
