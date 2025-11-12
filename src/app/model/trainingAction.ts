import { ActionLocation } from "./actionLocation";
import { TrainingItem } from "./trainingItem";

export class TrainingAction extends TrainingItem {
  location: ActionLocation;
  certification?: string;
  microcredentialAwardingBody?: string;

  constructor(data?: Partial<TrainingAction>) {
    super(data);
    this.location = data?.location ?? new ActionLocation();
    this.certification = data?.certification;
    this.microcredentialAwardingBody = data?.microcredentialAwardingBody;
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      location: {
        name: this.location.name,
        coordinates: this.location.coordinates || []
      },
      certification: this.certification,
      license: this.microcredentialAwardingBody || ""
    };
  }
}
