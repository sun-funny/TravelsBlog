export interface ITravel {
  _id?: string;
  id: string;
  country: string;
  city?: string;
  short_description: string;
  description: string;
  flag: string;
  img: string;
  year: number;
  featured: boolean;
  richContent?: string;
  contentUpdatedAt?: Date;
  contentUpdatedBy?: string;
}