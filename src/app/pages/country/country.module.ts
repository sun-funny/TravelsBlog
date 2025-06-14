import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountryRoutingModule } from './country-routing.module';
import { CountryComponent } from './country.component';
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { CarouselModule } from "primeng/carousel";
import { UiModule } from '../ui/ui.module';

@NgModule({
  declarations: [
    CountryComponent
  ],
  imports: [
    CommonModule,
    CountryRoutingModule,
    CardModule,
    ButtonModule,
    FormsModule,
    InputTextModule,
    CarouselModule,
    UiModule,
  ]
})
export class CountryModule { }
