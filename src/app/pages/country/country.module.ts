import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountryRoutingModule } from './country-routing.module';
import { CountryComponent } from './country.component';
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { CarouselModule } from "primeng/carousel";
import { UiModule } from '../ui/ui.module';
import { DialogModule } from 'primeng/dialog';
import { AsideComponent } from './aside/aside.component';
import { ToastModule } from 'primeng/toast';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { HttpClientModule } from '@angular/common/http';
import { AddPointFormComponent } from './add-point-form/add-point-form.component';

@NgModule({
  declarations: [
    CountryComponent,
    AsideComponent,
    AddPointFormComponent
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
    ReactiveFormsModule,
    ToastModule,
    InputTextareaModule,
    FileUploadModule,
    ProgressSpinnerModule,
    AngularEditorModule,
    HttpClientModule
  ],
   providers: [MessageService]
})
export class CountryModule { }
