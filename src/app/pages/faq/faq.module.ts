import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqComponent } from './faq.component';
import { DialogModule } from 'primeng/dialog';
import { AuthModule } from '../auth/auth.module';
import { UiModule } from '../ui/ui.module';

@NgModule({
  declarations: [FaqComponent],
  imports: [
    CommonModule,
    DialogModule,
    AuthModule,
    UiModule
  ]
})
export class FaqModule { }
