import { Project } from '../types';
import { REAL_PROJECT_CODE } from './realProjectCode';

export interface ProjectCodeBundle {
  html: string;
  css: string;
  js?: string;
}

export const PROJECT_CODE_REGISTRY: Record<string, ProjectCodeBundle> = REAL_PROJECT_CODE;

/**
 * Returns the authentic project code from the repository dataset
 */
export function getProjectCode(projectOrName: Project | string): ProjectCodeBundle {
  const name = typeof projectOrName === 'string' ? projectOrName : projectOrName.name;

  if (PROJECT_CODE_REGISTRY[name]) {
    return PROJECT_CODE_REGISTRY[name];
  }

  // Case insensitive match
  const lowerName = name.toLowerCase();
  const matchKey = Object.keys(PROJECT_CODE_REGISTRY).find(
    (k) => k.toLowerCase() === lowerName
  );

  if (matchKey && PROJECT_CODE_REGISTRY[matchKey]) {
    return PROJECT_CODE_REGISTRY[matchKey];
  }

  return {
    html: '',
    css: '',
    js: ''
  };
}

export function getOrCreateProjectCode(
  projectOrName: Project | string,
  _title?: string,
  _category?: string
): ProjectCodeBundle {
  return getProjectCode(projectOrName);
}
