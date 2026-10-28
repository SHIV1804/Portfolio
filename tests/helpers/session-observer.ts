import type { Page } from '@playwright/test';

const SESSION_PATH = '/api/auth/session';
const CLIENT_FETCH_ERROR = '[next-auth][error][CLIENT_FETCH_ERROR]';
const IGNORED_CONSOLE_ERROR_FRAGMENTS = [
  'ResizeObserver',
  'Non-Error promise rejection',
  'Uncaught (in promise)',
] as const;

export type SessionRequestFailure = {
  url: string;
  errorText: string | undefined;
};

export type SessionResponse = {
  url: string;
  status: number;
};

export type SessionObserver = {
  consoleErrors: string[];
  requestFailures: SessionRequestFailure[];
  responses: SessionResponse[];
  waitForSessionResponse(): Promise<unknown>;
  unmatchedSessionErrors(): string[];
  invalidSessionFailures(): SessionRequestFailure[];
  invalidSessionResponses(): SessionResponse[];
  hasError(): boolean;
};

function isSessionUrl(url: string): boolean {
  return url.includes(SESSION_PATH);
}

export function isIgnorableConsoleError(message: string): boolean {
  return IGNORED_CONSOLE_ERROR_FRAGMENTS.some((fragment) =>
    message.includes(fragment),
  );
}

// Chromium's message.text() renders NextAuth's metadata object inline as
// "{error: Object, url: /api/auth/session, message: Failed to fetch}".
function isAbortedSessionConsoleError(message: string): boolean {
  return (
    message.includes(CLIENT_FETCH_ERROR) &&
    message.includes('url: /api/auth/session') &&
    message.includes('message: Failed to fetch')
  );
}

export function observeSessionTraffic(page: Page): SessionObserver {
  const consoleErrors: string[] = [];
  const requestFailures: SessionRequestFailure[] = [];
  const responses: SessionResponse[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  page.on('requestfailed', (request) => {
    if (isSessionUrl(request.url())) {
      requestFailures.push({
        url: request.url(),
        errorText: request.failure()?.errorText,
      });
    }
  });

  page.on('response', (response) => {
    if (isSessionUrl(response.url())) {
      responses.push({ url: response.url(), status: response.status() });
    }
  });

  const observer: SessionObserver = {
    consoleErrors,
    requestFailures,
    responses,
    waitForSessionResponse() {
      return page.waitForResponse((response) => isSessionUrl(response.url()));
    },
    unmatchedSessionErrors() {
      const unmatchedAborts = requestFailures.filter(
        (failure) => failure.errorText === 'net::ERR_ABORTED',
      );
      return consoleErrors.filter((error) => {
        if (isIgnorableConsoleError(error)) return false;
        if (!isAbortedSessionConsoleError(error)) return true;
        // Playwright exposes the request metadata in message.text(), not as a
        // request identifier. Pair tolerated console messages to aborted
        // session failures one-to-one by occurrence count.
        const match = unmatchedAborts.findIndex(() => true);
        if (match === -1) return true;
        unmatchedAborts.splice(match, 1);
        return false;
      });
    },
    invalidSessionFailures() {
      return requestFailures.filter(
        (failure) => failure.errorText !== 'net::ERR_ABORTED',
      );
    },
    invalidSessionResponses() {
      return responses.filter((response) => response.status >= 400);
    },
    hasError() {
      return (
        observer.unmatchedSessionErrors().length > 0 ||
        observer.invalidSessionFailures().length > 0 ||
        observer.invalidSessionResponses().length > 0
      );
    },
  };

  return observer;
}
