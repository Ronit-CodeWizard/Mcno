import { ProjectCodeBundle, getOrCreateProjectCode } from '../data/projectCode';
import { Project } from '../types';

export interface EnhancedCodeBundle extends ProjectCodeBundle {
  isFromGitHub?: boolean;
  sourceRepoUrl?: string;
  filesLoaded?: string[];
  isFullDocument?: boolean;
}

// Memory cache for compiled project code bundles
const codeBundleCache = new Map<string, EnhancedCodeBundle>();
// Promise cache to prevent duplicate in-flight network requests
const pendingFetches = new Map<string, Promise<EnhancedCodeBundle>>();

const GITHUB_OWNER = 'Ronit-CodeWizard';
const GITHUB_REPO = 'Mcn';
const GITHUB_PAGES_BASE = 'https://ronit-codewizard.github.io/Mcn';
const BRANCHES = ['main', 'master'];

/**
 * Checks if HTML string is a complete document (contains <!DOCTYPE or <html)
 */
function isCompleteHtmlDocument(html: string): boolean {
  const trimmed = html.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<body');
}

/**
 * Compiles HTML, CSS, and JS strings into a standalone, sandboxed HTML document string
 */
export function compileProjectHtml(
  code: EnhancedCodeBundle,
  options: {
    isDark?: boolean;
    scale?: number;
    title?: string;
    projectName?: string;
  } = {}
): string {
  const { html = '', css = '', js = '' } = code;
  const isDark = options.isDark ?? false;
  const projectName = options.projectName || '';
  const githubBaseUrl = projectName
    ? `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${encodeURIComponent(projectName)}/`
    : '';

  // If the fetched HTML from GitHub is already a complete HTML document
  if (isCompleteHtmlDocument(html)) {
    let result = html;

    // Inject <base> tag to resolve relative image/asset references from GitHub repository folder
    if (githubBaseUrl && !result.includes('<base ')) {
      if (result.includes('<head>')) {
        result = result.replace('<head>', `<head>\n  <base href="${githubBaseUrl}">`);
      } else if (result.includes('<html>')) {
        result = result.replace('<html>', `<html>\n<head>\n  <base href="${githubBaseUrl}">\n</head>`);
      }
    }

    // Inject CSS if provided and not already included inline
    if (css.trim()) {
      const styleTag = `\n<style id="codewizard-injected-css">\n${css}\n</style>\n`;
      if (result.includes('</head>')) {
        result = result.replace('</head>', `${styleTag}</head>`);
      } else if (result.includes('<body>')) {
        result = result.replace('<body>', `<head>${styleTag}</head><body>`);
      } else {
        result = styleTag + result;
      }
    }

    // Inject JS if provided and not already included inline
    if (js.trim()) {
      const scriptTag = `\n<script id="codewizard-injected-js">\n(function() {\n  try {\n${js}\n  } catch(e) { console.warn('Code runtime:', e); }\n})();\n</script>\n`;
      if (result.includes('</body>')) {
        result = result.replace('</body>', `${scriptTag}</body>`);
      } else if (result.includes('</html>')) {
        result = result.replace('</html>', `${scriptTag}</html>`);
      } else {
        result = result + scriptTag;
      }
    }

    // Ensure dark mode class on root if active
    if (isDark && !result.includes('class="dark"')) {
      result = result.replace('<html', '<html class="dark"');
    }

    return result;
  }

  // Otherwise, wrap standard component snippet in a rich standalone sandbox template
  return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${options.title || 'Screen'}</title>
  ${githubBaseUrl ? `<base href="${githubBaseUrl}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <style>
    /* Reset & Sandbox Base Styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      min-height: 100%;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    /* Injected Project CSS */
    ${css}
  </style>
</head>
<body>
  ${html}

  <!-- Injected Project JavaScript -->
  <script>
    (function() {
      try {
        ${js}
      } catch (err) {
        console.warn('Sandbox Runtime Notice:', err);
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Helper to fetch a single raw file text from GitHub Pages or GitHub repos with branch fallback
 */
async function fetchRawFileText(projectName: string, fileName: string): Promise<string | null> {
  const urlCandidates: string[] = [
    // GitHub Pages live deployment URL for Mcn
    `${GITHUB_PAGES_BASE}/${encodeURIComponent(projectName)}/${encodeURIComponent(fileName)}`,
    // GitHub raw repository URLs for Mcn (main and master branches)
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${encodeURIComponent(projectName)}/${encodeURIComponent(fileName)}`,
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/master/${encodeURIComponent(projectName)}/${encodeURIComponent(fileName)}`,
    // Fallback CodeWizard repo
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/CodeWizard/main/${encodeURIComponent(projectName)}/${encodeURIComponent(fileName)}`,
  ];

  for (const url of urlCandidates) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        const text = await res.text();
        // Check if response is real code and not a 404 text or HTML error page when expecting css/js
        if (
          text &&
          !text.startsWith('404: Not Found') &&
          !text.includes('<title>404</title>') &&
          !text.includes('Page not found') &&
          text.trim().length > 0
        ) {
          return text;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
  return null;
}

/**
 * Fetches actual code directly from GitHub repository folder:
 * https://github.com/Ronit-CodeWizard/CodeWizard/{projectName}/
 */
export async function fetchActualProjectCode(project: Project): Promise<EnhancedCodeBundle> {
  const projectName = project.name;

  // Check if we already have it in cache with GitHub source
  const cached = codeBundleCache.get(projectName);
  if (cached && cached.isFromGitHub) {
    return cached;
  }

  // Deduplicate in-flight requests
  if (pendingFetches.has(projectName)) {
    return pendingFetches.get(projectName)!;
  }

  const fetchPromise = (async (): Promise<EnhancedCodeBundle> => {
    const filesLoaded: string[] = [];
    let htmlContent: string | null = null;
    let cssContent: string | null = null;
    let jsContent: string | null = null;

    try {
      // Step 1: Try GitHub Contents API to list all files in the project folder
      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(projectName)}`;
      const apiRes = await fetch(apiUrl);

      if (apiRes.ok) {
        const items = await apiRes.json();
        if (Array.isArray(items)) {
          // Find HTML, CSS, JS files in the folder
          const htmlFile = items.find((f: any) => f.name.toLowerCase().endsWith('.html'));
          const cssFile = items.find((f: any) => f.name.toLowerCase().endsWith('.css'));
          const jsFile = items.find((f: any) => f.name.toLowerCase().endsWith('.js'));

          if (htmlFile && htmlFile.download_url) {
            const res = await fetch(htmlFile.download_url);
            if (res.ok) {
              htmlContent = await res.text();
              filesLoaded.push(htmlFile.name);
            }
          }

          if (cssFile && cssFile.download_url) {
            const res = await fetch(cssFile.download_url);
            if (res.ok) {
              cssContent = await res.text();
              filesLoaded.push(cssFile.name);
            }
          }

          if (jsFile && jsFile.download_url) {
            const res = await fetch(jsFile.download_url);
            if (res.ok) {
              jsContent = await res.text();
              filesLoaded.push(jsFile.name);
            }
          }
        }
      }
    } catch {
      // GitHub API might be rate-limited, fallback to direct raw content
    }

    // Step 2: If GitHub API didn't fetch HTML, try direct raw GitHub URLs
    if (!htmlContent) {
      const candidates = ['index.html', 'Index.html', 'main.html', 'app.html'];
      for (const candidate of candidates) {
        const text = await fetchRawFileText(projectName, candidate);
        if (text) {
          htmlContent = text;
          filesLoaded.push(candidate);
          break;
        }
      }
    }

    // Step 3: Fetch CSS if not already loaded
    if (!cssContent) {
      const cssCandidates = ['style.css', 'styles.css', 'main.css', 'app.css', 'css/style.css'];
      for (const candidate of cssCandidates) {
        const text = await fetchRawFileText(projectName, candidate);
        if (text) {
          cssContent = text;
          filesLoaded.push(candidate);
          break;
        }
      }
    }

    // Step 4: Fetch JS if not already loaded
    if (!jsContent) {
      const jsCandidates = ['script.js', 'main.js', 'app.js', 'index.js', 'js/script.js'];
      for (const candidate of jsCandidates) {
        const text = await fetchRawFileText(projectName, candidate);
        if (text) {
          jsContent = text;
          filesLoaded.push(candidate);
          break;
        }
      }
    }

    // If we successfully fetched real content from GitHub
    if (htmlContent) {
      const bundle: EnhancedCodeBundle = {
        html: htmlContent,
        css: cssContent || '',
        js: jsContent || '',
        isFromGitHub: true,
        sourceRepoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/main/${encodeURIComponent(projectName)}`,
        filesLoaded,
        isFullDocument: isCompleteHtmlDocument(htmlContent),
      };
      codeBundleCache.set(projectName, bundle);
      return bundle;
    }

    // Fallback to our embedded verified offline registry if remote files aren't reachable
    const local = getOrCreateProjectCode(projectName, project.title, project.category);
    const bundle: EnhancedCodeBundle = {
      ...local,
      isFromGitHub: false,
      filesLoaded: ['index.html', 'style.css', 'script.js'],
    };
    codeBundleCache.set(projectName, bundle);
    return bundle;
  })();

  pendingFetches.set(projectName, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    pendingFetches.delete(projectName);
  }
}

/**
 * Get synchronous code bundle for a project (cached or initial fallback)
 */
export function getProjectCode(project: Project): EnhancedCodeBundle {
  if (codeBundleCache.has(project.name)) {
    return codeBundleCache.get(project.name)!;
  }

  const bundle: EnhancedCodeBundle = {
    ...getOrCreateProjectCode(project.name, project.title, project.category),
    isFromGitHub: false,
  };
  codeBundleCache.set(project.name, bundle);
  return bundle;
}

/**
 * Update the live in-memory code for a project (allows live editor re-compilation)
 */
export function updateProjectCode(projectName: string, bundle: EnhancedCodeBundle) {
  codeBundleCache.set(projectName, {
    ...bundle,
    isFromGitHub: false, // marked as user-edited
  });
}
