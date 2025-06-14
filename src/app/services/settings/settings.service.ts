import {Injectable} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {ISettings} from "../../models/settings";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  settingSubject: Subject<ISettings> = new Subject<ISettings>();

  constructor() {
  }

  loadUserSettings(): Observable<ISettings> {
    return new Observable<ISettings>((subscriber) => {
      const settingData = {
        saveToken: true
      }
      subscriber.next(settingData)
    });
  }

  loadUserSettingsSubject(data: ISettings) {
    this.settingSubject.next(data)
  }

  getSettingsSubjectObservable() {
    return this.settingSubject.asObservable();
  }
}
