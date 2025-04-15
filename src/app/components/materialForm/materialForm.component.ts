import { Component} from "@angular/core";
import { TrainingMaterial } from "../../model/trainingMaterial";

@Component({
  standalone: true,
  selector: 'material-form',
  templateUrl: './materialForm.component.html',
  styleUrls: ['./materialForm.component.css'],
  imports: [],
})
export class MaterialFormComponent {

  material: TrainingMaterial | undefined;

  selectedConcepts: string[] = [];
  
}