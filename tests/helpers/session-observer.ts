import type { Page } from '@playwright/test';

const SESSION_PATH = '/api/auth/session';
const CLIENT_FETCH_ERROR = '[next-auth][error][CLIENT_FETCH_ERROR]';

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
        if (!isAbortedSessionConsoleError(error)) return true;
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
