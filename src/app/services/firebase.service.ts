import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { collection, collectionData, CollectionReference, deleteDoc, doc, docData, Firestore, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { concatMap, from, map, Observable, of } from 'rxjs';
import { TrainingMaterial } from "../model/trainingMaterial";
import { deleteObject, getDownloadURL, ref, Storage, uploadBytes } from "@angular/fire/storage";

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private db: Firestore;
  private storage: Storage;
  private orgCollection: CollectionReference;
  private materialCollection: CollectionReference;

  userId: string = '';

  constructor() {
      this.auth = inject(Auth);
      this.db = inject(Firestore);
      this.storage = inject(Storage)
      this.orgCollection = collection(this.db, 'Organizations');
      this.materialCollection = collection(this.db, 'TrainingMaterials');

      authState(this.auth).subscribe(user => this.userId = user?.uid ?? '');
  }

  getOrganizationList(): Observable<{ _id: string, name: string }[]> {
    const organizations = collectionData(this.orgCollection) as Observable<{ _id: string, name: string}[]>
    return organizations.pipe(
      map( orgs => orgs.sort((a, b) => a.name.localeCompare(b.name)))
    );
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

  getTrainingMaterial(): Observable<TrainingMaterial[]> {
    return collectionData(this.materialCollection) as Observable<TrainingMaterial[]>;
  }

  setTrainingMaterial(newMaterial: TrainingMaterial, image: File | undefined): Observable<string> {
    const newDocRef = doc(this.materialCollection);
    const timestamp = serverTimestamp();
    newMaterial.updatedAt = timestamp;
    newMaterial._id = newDocRef.id;
    if(image) {
      return this.uploadMaterialImage(image, newMaterial._id).pipe(
        concatMap( url => {
          newMaterial.image = url;
          return setDoc(newDocRef, newMaterial.toPlain());
        }),
        map(() => newMaterial._id)
      )
    }
    return of(setDoc(newDocRef, newMaterial.toPlain())).pipe(map(() => newMaterial._id));
  }

  updateTrainingMaterial(material: TrainingMaterial, image: File | undefined): Observable<string> {
    const newDocRef = doc(this.materialCollection, material._id);
    const timestamp = serverTimestamp();
    material.updatedAt = timestamp;
    if (image) {
      return this.uploadMaterialImage(image, material._id).pipe(
        concatMap( url => {
          material.image = url;
          return setDoc(newDocRef, material.toPlain());
        }),
        map(() => material._id)
      )
    }
    return from(setDoc(newDocRef, material.toPlain())).pipe(map(() => material._id));
  }

  deleteTrainingMaterial(material: TrainingMaterial): Observable<void> {
    const docRef = doc(this.materialCollection, material._id);
    return from(deleteDoc(docRef)).pipe(
      concatMap(() => {
        const path = `Training_Material_Images/${material._id}`;
        const storageRef = ref(this.storage, path);
        return from(deleteObject(storageRef));
      })
    );
  }

  private uploadMaterialImage(file: File, materialId: string): Observable<string> {
    const path = `Training_Material_Images/${materialId}`;
    const storageRef = ref(this.storage, path);
    return from(uploadBytes(storageRef, file)).pipe(
      concatMap(() => getDownloadURL(storageRef))
    );
  }
}