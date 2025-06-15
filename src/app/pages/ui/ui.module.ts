import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { CardComponent, CardContentComponent, CardHeaderComponent } from './card/card.component';
import { HeaderComponent, HeaderListComponent, HeaderItemComponent, HeaderLinkComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    HeaderComponent,
    HeaderListComponent,
    HeaderItemComponent,
    HeaderLinkComponent,
    FooterComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    HeaderComponent,
    HeaderListComponent,
    HeaderItemComponent,
    HeaderLinkComponent,
    FooterComponent
  ]
})
export class UiModule { }