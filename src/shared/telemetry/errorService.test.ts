import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorService } from './errorService';

describe('errorService', () => {
  beforeEach(() => {
    errorService.init({ enabled: true, environment: 'test' });
  });

  it('should capture errors without throwing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Test error');
    
    expect(() => {
      errorService.captureError(err, { action: 'test-action' });
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('should capture messages without throwing', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    expect(() => {
      errorService.captureMessage('Test message', 'info', { action: 'test-message' });
    }).not.toThrow();

    consoleLogSpy.mockRestore();
  });

  it('should set user and context correctly', () => {
    errorService.setUser({ id: 'user-123', email: 'test@example.com' });
    errorService.setTag('release', 'v1.0.0');
    errorService.setContext('session', { role: 'admin' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      errorService.captureError('Something failed', { channelId: 'chan-1' });
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});
