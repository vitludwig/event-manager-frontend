import {Directive, HostListener} from '@angular/core';

@Directive({
  selector: '[appAutoUppercase]',
  standalone: true
})
export class AutoUppercaseDirective {

  @HostListener('keyup', ['$event'])
  public onKeyPress(event: KeyboardEvent): void {
    const target = event.target;
    if(target instanceof HTMLInputElement) {
      target.value = target.value.toUpperCase();
    }
  }

}
