import { Component, OnInit } from '@angular/core';
import { ITravelDestination } from "../../interface/TravelDestination";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  travelDestinations: ITravelDestination[] = [
    {
      id: 1,
      title: 'Япония! Странная, но до жути интересная',
      description: 'Столица Японии - город Токио..',
      backgroundImage: '/assets/foto1.jpg',
      iconImage: '/assets/group-3.png', // активный
      featured: true,
    },
    {
      id: 2,
      title: 'Англия - мечта жизни!',
      description: 'Столица Англии - Лондон..',
      backgroundImage: '/assets/foto2.jpg',
      iconImage: '/assets/group.png',
      featured: false,
    },
    {
      id: 3,
      title: 'ОАЭ',
      description: 'В состав ОАЭ входят семь эмиратов...',
      backgroundImage: '/assets/foto3.jpg',
      iconImage: '/assets/group.png',
      featured: false,
    },
    {
      id: 4,
      title: 'Сейшеллы',
      description: 'Идеальные тропики',
      backgroundImage: '/assets/foto4.jpg',
      iconImage: '/assets/group.png',
      featured: false,
    },
  ];

  constructor() { }
activeIndex = 0;

  // Метод переключения активного элемента карусели
  setActive(index: number) {
    this.activeIndex = index;
  }

  ngOnInit(): void {
  }

}
