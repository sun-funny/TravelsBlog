export interface ITeam {
  id: string;
  name: string;
  greeting: string;
  image: string;
  position: {
              top: string;
              left: string;
            };
  direction: string;
  description: string;
}