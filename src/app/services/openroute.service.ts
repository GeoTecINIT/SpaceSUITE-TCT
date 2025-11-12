import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { catchError, map, Observable, of } from "rxjs";
import { Injectable } from "@angular/core";
import { ActionLocation } from "../model/actionLocation";
import { AutocompleteResponse } from "../model/geocodeAutocompleteDTO";

@Injectable({
  providedIn: 'root'
})
export class OpenrouteService {
  private geocodeAutocompleteURI: string = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${environment.OPENROUTE}&size=10&text=`

  constructor(private readonly http: HttpClient) {}

  getRecommendations(text: string): Observable<ActionLocation[]> {
    if (!text?.trim()) return of([]);

    return this.http
    .get<AutocompleteResponse>(this.geocodeAutocompleteURI + encodeURI(text))
    .pipe(
      map(resp => {
        if (!resp?.features?.length) return [];

        return resp.features.map(feature => new ActionLocation({
          name: feature.properties.label ?? feature.properties.name ?? "Unnamed",
          coordinates: feature.geometry.coordinates as [number, number],
        }));
      }),
      catchError(() => of([]))
    );
  }
}