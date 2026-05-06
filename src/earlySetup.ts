// Runs before expo-router/entry. Sets up the global error handler BEFORE
// React Native installs its own handler so we can capture early startup crashes.
import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASH_KEY = 'zs:last_startup_crash';

(ErrorUtils as any).setGlobalHandler((error: Error, isFatal?: boolean) => {
  const msg = String(error?.message ?? error);
  const stack = String(error?.stack ?? '').slice(0, 600);
  const entry = `[${isFatal ? 'FATAL' : 'ERROR'}] ${msg}\n\n${stack}`;

  // Synchronous — survives even if the process aborts a few ms later
  console.error('[ZS CRASH]', entry);

  // Async write — may or may not complete before the abort, but often does
  try { AsyncStorage.setItem(CRASH_KEY, entry).catch(() => {}); } catch {}
});

export { CRASH_KEY };
