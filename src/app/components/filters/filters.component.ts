import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { DividerModule } from "primeng/divider";
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FilterOption } from "../../model/filterOption";
import { BokModalComponent } from "../bokModal/bokModal.component";
import { CardFilterService } from "../../services/cardFilter.service";
import { TooltipModule } from "primeng/tooltip";

@Component({
  standalone: true,
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
  imports: [CommonModule, FormsModule, DividerModule, InputIcon, IconField, InputTextModule, MultiSelectModule, BokModalComponent, SelectButtonModule, TooltipModule],
})
export class FiltersComponent {
  @Input() multiSelectOptions: FilterOption[] = [];
  @Output() multiSelectOptionsChange: EventEmitter<FilterOption[]> = new EventEmitter();

  @Input() loading: boolean = false;

  searchValue: string;
  @Output() searchValueChange: EventEmitter<string> = new EventEmitter();

  @Output() bokConceptsChange: EventEmitter<string[]> = new EventEmitter();

  filterUserMaterialOptions: any[] = [{ label: 'My Materials', value: true, icon: 'pi pi-user' },{ label: 'All Materials', value: false, icon: 'pi pi-globe' }];
  filterUserMaterial: boolean = false;
  @Output() filterUserMaterialChange: EventEmitter<boolean> = new EventEmitter();

  @Input() logged: boolean = false;

  constructor(private filterService: CardFilterService) {
    this.searchValue = filterService.searchOption;
    this.filterUserMaterial = filterService.userMaterialFilter;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["logged"] && !changes["logged"].isFirstChange() && changes['logged'].currentValue == false) { 
      this.filterUserMaterial = false;
    }
  }

  updateOptions() {
    this.multiSelectOptionsChange.emit(this.multiSelectOptions);
  }

  updateSearchValue() {
    this.searchValueChange.emit(this.searchValue);
  }

  updateFilterUserMaterial() {
    this.filterUserMaterialChange.emit(this.filterUserMaterial);
  }

  clearOptions(label: string) {
    let currentOption = this.multiSelectOptions.find(option => option.label === label);
    if (currentOption) currentOption.selection = [];
    this.updateOptions();
  }

}