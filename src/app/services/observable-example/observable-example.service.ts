import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ObservableExampleService {
  private myBehaviourSubject = new BehaviorSubject<string>('some data')
  private mySubject = new Subject<string>()
  private myObservable = new Observable<string>((subscriber) => {
    setTimeout(() => {
      subscriber.next('some value');
    }, 3000)
  });

  constructor() {
  }

  initObservable() {
    const observable = new Observable((subscriber) => {
      subscriber.next(4);
      subscriber.next(5);
      setTimeout(() => {
        subscriber.next('asyncData');
        subscriber.error('err');
      }, 3000)
    })
    observable.subscribe((data) => {
      // console.log('observable data', data);
    })
  }

  getObservable(): Subject<string> {
    return this.mySubject;
  }

  getBehaviourSubject(): BehaviorSubject<string> {
    return this.myBehaviourSubject
  }
}
