import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, concatMap, filter, finalize, first, forkJoin, from, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { PdfWorkerResult } from '../model/pdfWorkerResult';
import { PdfWorkerPayload } from '../model/pdfWorkerPayload';
import { PdfResult } from '../model/pdfResult';
import { BokInformationService } from '@eo4geo/ngx-bok-visualization';
import { TrainingItem } from '../model/trainingItem';
import { TrainingMaterial } from '../model/trainingMaterial';
import { TrainingAction } from '../model/trainingAction';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  private pdfUrl = '/assets/TC_User_Guide.pdf';

  private poppinsRegular?: string;
  private poppinsItalic?: string;
  private poppinsBold?: string;
  private spaceSuiteWhiteLogo?: string;
  private EULogo?: string;
  private watermark?: string;

  private resourcesLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private scaleFactor: number = 1.5;

  constructor(private http: HttpClient, private bokUtils: BokInformationService) {
    const poppinsRegular$ = this.loadFont('assets/fonts/poppins/Poppins-Regular.ttf').pipe(
      first(), 
      map(font => this.poppinsRegular = font)
    );
    const poppinsBold$ = this.loadFont('assets/fonts/poppins/Poppins-Bold.ttf').pipe(
      first(), 
      map(font => this.poppinsBold = font)
    );
    const poppinsItalic$ = this.loadFont('assets/fonts/poppins/Poppins-Italic.ttf').pipe(
      first(), 
      map(font => this.poppinsItalic = font),
    );
    const footerImage$ = this.http.get('assets/images/SpaceSUITE_horizontal_white.png', { responseType: 'blob' }).pipe(
      first(),
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.spaceSuiteWhiteLogo = image)
    );
    const footerImage2$ = this.http.get('assets/images/EU_Funding.png', { responseType: 'blob' }).pipe(
      first(),
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.EULogo = image)
    );
    const watermarkImage$ = this.http.get('assets/images/watermark.png', { responseType: 'blob' }).pipe(
      first(),
      switchMap(blob => from(this.blobToBase64(blob))),
      map(image => this.watermark = image)
    );
    forkJoin([poppinsRegular$, poppinsBold$, poppinsItalic$, footerImage$, footerImage2$, watermarkImage$]).pipe(finalize(() => this.resourcesLoaded.next(true))).subscribe();
  }

  private loadFont(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'arraybuffer' }).pipe(
      map(buffer => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      })
    );
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  generateItemPdf(item: TrainingItem): Observable<PdfResult> {
    let itemToPrint: TrainingItem;
    if( item instanceof TrainingMaterial) {
      itemToPrint = new TrainingMaterial(item);
    }
    else itemToPrint = new TrainingAction(item);
    const parseBokConcepts$ = this.safeForkJoin([
      this.parseBokConcepts(itemToPrint.subject).pipe(
        tap(parsed => itemToPrint.subject = parsed || [])
      ),
      this.parseBokConcepts(itemToPrint.concepts).pipe(
        tap(parsed => itemToPrint.concepts = parsed || [])
      )
    ]);
    return this.resourcesLoaded.pipe(
      filter(value => value === true), 
      take(1), 
      concatMap(() => parseBokConcepts$), 
      switchMap(() =>
        from(this.generatePdf({
          item: itemToPrint,
          scaleFactor: this.scaleFactor,
          assets: {
            poppinsRegular: this.poppinsRegular,
            poppinsBold: this.poppinsBold,
            poppinsItalic: this.poppinsItalic,
            watermark: this.watermark,
            euLogo: this.EULogo,
            spaceSuiteLogo: this.spaceSuiteWhiteLogo
          }
        }))
      ),
      map((result: PdfWorkerResult) => {
        const url = URL.createObjectURL(result.blob);
        return {
          blob: result.blob,
          url,
          filename: result.filename
        };
      })
    );
  }

  private parseBokConcepts(concepts: string[]): Observable<string[] | null> {
    const conceptsObservables = concepts.map(value => this.bokUtils.getConceptName(value).pipe(
      first(),
      map((name) => {
        if (name === 'Unknown Concept') return value;
        return `[${value}] ` + name
      }),
    ));
    return this.safeForkJoin(conceptsObservables);
  }

  private generatePdf(payload: PdfWorkerPayload): Promise<PdfWorkerResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL('../workers/pdf-generator.worker', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = ({ data }: { data: PdfWorkerResult }) => {
        resolve(data);
        worker.terminate();
      };

      worker.onerror = err => {
        reject(err);
        worker.terminate();
      };

      worker.postMessage(payload);
    });
  }

  private safeForkJoin = (sources: Observable<any>[]) =>
      sources.length ? forkJoin(sources) : of(null);

  getPdf(): Observable<Blob> {
    return this.http.get(this.pdfUrl, { responseType: 'blob' });
  }
}
