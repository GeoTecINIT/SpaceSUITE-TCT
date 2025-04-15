import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { DividerModule } from "primeng/divider";
import { InputIcon } from 'primeng/inputicon';
import { ButtonModule } from "primeng/button";
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext'
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { FilterOption } from "../../model/filterOption";
import { BokModalComponent } from "../bokModal/bokModal.component";
import { CardFilterService } from "../../services/cardFilter.service";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
  imports: [CommonModule, FormsModule, DividerModule, InputIcon, IconField, InputTextModule, MultiSelectModule, BokModalComponent, ButtonModule, SelectButtonModule],
})
export class FiltersComponent {
  @Input() multiSelectOptions: FilterOption[] = [];
  @Output() multiSelectOptionsChange: EventEmitter<FilterOption[]> = new EventEmitter();

  @Input() loading: boolean = false;

  searchValue: string;
  @Output() searchValueChange: EventEmitter<string> = new EventEmitter();

  @Output() bokConceptsChange: EventEmitter<string[]> = new EventEmitter();

  filterUserMaterialOptions: any[] = [{ label: 'On', value: true },{ label: 'Off', value: false }];
  filterUserMaterial: boolean = false;
  @Output() filterUserMaterialChange: EventEmitter<boolean> = new EventEmitter();

  @Input() multiSelectUserOptions: FilterOption[] = [];
  @Output() multiSelectUserOptionsChange: EventEmitter<FilterOption[]> = new EventEmitter();

  @Input() logged: boolean = false;

  constructor(private filterService: CardFilterService, private router: Router) {
    this.searchValue = filterService.searchOption;
  }

  updateOptions() {
    this.multiSelectOptionsChange.emit(this.multiSelectOptions);
  }

  updateUserOptions() {
    this.multiSelectUserOptionsChange.emit(this.multiSelectUserOptions);
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

  clearUserOptions(label: string) {
    let currentOption = this.multiSelectUserOptions.find(option => option.label === label);
    if (currentOption) currentOption.selection = [];
    this.updateOptions();
  }

  createTrainingMaterial() {
    this.router.navigate(['new'], {replaceUrl: true});
  }

}