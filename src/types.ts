export type CardStatus = "todo" | "in_progress" | "done" | "error";
export type ChecklistStatus = "todo" | "done" | "error";

export interface ChecklistItemOut {
  id: string;
  title: string;
  detailMd: string | null;
  status: ChecklistStatus;
  position: number;
}

export interface CardOut {
  id: string;
  title: string;
  description: string | null;
  status: CardStatus;
  position: number;
  summary: string | null;
  checklist?: ChecklistItemOut[];
}

export interface TaskNextResponse {
  card: CardOut | null;
  previousSummary: string | null;
}

export interface CardCurrentResponse {
  card: CardOut | null;
}

export interface ChecklistUpdateResponse {
  ok: true;
  cardStatus: string;
}

export interface CardMoveResponse {
  ok: true;
}

export interface ProjectOut {
  id: string;
  name: string;
  description: string | null;
  mode: string;
  status: string;
}

export interface PrdOut {
  versionNumber: number;
  contentMd: string;
  changelogSummary: string | null;
  createdAt: string;
}

export interface PrdResponse {
  project: ProjectOut | null;
  prd: PrdOut | null;
}
