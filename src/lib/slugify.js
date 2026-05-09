// Generates a unique, hard-to-guess project slug
// e.g. "mary-brand-roadmap-x7k29p"
export function generateSlug(clientName, projectName) {
  const clean = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 20);

  const namePart = clean(clientName || 'client');
  const projectPart = clean(projectName || 'project');
  const randomPart = Math.random().toString(36).slice(2, 8);

  return `${namePart}-${projectPart}-${randomPart}`;
}
