import { ITeam } from "src/app/models/team"; 

export const TeamMock: ITeam[] =[
    {
      name: "Саша",
      greeting: "Привет, я Саша",
      image: "assets/img_team/Alex.png",
      position: { top: "215px", left: "1022px" },
      direction: "right",
      vectorSrc: "assets/vector-2.svg",
    },
    {
      name: "Маша",
      greeting: "Приветик, а я Маша",
      image: "assets/img_team/Marie.png",
      position: { top: "935px", left: "1008px" },
      direction: "left",
      vectorSrc: "assets/vector-3.svg",
    },
    {
      name: "Настя",
      greeting: "Прив, я Настя",
      image: "assets/img_team/Nastie.png",
      position: { top: "1678px", left: "520px" },
      direction: "right",
      vectorSrc: "assets/vector-2.svg",
    },
  ];