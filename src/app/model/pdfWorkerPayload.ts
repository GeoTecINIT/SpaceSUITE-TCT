import { TrainingItem } from "./trainingItem";

export interface PdfWorkerPayload {
  item: TrainingItem;
  scaleFactor: number;
  assets: {
    poppinsRegular?: string;
    poppinsBold?: string;
    poppinsItalic?: string;
    watermark?: string;
    euLogo?: string;
    spaceSuiteLogo?: string;
  };
}