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
import { NearestTravelsComponent } from './nearest-travels.component';
import { AddTravelComponent } from './add-travel/add-travel.component';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from 'primeng/dynamicdialog';
import { AddPointComponent } from '../country/add-point/add-point.component';
import { CountryComponent } from '../country/country.component';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { AsideTravelsComponent } from './aside-travels/aside-travels.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@NgModule({
  declarations: [
    TravelsComponent,
    AddTravelComponent,
    AddPointComponent,
    AsideTravelsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: TravelsComponent},
      { path: 'add', component: AddTravelComponent },
      { path: 'edit/:id', component: AddTravelComponent }
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
    InputSwitchModule,
    DialogModule,
    InputTextareaModule,
    MultiSelectModule,
    FileUploadModule,
    ProgressSpinnerModule
  ],
  providers: [
    MessageService,
    DialogService
  ],
  entryComponents: [AddPointComponent]
})
export class TravelsModule {}