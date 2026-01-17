import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { TeamComponent } from './team.component';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    TeamComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: 'edit/:id', component: TeamComponent },
      { path: 'add', component: TeamComponent }
    ]),
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    ToastModule,
    FileUploadModule
  ],
  providers: [MessageService]
})
export class TeamModule {}