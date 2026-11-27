import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';
import { DueUser } from '../types';
import { BirthdayNotificationsService } from './birthday-notifications.service';
import { BrevoEmailService } from './brevo-email.service';
import { DueNotificationsService } from './due-notifications.service';
import { UserPushService } from './user-push.service';

const BROWSER_REMINDER: DueUser = {
  userId: 'user-1',
  localDate: '2026-11-27',
  deliveryDate: '2026-11-27',
  minuteOfDay: 540,
  daysBefore: [0],
  email: null,
  locale: 'en',
};

const EMAIL_ADDRESS = 'reminder@example.com';
const EMAIL_REMINDER: DueUser = { ...BROWSER_REMINDER, daysBefore: [1], email: EMAIL_ADDRESS, locale: 'de' };

describe('BirthdayNotificationsService', () => {
  let moduleRef: TestingModule;
  let service: BirthdayNotificationsService;

  const due: {
    forgetOldDeliveries: Mock<DueNotificationsService['forgetOldDeliveries']>;
    claimDueUsers: Mock<DueNotificationsService['claimDueUsers']>;
    findBirthdaysAround: Mock<DueNotificationsService['findBirthdaysAround']>;
  } = { forgetOldDeliveries: vi.fn(), claimDueUsers: vi.fn(), findBirthdaysAround: vi.fn() };
  const browser: { pushToUser: Mock<UserPushService['pushToUser']> } = { pushToUser: vi.fn() };
  const email: { available: boolean; sendBirthdayReminder: Mock<BrevoEmailService['sendBirthdayReminder']> } = {
    available: true,
    sendBirthdayReminder: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    email.available = true;
    due.claimDueUsers.mockResolvedValue([]);
    browser.pushToUser.mockResolvedValue(2);
    email.sendBirthdayReminder.mockResolvedValue(1);

    moduleRef = await Test.createTestingModule({
      providers: [
        BirthdayNotificationsService,
        { provide: DueNotificationsService, useValue: due },
        { provide: UserPushService, useValue: browser },
        { provide: BrevoEmailService, useValue: email },
      ],
    }).compile();
    service = moduleRef.get(BirthdayNotificationsService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('uses browser push when email is unavailable', async () => {
    email.available = false;
    due.claimDueUsers.mockResolvedValueOnce([BROWSER_REMINDER]);
    due.findBirthdaysAround.mockResolvedValue([{ name: 'Anna', birthDate: '1990-11-27' }]);

    const sent = await service.sendDue(new AbortController().signal);

    expect(due.claimDueUsers).toHaveBeenCalledWith(expect.any(Number), false);
    expect(browser.pushToUser).toHaveBeenCalledWith('user-1', expect.objectContaining({ notification: expect.any(Object) }));
    expect(email.sendBirthdayReminder).not.toHaveBeenCalled();
    expect(sent).toBe(2);
  });

  it('sends each channel its own birthdays when both are due at the same time', async () => {
    due.claimDueUsers.mockResolvedValueOnce([BROWSER_REMINDER, EMAIL_REMINDER]);
    due.findBirthdaysAround.mockImplementation(async (_userId, _date, offsets) =>
      offsets.includes(0) ? [{ name: 'Anna', birthDate: '1990-11-27' }] : [{ name: 'Max', birthDate: '1990-11-28' }],
    );

    const sent = await service.sendDue(new AbortController().signal);

    expect(due.claimDueUsers).toHaveBeenCalledWith(expect.any(Number), true);
    expect(browser.pushToUser).toHaveBeenCalledExactlyOnceWith(
      'user-1',
      expect.objectContaining({ notification: expect.objectContaining({ body: 'Today: Anna' }) }),
    );
    expect(email.sendBirthdayReminder).toHaveBeenCalledExactlyOnceWith(
      EMAIL_ADDRESS,
      expect.objectContaining({ notification: expect.objectContaining({ body: 'Morgen: Max' }) }),
      'de',
    );
    expect(sent).toBe(3);
  });

  it('skips both channels when no birthday matches the reminder', async () => {
    due.claimDueUsers.mockResolvedValueOnce([BROWSER_REMINDER, EMAIL_REMINDER]);
    due.findBirthdaysAround.mockResolvedValue([{ name: 'Anna', birthDate: '1990-11-29' }]);

    const sent = await service.sendDue(new AbortController().signal);

    expect(browser.pushToUser).not.toHaveBeenCalled();
    expect(email.sendBirthdayReminder).not.toHaveBeenCalled();
    expect(sent).toBe(0);
  });
});
