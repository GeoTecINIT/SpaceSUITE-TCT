import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class ExitWithoutSavingService {
    exitSubject: Subject<boolean> = new Subject();
    showModalSubject: Subject<boolean> = new Subject();
}