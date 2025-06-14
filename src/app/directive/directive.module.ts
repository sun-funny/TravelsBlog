import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanWriteDirective } from './can-write.directive';
import { BlockStyleDirective } from './block-style.directive';

@NgModule({
  declarations: [
    CanWriteDirective,
    BlockStyleDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CanWriteDirective,
    BlockStyleDirective
  ]
})
export class DirectiveModule { }
