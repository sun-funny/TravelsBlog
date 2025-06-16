import { Component, Input, OnInit } from '@angular/core';
import { IPoint } from '../../../models/point';

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.scss']
})
export class AsideComponent implements OnInit {
  @Input() points: IPoint[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  scrollToPoint(pointId: string): void {
  const element = document.getElementById(pointId);
  if (element) {
    const headerHeight = 82;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    history.replaceState(null, '', `${location.pathname}#${pointId}`);
  }
}
}