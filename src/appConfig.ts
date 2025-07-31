import { ApplicationConfig } from '@angular/core';
import { provideProtractorTestingSupport } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideHttpClient } from '@angular/common/http';
import { MaterialExplorerComponent } from './app/components/materialExplorer/materialExplorer.component';
import { MaterialPageComponent } from './app/components/materialPage/materialPage.component';
import { provideRouter, Routes } from '@angular/router';
import { AuthGuard, NotFoundPageComponent, OrganizationPageComponent, UserPageComponent } from '@eo4geo/ngx-bok-utils';
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { MaterialFormComponent } from './app/components/materialForm/materialForm.component';
import { EditPageComponent } from './app/components/editPage/editPage.component';
import { exitWithoutSavingGuard } from './app/guards/exitWithoutSaving.guard';

const routes: Routes = [
    { path: '', component: MaterialExplorerComponent },
    { path: 'new', component: MaterialFormComponent, canActivate: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: 'not_found', component: NotFoundPageComponent},
    { path: 'profile', component: UserPageComponent, canActivate: [AuthGuard]},
    { path: 'organizations', component: OrganizationPageComponent, canActivate: [AuthGuard]},
    { path: 'edit/:dynamicValue', component: EditPageComponent, canActivate: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: ':dynamicValue', component: MaterialPageComponent },
    { path: '**', component: NotFoundPageComponent}
];

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideFirebaseApp(() => initializeApp(environment.FIREBASE)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        provideProtractorTestingSupport(),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    prefix: 'p',
                    darkModeSelector: false,
                    cssLayer: false
                }             
            }
        })
    ]
};