import {ChangeDetectorRef, Directive, ElementRef, OnDestroy, OnInit, Optional, ViewContainerRef} from '@angular/core';
import {UserAccessService} from "../services/user-access/user-access.service";
import {NavigationEnd, Router} from "@angular/router";
import {Button} from "primeng/button";
import {Calendar} from "primeng/calendar";
import {filter, Subscription} from "rxjs";

@Directive({
  selector: 'button [appCanWrite], p-button [appCanWrite], p-calendar [appCanWrite]'
})
export class CanWriteDirective implements OnInit , OnDestroy {
  private unsubscriber: Subscription;
  constructor(private el: ElementRef,
              private accessService: UserAccessService,
              private router: Router,
              private _cdr: ChangeDetectorRef,
              @Optional() private pBtn: Button,
              @Optional() private pCalendar: Calendar) {

  }

  ngOnInit() {
    //first check url
    this.checkAccess(this.router.url);
    this.unsubscriber = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((data) => {
      this.checkAccess((data as NavigationEnd).url);
    });
  }

  ngOnDestroy() {
    this.unsubscriber.unsubscribe();
  }

  private checkAccess(path: string): void {
    const canWrite = this.accessService.canWrite(path);
    if (!canWrite) {
      this.el.nativeElement.setAttribute('disabled', true);
    } else {
      this.el.nativeElement.removeAttribute('disabled');
    }

    if (this.pBtn) {
      this.pBtn.disabled = !canWrite;
    }
    if (this.pCalendar) {
      this.pCalendar.disabled = !canWrite;
    }
     // must trigger update
     this._cdr.detectChanges();
  }

}
