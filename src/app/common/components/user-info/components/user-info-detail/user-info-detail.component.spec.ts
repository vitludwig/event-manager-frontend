import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInfoDetailComponent } from './user-info-detail.component';

describe('UserInfoDetailComponent', () => {
  let component: UserInfoDetailComponent;
  let fixture: ComponentFixture<UserInfoDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserInfoDetailComponent]
    });
    fixture = TestBed.createComponent(UserInfoDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
