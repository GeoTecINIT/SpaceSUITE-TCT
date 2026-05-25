import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { DatePickerModule } from "primeng/datepicker";
import { TimePeriod } from "../../model/trainingAction";

@Component({
  standalone: true,
  selector: 'duration-input',
  templateUrl: './durationInput.component.html',
  styleUrls: ['./durationInput.component.css'],
  imports: [CommonModule, FloatLabelModule, FormsModule, ButtonModule, DividerModule, DatePickerModule],
})
export class DurationInputComponent {
  @Input() periods: TimePeriod[] = [];
  @Output() periodsChange = new EventEmitter<TimePeriod[]>();

  @Input() errorMap: Map<string, string | undefined> = new Map();

  addPeriod() {
    this.periods = [...this.periods, { start: new Date() }];
    this.periodsChange.emit(this.periods);
  }

  deletePeriod(index: number) {
    this.periods = this.periods.filter((_, i) => i !== index);
    this.errorMap.delete('actionPeriod'  + index);
    this.periodsChange.emit(this.periods);
  }

  validatePeriod() {
    this.periodsChange.emit(this.periods);
  }

  checkErrorMap(): boolean {
    for (let i = 0; i<this.periods.length; i++) {
      if (this.errorMap.get('actionPeriod'  + i) != undefined) return true;
    }
    return false;
  }
}
