import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentsComponent } from './comments.component';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';

const routes = [
  { path: '', component: CommentsComponent }
];

@NgModule({
  declarations: [CommentsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CardModule,
    ButtonModule,
    InputTextareaModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService]
})
export class CommentsModule { }