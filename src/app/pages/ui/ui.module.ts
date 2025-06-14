import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { CardComponent, CardContentComponent, CardHeaderComponent } from './card/card.component';
import { HeaderComponent, HeaderListComponent, HeaderItemComponent, HeaderLinkComponent } from './header/header.component';

@NgModule({
  declarations: [
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    HeaderComponent,
    HeaderListComponent,
    HeaderItemComponent,
    HeaderLinkComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    HeaderComponent,
    HeaderListComponent,
    HeaderItemComponent,
    HeaderLinkComponent
  ]
})
export class UiModule { }