export interface Project {
  id: number;
  title: string;
  description: string;
  tech: string;
  link: string;
  image: string;
  gif: string;
  longDescription: string;
  features: string[];
  year: string;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface SectionVisibility {
  [key: string]: boolean;
}

export interface SectionRefs {
  landing?: HTMLElement | null;
  about?: HTMLElement | null;
  projects?: HTMLElement | null;
  now?: HTMLElement | null;
  contact?: HTMLElement | null;
  [key: string]: HTMLElement | null | undefined;
}