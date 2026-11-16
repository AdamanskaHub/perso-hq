/** Bump when the stored/exported shape changes, and add a step in storage/migrate.ts. */
export const SCHEMA_VERSION = 1;
export const APP_ID = 'personal-hq';

export interface Settings {
  /** Link to the user's existing external Kanban board. Empty string = not set. */
  kanbanUrl: string;
  /** Link to the user's existing external Pomodoro timer. Empty string = not set. */
  timerUrl: string;
  /** Hide completed Life Admin items. */
  hideCompletedAdmin: boolean;
  /** ISO timestamp of the last export from this browser (informational only). */
  lastExportedAt: string | null;
}

export interface MainQuest {
  projectTitle: string;
  /** Empty string = no current mission. */
  nextAction: string;
  context: string;
}

export interface Win {
  id: string;
  text: string;
  projectTitle: string;
  completedAt: string; // ISO timestamp
}

export interface SideQuest {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Trophy {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  /** Resized image as a data URL, stored locally. null = no image. */
  image: string | null;
  /** Optional link to the finished work (http/https). */
  link: string;
}

export interface ActionStep {
  id: string;
  text: string;
  done: boolean;
}

export interface Reflection {
  id: string;
  text: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface Resource {
  id: string;
  title: string;
  /** Optional http/https link. */
  url: string;
}

export interface CharacterArea {
  id: string;
  title: string;
  objective: string;
  status: 'active' | 'archived';
  actions: ActionStep[];
  reflections: Reflection[];
  resources: Resource[];
}

export interface AdminTask {
  id: string;
  text: string;
  done: boolean;
}

export interface AppData {
  settings: Settings;
  mainQuest: MainQuest;
  wins: Win[];
  sideQuests: SideQuest[];
  trophies: Trophy[];
  characterAreas: CharacterArea[];
  adminTasks: AdminTask[];
}

/** The file written by Export and read by Import. */
export interface ExportFile {
  app: typeof APP_ID;
  schemaVersion: number;
  exportedAt: string;
  data: AppData;
}

export interface Doctrine {
  title: string;
  body: string;
}

export const MAX_ACTIVE_AREAS = 3;
