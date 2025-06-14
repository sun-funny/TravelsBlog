import { Component, Input } from '@angular/core';
import { cn } from '../../lib/utils';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() className = '';
  
  navItems = [
    { text: "ГЛАВНАЯ", width: "165px" },
    { text: "НАШИ ПУТЕШЕСТВИЯ", width: "390px" },
    { text: "FAQ", width: "334px" },
  ];

  get headerClasses(): string {
    return cn('max-w-none w-full flex justify-center', this.className);
  }
}

@Component({
  selector: 'app-header-list',
  templateUrl: './header-list.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderListComponent {
  @Input() className = '';
  
  get listClasses(): string {
    return cn('flex gap-4 justify-center', this.className);
  }
}

@Component({
  selector: 'app-header-item',
  templateUrl: './header-item.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderItemComponent {
  @Input() className = '';
  
  get itemClasses(): string {
    return cn('', this.className);
  }
}

@Component({
  selector: 'app-header-link',
  templateUrl: './header-link.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderLinkComponent {
  @Input() className = '';
  @Input() width = '';
  
  get linkClasses(): string {
    return cn(
      'flex items-center justify-center font-dela-gothic text-white text-2xl transition-colors hover:bg-[#6da7d3]',
      this.className
    );
  }
}