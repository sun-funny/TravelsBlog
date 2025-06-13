import { Component } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  locations = [
    { country: "England", city: "Лондон", top: "0", left: "780px" },
    { country: "Mauritius", city: "", top: "231px", left: "568px" },
    { country: "Spain", city: "Мадрид", top: "338px", left: "432px" },
    { country: "Seychelles", city: "Виктория", top: "404px", left: "163px" },
    { country: "UAE", city: "Абу-Даби", top: "432px", left: "640px" },
    { country: "Japan", city: "Токио", top: "397px", left: "868px" },
    { country: "USA", city: "Вашингтон", top: "548px", left: "475px" },
    { country: "Turkey", city: "Анкара", top: "578px", left: "146px" },
    { country: "Egypt", city: "Каир", top: "704px", left: "399px" },
    { country: "Iceland", city: "Рейкьявик", top: "944px", left: "505px" },
  ];

  teamMembers = [
    {
      name: "Саша",
      greeting: "Привет, я Саша",
      image: "assets/Alex.png",
      position: { top: "215px", left: "1022px" },
      direction: "right",
      vectorSrc: "assets/vector-2.svg",
    },
    {
      name: "Маша",
      greeting: "Приветик, а я Маша",
      image: "assets/Marie.png",
      position: { top: "935px", left: "1008px" },
      direction: "left",
      vectorSrc: "assets/vector-3.svg",
    },
    {
      name: "Настя",
      greeting: "Прив, я Настя",
      image: "assets/Marie.png",
      position: { top: "1678px", left: "520px" },
      direction: "right",
      vectorSrc: "assets/vector-2.svg",
    },
  ];
}