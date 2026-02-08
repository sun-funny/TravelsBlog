export interface CarouselPosition {
  x: number;
  y: number;
  scale: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface ICountryContent {
  _id?: string;
  countryId: string;
  content: string;
  carouselImages?: string[];
  carouselPositions?: CarouselPosition[];
  updatedAt?: Date;
  updatedBy?: string;
}