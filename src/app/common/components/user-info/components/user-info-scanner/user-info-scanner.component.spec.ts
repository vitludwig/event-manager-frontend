import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInfoScannerComponent } from './user-info-scanner.component';

describe('UserInfoScannerComponent', () => {
  let component: UserInfoScannerComponent;
  let fixture: ComponentFixture<UserInfoScannerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserInfoScannerComponent]
    });
    fixture = TestBed.createComponent(UserInfoScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
