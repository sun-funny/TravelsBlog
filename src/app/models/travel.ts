export interface ITravel {
  id: string;
  country: string;
  city?: string;
  short_description: string;
  description: string;
  flag: string;
  img: string;
  year: number;
  featured: boolean;
  top?: string;
  left?: string;
}