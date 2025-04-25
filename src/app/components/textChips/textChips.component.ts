import { Component, EventEmitter, Input, Output} from "@angular/core";
import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  selector: 'text-chips',
  templateUrl: './textChips.component.html',
  styleUrls: ['./textChips.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, ButtonModule, ChipModule, CommonModule],
})
export class TextChipsComponent {

  @Input() chips: string[] = [];
  @Output() chipsChange: EventEmitter<string[]> = new EventEmitter();
  currentText: string = '';

  @Input() fieldName: string = 'Field Name';
  @Input() icon: string = 'pi pi-users';

  addElement() {
    this.chipsChange.emit(this.chips.concat(this.currentText));
    this.currentText = '';
  }

  deleteElement(element: string) {
    this.chipsChange.emit(this.chips.filter(value => value != element));
  }
  
}