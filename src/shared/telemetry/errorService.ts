export type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

export interface ErrorContext {
  userId?: string;
  workspaceId?: string;
  channelId?: string;
  route?: string;
  action?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TelemetryOptions {
  dsn?: string;
  environment?: string;
  enabled?: boolean;
  sampleRate?: number;
}

class ErrorTelemetryService {
  private enabled: boolean = true;
  private environment: string = typeof import.meta !== 'undefined' && import.meta.env?.MODE ? import.meta.env.MODE : 'development';
  private currentUser: { id: string; email?: string; workspaceId?: string } | null = null;
  private globalContext: Record<string, unknown> = {};
  private globalTags: Record<string, string> = {};
  private initialized = false;

  public init(options: TelemetryOptions = {}) {
    if (this.initialized) return;
    const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;
    const envTelemetry = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_TELEMETRY === 'true';
    
    this.enabled = options.enabled ?? (isProd || envTelemetry);
    this.environment = options.environment || (typeof import.meta !== 'undefined' && import.meta.env?.MODE) || 'development';
    this.initialized = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          action: 'window.onerror',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Unhandled Promise Rejection'));
        this.captureError(error, {
          action: 'window.unhandledrejection',
        });
      });
    }
  }

  public setUser(user: { id: string; email?: string; workspaceId?: string } | null) {
    this.currentUser = user;
  }

  public setTag(key: string, value: string) {
    this.globalTags[key] = value;
  }

  public setContext(key: string, context: Record<string, unknown>) {
    this.globalContext[key] = context;
  }

  public captureError(error: unknown, context?: ErrorContext) {
    const err = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
    const payload = {
      level: 'error' as LogLevel,
      name: err.name,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      user: this.currentUser,
      tags: { ...this.globalTags, ...(context?.tags || {}) },
      context: { ...this.globalContext, ...context },
    };

    if (this.environment === 'development' || !this.enabled) {
      console.error('[ErrorTelemetry]', payload);
    }

    this.sendToSink('error', payload);
  }

  public captureMessage(message: string, level: LogLevel = 'info', context?: ErrorContext) {
    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      user: this.currentUser,
      tags: { ...this.globalTags, ...(context?.tags || {}) },
      context: { ...this.globalContext, ...context },
    };

    if (this.environment === 'development' || !this.enabled) {
      const logFn = level === 'error' || level === 'fatal' ? console.error : level === 'warn' ? console.warn : console.log;
      logFn(`[ErrorTelemetry:${level}]`, payload);
    }

    this.sendToSink('message', payload);
  }

  private sendToSink(type: 'error' | 'message', payload: unknown) {
    if (!this.enabled) return;
    try {
      const endpoint = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEMETRY_ENDPOINT;
      if (endpoint && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, JSON.stringify({ type, payload }));
      }
    } catch (err) {
      console.warn('[ErrorTelemetry] Failed to send telemetry payload:', err);
    }
  }
}

export const errorService = new ErrorTelemetryService();
