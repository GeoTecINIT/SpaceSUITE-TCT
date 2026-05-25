import { ActionLocation } from "./actionLocation";
import { TrainingItem } from "./trainingItem";

export class TrainingAction extends TrainingItem {
  actionModality?: string; 
  location: ActionLocation;
  certification?: string;
  microcredentialAwardingBody?: string;
  relatedMaterials: string[] = [];

  constructor(data?: Partial<TrainingAction>) {
    super(data);
    this.actionModality = data?.actionModality;
    this.location = new ActionLocation(data?.location);
    this.certification = data?.certification;
    this.microcredentialAwardingBody = data?.microcredentialAwardingBody;
    this.relatedMaterials = data?.relatedMaterials || [];
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      actionModality: this.actionModality,
      location: this.location ? {
        name: this.location.name,
        coordinates: this.location.coordinates || []
      } : undefined,
      certification: this.certification,
      license: this.microcredentialAwardingBody || "",
      relatedMaterials: this.relatedMaterials || []
    };
  }
}
