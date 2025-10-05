import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main.component';
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
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { 
        path: '', 
        component: MainComponent 
      }
    ]),
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
    DirectiveModule,
    LeafletModule
  ],
  providers: [
    MessageService
  ]
})
export class MainModule {}