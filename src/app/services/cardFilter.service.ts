import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PaginatorState } from 'primeng/paginator';
import {
  combineLatest,
  concatMap,
  map,
  Observable,
  ReplaySubject,
  take,
} from 'rxjs';
import { FilterOption } from '../model/filterOption';
import { TrainingAction } from '../model/trainingAction';
import { TrainingItem } from '../model/trainingItem';
import { TrainingMaterial } from '../model/trainingMaterial';
import { LanguageService } from './language.service';
import { TrainingMaterialService } from './trainingMaterial.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class CardFilterService {
  private filterOptions: ReplaySubject<FilterOption[]> = new ReplaySubject<
    FilterOption[]
  >(1);

  public searchValue: string = '';
  public searchOption: string = 'Title';
  public bokConcepts: string[] = [];
  public userItemFilter: boolean = false;
  public paginatorState: PaginatorState = {};
  public showPrivate: boolean = false;
  public showAdvancedFilters: boolean = false;

  constructor(
    private readonly languageService: LanguageService,
    private readonly materialService: TrainingMaterialService,
    private readonly utilsService: UtilsService,
    private readonly http: HttpClient,
  ) {
    http
      .get<FilterOption[]>('/assets/filters.json')
      .pipe(
        take(1),
        concatMap((filters: FilterOption[]) => {
          return this.materialService
            .getItemsOrganizations()
            .pipe(map((organizations) => ({ filters, organizations })));
        }),
      )
      .subscribe(({ filters, organizations }) => {
        const updatedFilters = [...filters];
        updatedFilters[updatedFilters.length - 1].values = organizations;
        this.filterOptions.next(updatedFilters);
      });
  }

  public getGeneralMaterialFilterOptions(): Observable<FilterOption[]> {
    const filters = [
      'Subject',
      'Language',
      'Training Material Type',
      'Target Audience',
    ];
    const observables = filters.map((value) => this.getOptionByLabel(value));
    return combineLatest(observables);
  }

  public getAdvancedMaterialFilterOptions(): Observable<FilterOption[]> {
    const filters = [
      'EQF Level',
      'Type of Assessment',
      'Interactivity Type',
      'License',
      'Organizations',
    ];
    const observables = filters.map((value) => this.getOptionByLabel(value));
    return combineLatest(observables);
  }

  public getGeneralActionFilterOptions(): Observable<FilterOption[]> {
    const filters = ['Subject', 'Language', 'Target Audience'];
    const observables = filters.map((value) => this.getOptionByLabel(value));
    return combineLatest(observables);
  }

  public getAdvancedActionFilterOptions(): Observable<FilterOption[]> {
    const filters = [
      'EQF Level',
      'Type of Assessment',
      'Certification',
      'Organizations',
    ];
    const observables = filters.map((value) => this.getOptionByLabel(value));
    return combineLatest(observables);
  }

  public checkItem(item: TrainingItem, filter: FilterOption): boolean {
    switch (filter.label) {
      case 'EQF Level':
        return filter.selection.some((selection) =>
          item.educationLevel.includes(selection.slice(-1)),
        );
      case 'Training Material Type':
        return filter.selection.some((selection) => {
          if (item instanceof TrainingMaterial) {
            if (selection === 'Other') {
              const validTags = filter.values.filter(
                (value) => value != 'Other',
              );
              return item.materialType.some(
                (value) => !validTags.includes(value),
              );
            }
            return item.materialType.includes(selection);
          }
          return false;
        });
      case 'Subject':
        return filter.selection.some((selection) => {
          if (selection === 'Other') {
            const validOptions = filter.values.filter(
              (value) => value != 'Other',
            );
            const validTags = validOptions.map(
              (value) =>
                this.utilsService.knowledgeAreaToCode.get(value) || value,
            );
            return item.subject.some((value) => !validTags.includes(value));
          }
          const formatedSelection =
            this.utilsService.knowledgeAreaToCode.get(selection) || selection;
          return item.subject.includes(formatedSelection);
        });
      case 'Type of Assessment':
        return filter.selection.some((selection) => {
          if (selection === 'Other') {
            const validTags = filter.values.filter((value) => value != 'Other');
            return item.assessment.some((value) => !validTags.includes(value));
          }
          return item.assessment.includes(selection);
        });
      case 'Target Audience':
        return filter.selection.some((selection) => {
          if (selection === 'Other') {
            const validTags = filter.values.filter((value) => value != 'Other');
            return item.audience.some((value) => !validTags.includes(value));
          }
          return item.audience.includes(selection);
        });
      case 'Interactivity Type':
        if (item instanceof TrainingMaterial) {
          return filter.selection.some((selection) => {
            if (selection === 'Other') {
              const validTags = filter.values.filter(
                (value) => value != 'Other',
              );
              return !validTags.includes(item.interactivityType || '');
            }
            return item.interactivityType == selection;
          });
        }
        return false;
      case 'License':
        if (item instanceof TrainingMaterial) {
          return filter.selection.some((selection) => {
            if (selection === 'Other') {
              const validTags = filter.values.filter(
                (value) => value != 'Other',
              );
              return !validTags.includes(item.license || '');
            }
            return item.license == selection;
          });
        }
        return false;
      case 'Certification':
        if (item instanceof TrainingAction) {
          return filter.selection.some((selection) => {
            if (selection === 'Other') {
              const validTags = filter.values.filter(
                (value) => value != 'Other',
              );
              return !validTags.includes(item.certification || '');
            }
            return item.certification == selection;
          });
        }
        return false;
      case 'Language':
        return filter.selection.some(
          (selection) =>
            item.language?.toLowerCase() ==
            this.languageService.getIsoCode(selection),
        );
      case 'Organizations':
        return filter.selection.some(
          (selection) => item.orgName?.toLowerCase() == selection.toLowerCase(),
        );
      default:
        return true;
    }
  }

  public getOptionByLabel(label: string): Observable<FilterOption> {
    return this.filterOptions.pipe(
      map((value) => {
        const option = value.filter((option) => option.label == label);
        if (option.length > 0) return option[0];
        return {
          label: label,
          values: [],
          selection: [],
        };
      }),
    );
  }
}
