import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CanWriteDirective} from "../directive/can-write.directive";
import {DirectiveModule} from "../directive/directive.module";

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DirectiveModule
  ],
  exports: [CanWriteDirective]
})
export class SharedModule { }
