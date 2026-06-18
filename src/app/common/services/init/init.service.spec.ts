import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { InitService } from './init.service';

describe('InitService', () => {
  let service: InitService;

  beforeEach(() => {
    // InitService → ProgramService → EventReminderService depends on TranslateService.
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
    });
    service = TestBed.inject(InitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
