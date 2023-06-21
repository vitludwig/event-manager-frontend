import { StringToJsonPipe } from './string-to-json.pipe';

describe('StringToJsonPipe', () => {
  it('create an instance', () => {
    const pipe = new StringToJsonPipe();
    expect(pipe).toBeTruthy();
  });
});
