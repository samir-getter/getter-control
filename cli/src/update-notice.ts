// Getter Control is distributed from source. An upstream npm notice would
// replace this fork with Paperclip, so notices stay disabled until the fork
// publishes its own update channel. Explicit source updates use the CLI guard.
export function isUpdateNoticeEnabled(_configPath?: string): boolean {
  return false;
}

export async function checkForUpdateNotice(_options: {
  configPath?: string;
  now?: number;
  fetchImpl?: typeof fetch;
  cachePath?: string;
} = {}): Promise<string | null> {
  return null;
}

export async function printUpdateNotice(_configPath?: string): Promise<void> {}
