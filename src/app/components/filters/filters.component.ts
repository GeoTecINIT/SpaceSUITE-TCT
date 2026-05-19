import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { FilterOption } from '../../model/filterOption';
import { BokModalComponent } from '../bokModal/bokModal.component';

@Component({
  standalone: true,
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    DividerModule,
    InputTextModule,
    MultiSelectModule,
    BokModalComponent,
    SelectButtonModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    MenuModule,
    ButtonModule,
    SkeletonModule,
    CheckboxModule,
  ],
})
export class FiltersComponent {
  @Input() multiSelectOptions: FilterOption[] = [];
  @Output() multiSelectOptionsChange: EventEmitter<FilterOption[]> =
    new EventEmitter();

  @Input() advancedMultiSelectOptions: FilterOption[] = [];
  @Output() advancedMultiSelectOptionsChange: EventEmitter<FilterOption[]> =
    new EventEmitter();

  @Input() loading: boolean = false;

  @Input() searchValue: string = '';
  @Output() searchValueChange: EventEmitter<string> = new EventEmitter();

  searchOptions: MenuItem[] = [
    { label: 'Title' },
    { label: 'Description' },
    { label: 'Learning Outcome' },
  ];
  @Input() selectedOption: string = 'Title';
  @Output() selectedOptionChange: EventEmitter<string> = new EventEmitter();

  @Input() bokConcepts: string[] = [];
  @Output() bokConceptsChange: EventEmitter<string[]> = new EventEmitter();

  @Input() filterUserItemOptions: any[] = [];
  @Input() filterUserItem: boolean = false;
  @Output() filterUserItemChange: EventEmitter<boolean> = new EventEmitter();

  @Input() logged: boolean = false;

  @Input() showAdvancedFilters: boolean = false;
  @Output() showAdvancedFiltersChange: EventEmitter<boolean> =
    new EventEmitter();

  @Input() showPrivate: boolean = false;
  @Output() showPrivateChange: EventEmitter<boolean> = new EventEmitter();

  skeletonElements: number[] = [];

  constructor() {
    this.skeletonElements = Array(5).fill(null);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['logged'] &&
      !changes['logged'].isFirstChange() &&
      changes['logged'].currentValue == false
    ) {
      this.filterUserItemChange.emit(false);
      this.showPrivateChange.emit(false);
    }
  }

  getMultiselectOptions(
    filterOption: FilterOption,
  ): { id: string; value: string }[] {
    return filterOption.values.map((x, i) => ({
      id: filterOption.tags ? filterOption.tags[i] : x,
      value: x,
    }));
  }

  updateOptions() {
    this.multiSelectOptionsChange.emit(this.multiSelectOptions);
  }

  updateAdvancedOptions() {
    this.advancedMultiSelectOptionsChange.emit(this.advancedMultiSelectOptions);
  }

  updateSearchValue() {
    this.searchValueChange.emit(this.searchValue);
  }

  updateShowPrivate(): void {
    this.showPrivateChange.emit(this.showPrivate);
  }

  updateFilterUserItem(newValue: boolean) {
    this.filterUserItem = newValue;
    this.filterUserItemChange.emit(this.filterUserItem);
  }

  clearOptions(label: string) {
    let currentOption = this.multiSelectOptions.find(
      (option) => option.label === label,
    );
    if (currentOption) currentOption.selection = [];
    this.updateOptions();
  }

  clearAdvancedOptions(label: string) {
    let currentOption = this.advancedMultiSelectOptions.find(
      (option) => option.label === label,
    );
    if (currentOption) currentOption.selection = [];
    this.updateAdvancedOptions();
  }

  setSearchOption(option: string) {
    this.selectedOptionChange.emit(option);
  }

  changeAdvancedFiltersState() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.showAdvancedFiltersChange.emit(this.showAdvancedFilters);
    if (!this.showAdvancedFilters) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  trackByLabel(index: number, item: FilterOption): string | number {
    return item.label ?? index;
  }
}
