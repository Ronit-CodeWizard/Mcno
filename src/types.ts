export interface Project {
  id: string;
  name: string;
  title: string;
  category: 'ui' | 'animation' | 'loader' | 'effect' | 'app' | 'component';
  badge?: string;
  description: string;
  technologies: string[];
  files?: string[];
  stars?: number;
  sourceUrl?: string;
  githubUrl?: string;
  rawUrl?: string | null;
  liveUrl?: string;
  type?: 'dir' | 'repo';
}

export type CategoryFilter = 'all' | 'ui' | 'animation' | 'loader' | 'effect' | 'app';

export type ViewMode = 'grid' | 'compact';

export type SortOption = 'featured' | 'name' | 'stars';

export interface RepoStats {
  totalProjects: number;
  stars: number;
  forks: number;
  repoUrl: string;
  owner: string;
  repoName: string;
  branch: string;
  lastUpdated: string;
}
