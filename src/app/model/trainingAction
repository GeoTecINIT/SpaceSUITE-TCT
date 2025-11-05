import { TrainingItem } from "./trainingItem";

export class TrainingAction extends TrainingItem {
  location: string;
  certification: string;
  microcredentialAwardingBody?: string;

  constructor(data?: Partial<TrainingAction>) {
    super(data);
    this.location = data?.location ?? '';
    this.certification = data?.certification ?? '';
    this.microcredentialAwardingBody = data?.microcredentialAwardingBody;
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      location: this.location,
      certification: this.certification,
      license: this.microcredentialAwardingBody
    };
  }
}
