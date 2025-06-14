import {Component} from '@angular/core';
import {ObservableExampleService} from "./services/observable-example/observable-example.service";
import {ConfigService} from "./services/config/config.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'toursBlog';

  constructor(
    private test: ObservableExampleService,
    private configService: ConfigService
  ) {

  }
}