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
import { DialogModule } from 'primeng/dialog';
import { AsideComponent } from './aside/aside.component';

@NgModule({
  declarations: [
    CountryComponent,
    AsideComponent
  ],
  imports: [
    CommonModule,
    CountryRoutingModule,
    CardModule,
    ButtonModule,
    FormsModule,
    InputTextModule,
    CarouselModule,
    DialogModule,
    UiModule,
  ]
})
export class CountryModule { }
