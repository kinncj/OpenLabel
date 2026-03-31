export type BoxReviewState = "tp" | "fp" | "ignore";

export type BoxAnnotation = {
  id: string;
  classId: number;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  review: BoxReviewState;
  locked: boolean;
  hidden: boolean;
  note?: string | undefined;
};
