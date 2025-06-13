import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module'; 
import { AppComponent } from './app.component';
import { CardModule } from 'primeng/card';
import { ButtonComponent } from './components/ui/button/button.component';
import { MainComponent } from './components/main/main.component';
import { 
  CardComponent,
  CardHeaderComponent,
  CardContentComponent 
} from './components/ui/card/card.component';
import {HeaderComponent, HeaderListComponent, HeaderItemComponent, HeaderLinkComponent } from './components/ui/header/header.component';
import { FooterComponent } from './components/ui/footer/footer.component';

@NgModule({
  declarations: [
    AppComponent,
    ButtonComponent,
    MainComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    HeaderComponent,
    HeaderListComponent,
    HeaderItemComponent,
    HeaderLinkComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }