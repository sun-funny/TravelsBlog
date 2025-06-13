import { Component, Input } from '@angular/core';
import { cn } from '../../lib/utils';

@Component({
  selector: 'app-card',
  template: '<ng-content></ng-content>',
  host: {
    '[class]': 'cardClasses'
  }
})
export class CardComponent {
  @Input() className = '';
  
  get cardClasses(): string {
    return cn(
      'border-0 bg-card text-card-foreground shadow overflow-hidden', // Убираем border и добавляем overflow-hidden
      this.className
    );
  }
}

@Component({
  selector: 'app-card-header',
  template: '<ng-content></ng-content>',
  host: {
    '[class]': 'headerClasses'
  }
})
export class CardHeaderComponent {
  @Input() className = '';
  
  get headerClasses(): string {
    return cn('flex flex-col space-y-1.5 p-6', this.className);
  }
}

@Component({
  selector: 'app-card-content',
  template: '<ng-content></ng-content>',
  host: {
    '[class]': 'contentClasses'
  }
})
export class CardContentComponent {
  @Input() className = '';
  
  get contentClasses(): string {
    return cn('p-6 pt-0', this.className);
  }
}