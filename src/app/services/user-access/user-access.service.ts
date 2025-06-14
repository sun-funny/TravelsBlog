import { Injectable } from '@angular/core';
import {IUserRules, UserRules} from "../../shared/mock/rules";
import {debounce, debounceTime, Observable, of, timer} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserAccessService {
  private accessMap = new Map()  // TODO создать тип для accessMap
  constructor() { }

  initAccess(rules: Readonly<IUserRules[]>): void {
    if (Array.isArray(rules)) {
      rules.forEach((rule) => {
        const formattedString = this.formattedPath(rule.path);
        this.accessMap.set(formattedString, rule.rules)
      });
    }
  }

  canWrite(path: string): boolean {

    const formattedString = this.formattedPath(path);
    return this.accessMap.get(formattedString)?.write;
  }

  canRead(path: string): boolean {
    const formattedString = this.formattedPath(path);
    return this.accessMap.get(formattedString)?.read;
  }

  formattedPath(path: string): string {
    if (typeof path === "string") {
      return path.replace(/\//g, " ").trim().replace(/\s/g, '.');
    }
    return '';
  }

  getUserRules(): Observable<Readonly<IUserRules[]>> {
    return of(UserRules);
  }
}
