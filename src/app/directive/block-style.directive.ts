import {Directive, ElementRef, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import { ITravel } from '../models/travel';

@Directive({
  selector: '[appBlockStyle]',
  host: {
    '(document:keyup)': 'initKeyUp($event)'
  },
  exportAs: 'blockStyle'
})
export class BlockStyleDirective {
  @Input() selector: string = '.selector';
  @Input() initFirst: boolean = false;
  @Input() tours: ITravel[];
  @Output() renderComplete = new EventEmitter();
  private index: number = 0

  constructor(private el: ElementRef) { }

  get activeIndex() {
    return this.index;
  }

  ngOnInit(): void {}

  ngAfterViewChecked(data: SimpleChanges){
    if(this.initFirst) {
        this.changeIndex(0);
    }
  }

  changeIndex(shift: -1 | 1 | 0) {
    const items = [...this.el.nativeElement.querySelectorAll(this.selector)];
    if (!items.length) {
      return;
    }
    const index = items.findIndex((e: Element) => e.classList.contains('active'));
    if (index === this.index && !shift) {
      return
    }
    this.index = index === -1 ? 0 : index;
    items[this.index].classList.remove('active');
    this.index += shift;
    if (this.index < 0) {
      this.index = items.length - 1;
    }
    if (this.index > items.length - 1) {
      this.index = 0;
    }
    items[this.index].classList.toggle('active');
  }

  initKeyUp(event: KeyboardEvent){
    if (event.key === 'ArrowRight') {
      this.changeIndex(1);
    } else if (event.key === 'ArrowLeft') {
      this.changeIndex(-1);
    }

  }
}
