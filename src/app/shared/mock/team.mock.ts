import { ITeam } from "src/app/models/team"; 

export const TeamMock: ITeam[] = [
  {
    name: "Саша",
    greeting: "Привет, я Саша",
    image: "assets/img_team/Alex.png",
    position: { top: "0", left: "0" },
    direction: "left",
    vectorSrc: "assets/img_main/vector-2.svg",
    description: "Путешествия - это моя жизнь."
  },
  {
    name: "Маша",
    greeting: "Приветик, а я Маша",
    image: "assets/img_team/Marie.png",
    position: { top: "50%", left: "100%" }, 
    direction: "right",
    vectorSrc: "assets/img_main/vector-3.svg",
    description: "Я программист. Это мой первый веб-сайт. Этим веб-сайтом я хочу красиво рассказать и показать всем как круто и весело можно ездить по разным странам"
  },
  {
    name: "Настя",
    greeting: "Прив, я Настя",
    image: "assets/img_team/Nastie.png",
    position: { top: "100%", left: "0" },
    direction: "left",
    vectorSrc: "assets/img_main/vector-2.svg",
    description: "Я еще школьник. Мечтаю стать дизайнером и покорить все страны мира"
  },
];