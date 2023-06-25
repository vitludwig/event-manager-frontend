import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageMenuComponent } from './language-menu.component';

describe('LanguageMenuComponent', () => {
  let component: LanguageMenuComponent;
  let fixture: ComponentFixture<LanguageMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LanguageMenuComponent]
    });
    fixture = TestBed.createComponent(LanguageMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
