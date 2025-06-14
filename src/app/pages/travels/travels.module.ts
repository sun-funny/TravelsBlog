import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TravelsComponent } from './travels.component';
import { MenubarModule } from "primeng/menubar";
import { CardModule} from 'primeng/card';
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { CalendarModule } from "primeng/calendar";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { SharedModule } from "../../shared/shared.module";
import { UiModule } from '../ui/ui.module';
import { DirectiveModule } from '../../directive/directive.module';

@NgModule({
  declarations: [
    TravelsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: TravelsComponent}]),
    MenubarModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    FormsModule,
    InputTextModule,
    CalendarModule,
    ToastModule,
    SharedModule,
    ReactiveFormsModule,
    UiModule,
    DirectiveModule
  ],
  providers: [
    MessageService
  ]
})
export class TravelsModule {
  constructor() { }
}