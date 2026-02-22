export interface ICountryContent {
  _id?: string;
  countryId: string;
  content: string;
  carouselImages?: string[];
  updatedAt?: Date;
  updatedBy?: string;
}