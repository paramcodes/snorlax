export interface TelemetryEvent {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class ErrorTelemetryService {
  private events: TelemetryEvent[] = [];
  private maxEvents = 100;

  captureException(error: unknown, context?: Record<string, unknown>) {
    const message = error instanceof Error ? error.message : String(error);
    const event: TelemetryEvent = {
      level: 'error',
      message,
      context: {
        ...(error instanceof Error ? { stack: error.stack } : {}),
        ...context,
      },
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    console.error('[Telemetry Error]', event);
  }

  captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info', context?: Record<string, unknown>) {
    const event: TelemetryEvent = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    if (level === 'error') {
      console.error('[Telemetry]', event);
    } else if (level === 'warn') {
      console.warn('[Telemetry]', event);
    } else {
      console.log('[Telemetry]', event);
    }
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

export const telemetry = new ErrorTelemetryService();
