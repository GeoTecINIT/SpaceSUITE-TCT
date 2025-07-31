import { Component, inject } from '@angular/core';
import {  ActivatedRouteSnapshot, CanDeactivateFn, RouterStateSnapshot } from '@angular/router';
import { ExitWithoutSavingService } from '../services/exitWithoutSaving.service';

export const exitWithoutSavingGuard: CanDeactivateFn<Component> = (component: Component, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot) => {
    const exitWithoutSavingService = inject(ExitWithoutSavingService);
    exitWithoutSavingService.showModalSubject.next(true);
    return exitWithoutSavingService.exitSubject.asObservable();
};