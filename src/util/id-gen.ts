import { randomBytes } from 'node:crypto';

// Generates a sortable, unique task ID: "20260224T153042-a3f8"
export function generateTaskId(): string {
  const now = new Date();
  const date = now.toISOString().replace(/[-:]/g, '').replace('T', 'T').slice(0, 15);
  const suffix = randomBytes(2).toString('hex');
  return `${date}-${suffix}`;
}
