import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { collection, collectionData, CollectionReference, doc, docData, Firestore, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { concatMap, from, map, Observable, of } from 'rxjs';
import { TrainingMaterial } from "../model/trainingMaterial";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private db: Firestore;
  private orgCollection: CollectionReference;
  private materialCollection: CollectionReference;

  userId: string = '';

  constructor() {
      this.auth = inject(Auth);
      this.db = inject(Firestore);
      this.orgCollection = collection(this.db, 'Organizations');
      this.materialCollection = collection(this.db, 'TrainingMaterials');

      authState(this.auth).subscribe(user => this.userId = user?.uid ?? '');
  }

  getUserOrganizationList(): Observable<{ _id: string, name: string }[]> {
    let uid = ''
    return authState(this.auth).pipe(
      concatMap(user => {
        if (!user) return of([]);
        uid = user.uid;
        return collectionData(this.orgCollection) as Observable<{ _id: string, name: string, regular: string[], admin: string[] }[]>;
      }),
      map(organizations => 
        organizations.filter(organization => organization.regular.includes(uid) || organization.admin.includes(uid))
        .map(organization => ({ _id: organization._id, name: organization.name }))
      )
    );
  }
    
  getOrganizationDivisions(orgId: string): Observable<string[]> {
    const orgDocRef = doc(this.orgCollection, orgId);
    const organizationUsersSnapshot = docData(orgDocRef) as Observable<{ divisions: string[] }>;
    return organizationUsersSnapshot.pipe(
      map(data => data.divisions)
    );
  }
  
  getUserData() {
    return this.auth.currentUser;
  }

  setTrainingMaterial(newMaterial: TrainingMaterial): Observable<void> {
    const newDocRef = doc(this.materialCollection);
    const timestamp = serverTimestamp();
    newMaterial.updatedAt = timestamp;
    newMaterial._id = newDocRef.id;
    return from(setDoc(newDocRef, newMaterial.toPlain()));
  }
}