import { Component, Input, Output, EventEmitter } from '@angular/core';
import { cn } from '../../lib/utils';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  @Input() className = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  
  @Output() click = new EventEmitter<Event>();

  get buttonClasses(): string {
    return cn(
      'button',
      `button-variant-${this.variant}`,
      `button-size-${this.size}`,
      this.className
    );
  }

  onClick(event: Event) {
    this.click.emit(event);
  }
}