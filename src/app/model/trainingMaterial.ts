import { TrainingItem } from "./trainingItem";

export class TrainingMaterial extends TrainingItem {
  materialType: string[];
  interactivityType?: string;
  contributors: string[];
  license?: string;

  constructor(data?: Partial<TrainingMaterial>) {
    super(data);
    this.materialType = data?.materialType ?? [];
    this.interactivityType = data?.interactivityType;
    this.contributors = data?.contributors ?? [];
    this.license = data?.license;
  }

  override toPlain(): Record<string, any> {
    return {
      ...super.toPlain(),
      materialType: this.materialType,
      interactivityType: this.interactivityType || "",
      contributors: this.contributors,
      license: this.license
    };
  }
}
