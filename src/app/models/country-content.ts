export interface ICountryContent {
  _id?: string;
  countryId: string;
  content: string;
  carouselImages?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}