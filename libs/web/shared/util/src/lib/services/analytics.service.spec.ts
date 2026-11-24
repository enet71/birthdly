import type { Mock } from 'vitest';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Environment, ENVIRONMENT_TOKEN } from '../environment';
import { AnalyticsEventData } from '../types';
import { AnalyticsService } from './analytics.service';

type BeforeSend = (type: string, payload: Record<string, unknown>) => Record<string, unknown>;

interface FakeWindow {
  location: { hostname: string };
  umami?: { track: Mock<(event: string, data?: AnalyticsEventData) => void> };
  birthdlyAnalyticsBeforeSend?: BeforeSend;
}

interface FakeDocument {
  defaultView: FakeWindow | null;
  head: { appendChild: Mock<(node: Node) => Node> };
  createElement: (tagName: string) => HTMLElement;
}

interface SetupOptions {
  platform?: 'browser' | 'server';
  environmentName?: Environment['environmentName'];
  umamiWebsiteId?: string | null;
  hostname?: string;
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let fakeWindow: FakeWindow;
  let fakeDocument: FakeDocument;

  function setup({
    platform = 'browser',
    environmentName = 'production',
    umamiWebsiteId = 'website-id',
    hostname = 'birthdly.com',
  }: SetupOptions = {}): void {
    fakeWindow = { location: { hostname } };
    fakeDocument = {
      defaultView: fakeWindow,
      head: { appendChild: vi.fn((node: Node) => node) },
      createElement: (tagName: string) => document.createElement(tagName),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: fakeDocument },
        { provide: PLATFORM_ID, useValue: platform },
        { provide: ENVIRONMENT_TOKEN, useValue: { environmentName, umamiWebsiteId } as Environment },
      ],
    });

    service = TestBed.inject(AnalyticsService);
  }

  function appendedScripts(): HTMLScriptElement[] {
    return fakeDocument.head.appendChild.mock.calls.map(([node]: [Node]) => node as HTMLScriptElement);
  }

  function loadBeforeSend(): BeforeSend {
    setup();
    service.loadTracker();

    return fakeWindow.birthdlyAnalyticsBeforeSend as BeforeSend;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('loadTracker', () => {
    it('appends the Umami tracker script in production on birthdly.com', () => {
      setup();

      service.loadTracker();

      const scripts: HTMLScriptElement[] = appendedScripts();

      expect(scripts).toHaveLength(1);
      expect(scripts[0].tagName).toBe('SCRIPT');
      expect(scripts[0].getAttribute('src')).toBe('/m/m.js');
      expect(scripts[0].defer).toBe(true);
      expect(scripts[0].dataset['websiteId']).toBe('website-id');
      expect(scripts[0].dataset['beforeSend']).toBe('birthdlyAnalyticsBeforeSend');
    });

    it('defines the before-send function on window', () => {
      setup();

      service.loadTracker();

      expect(fakeWindow.birthdlyAnalyticsBeforeSend).toBeTypeOf('function');
    });

    it.each<[string, SetupOptions]>([
      ['on the server', { platform: 'server' }],
      ['outside production', { environmentName: 'development' }],
      ['without a website ID', { umamiWebsiteId: null }],
      ['on another hostname', { hostname: 'localhost' }],
    ])('loads nothing %s', (_case: string, options: SetupOptions) => {
      setup(options);

      service.loadTracker();

      expect(fakeDocument.head.appendChild).not.toHaveBeenCalled();
      expect(fakeWindow.birthdlyAnalyticsBeforeSend).toBeUndefined();
    });

    it('loads nothing without a window', () => {
      setup();
      fakeDocument.defaultView = null;

      service.loadTracker();

      expect(fakeDocument.head.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('before-send redaction', () => {
    it('replaces the invite token in every string field and empties the title on invite pages', () => {
      const beforeSend: BeforeSend = loadBeforeSend();

      const result: Record<string, unknown> = beforeSend('event', {
        url: 'https://birthdly.com/invite/secret-token?utm_source=share#top',
        referrer: '/invite/other-token',
        title: 'Add your birthday for Alice',
        hostname: 'birthdly.com',
      });

      expect(result).toEqual({
        url: 'https://birthdly.com/invite/:token?utm_source=share#top',
        referrer: '/invite/:token',
        title: '',
        hostname: 'birthdly.com',
      });
    });

    it('keeps the title when only the referrer is an invite page', () => {
      const beforeSend: BeforeSend = loadBeforeSend();

      const result: Record<string, unknown> = beforeSend('event', {
        url: '/people',
        referrer: '/invite/secret-token',
        title: 'People',
      });

      expect(result).toEqual({ url: '/people', referrer: '/invite/:token', title: 'People' });
    });

    it('leaves payloads of other pages unchanged', () => {
      const beforeSend: BeforeSend = loadBeforeSend();
      const payload: Record<string, unknown> = { url: '/people', referrer: '/', title: 'People' };

      expect(beforeSend('event', payload)).toEqual({ url: '/people', referrer: '/', title: 'People' });
    });

    it('keeps non-string fields as they are', () => {
      const beforeSend: BeforeSend = loadBeforeSend();
      const data: Record<string, unknown> = { count: 1 };

      const result: Record<string, unknown> = beforeSend('event', {
        url: '/invite/secret-token',
        screen: 1080,
        data,
        flag: true,
      });

      expect(result).toEqual({ url: '/invite/:token', screen: 1080, data, flag: true, title: '' });
      expect(result['data']).toBe(data);
    });
  });

  describe('track', () => {
    it('forwards the event to the Umami tracker', () => {
      setup();
      fakeWindow.umami = { track: vi.fn() };

      service.track('birthday_added', { source: 'people' });

      expect(fakeWindow.umami.track).toHaveBeenCalledWith('birthday_added', { source: 'people' });
    });

    it('drops the event when the tracker is not loaded', () => {
      setup();

      expect(() => service.track('sign_in')).not.toThrow();
    });
  });
});
