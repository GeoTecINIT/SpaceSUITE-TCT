import { TrainingItem } from "./trainingItem";

export class TrainingMaterial extends TrainingItem {
  interactivityType?: string;
  contributors: string[];
  license?: string;

  constructor(data?: Partial<TrainingMaterial>) {
    super(data);
    this.interactivityType = data?.interactivityType;
    this.contributors = data?.contributors ?? [];
    this.license = data?.license;
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      interactivityType: this.interactivityType || "",
      contributors: this.contributors,
      license: this.license
    };
  }
}
