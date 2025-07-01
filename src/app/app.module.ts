import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from "./app-routing.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { RestInterceptorsService } from "./services/interceptors/rest-interceptors.service";
import { CardModule } from 'primeng/card';
import { ConfigService } from "./services/config/config.service";
import { DirectiveModule } from './directive/directive.module';
import { UiModule } from './pages/ui/ui.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommentsComponent } from './pages/comments/comments.component';
import { AuthInterceptor } from './services/interceptors/auth.interceptor';

function initializeApp(config: ConfigService) {
  return () => config.loadPromise().then(() => {
    console.log('---CONFIG LOADED--', ConfigService.config)
  });
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CardModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    UiModule,
    DirectiveModule,
    ReactiveFormsModule
  ],
  providers: [
    ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService], multi: true
    },
    {provide: HTTP_INTERCEPTORS, 
      useClass: AuthInterceptor, 
      multi: true},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }