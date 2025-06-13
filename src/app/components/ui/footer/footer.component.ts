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
      img: 'foto1.jpg',
      featured: true,
    },
    {
      id: 2,
      title: 'Англия - мечта жизни!',
      description: 'Столица Англии - Лондон..',
      img: 'foto2.jpg',
      featured: true,
    },
    {
      id: 3,
      title: 'ОАЭ',
      description: 'В состав ОАЭ входят семь эмиратов...',
      img: 'foto3.jpg',
      featured: true,
    },
    {
      id: 4,
      title: 'Сейшеллы',
      description: 'Идеальные тропики',
      img: 'foto4.jpg',
      featured: true,
    },
  ];

  get filteredTickets(): ITravelDestination[] {
    return this.travelDestinations.filter(item => item.featured);
  }

  constructor() { }

  ngOnInit(): void {
  }
}
