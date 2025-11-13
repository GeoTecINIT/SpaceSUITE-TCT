import { ApplicationConfig } from '@angular/core';
import { provideProtractorTestingSupport } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideHttpClient } from '@angular/common/http';
import { ItemExplorerComponent } from './app/components/itemExplorer/itemExplorer.component';
import { MaterialPageComponent } from './app/components/materialPage/materialPage.component';
import { provideRouter, Routes } from '@angular/router';
import { AuthGuard, exitWithoutSavingGuard, NotFoundPageComponent, OrganizationPageComponent, UserPageComponent } from '@eo4geo/ngx-bok-utils';
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { MaterialFormComponent } from './app/components/materialForm/materialForm.component';
import { EditMaterialPageComponent } from './app/components/editMaterialPage/editMaterialPage.component';
import { ActionFormComponent } from './app/components/actionForm/actionForm.component';
import { EditActionPageComponent } from './app/components/editActionPage/editActionPage.component';
import { ActionPageComponent } from './app/components/actionPage/actionPage.component';

const routes: Routes = [
    { path: '', component: ItemExplorerComponent },
    { path: 'profile', component: UserPageComponent, canMatch: [AuthGuard]},
    { path: 'organizations', component: OrganizationPageComponent, canMatch: [AuthGuard]},
    { path: 'material', redirectTo: '', pathMatch: 'full'},
    { path: 'material/new', component: MaterialFormComponent, canMatch: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: 'material/edit/:dynamicValue', component: EditMaterialPageComponent, canMatch: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: 'material/:dynamicValue', component: MaterialPageComponent },
    { path: 'action', redirectTo: '', pathMatch: 'full'},
    { path: 'action/new', component: ActionFormComponent, canMatch: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: 'action/edit/:dynamicValue', component: EditActionPageComponent, canMatch: [AuthGuard], canDeactivate: [exitWithoutSavingGuard]},
    { path: 'action/:dynamicValue', component: ActionPageComponent },
    { path: 'not_found', component: NotFoundPageComponent},
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