import { renderBirthdayEmail } from './birthday-email';

describe('renderBirthdayEmail', () => {
  const appOrigin = 'https://birthdly.example';

  it('includes each reminder line and a localized link to the configured calendar', () => {
    const title = 'Ближайшие дни рождения';
    const body = 'Сегодня: Анна\nЗавтра: Олег';

    const html = renderBirthdayEmail(title, body, 'ru', appOrigin);

    expect(html).toContain('lang="ru"');
    expect(html).toContain(title);
    expect(html).toContain('Сегодня: Анна');
    expect(html).toContain('Завтра: Олег');
    expect(html).toContain(`href="${appOrigin}/"`);
    expect(html).toContain('Открыть календарь');
  });

  it('escapes special characters in the title and birthday names', () => {
    const html = renderBirthdayEmail('Birthdays <today> & tomorrow', `Today: <Anna> & "O'Neil"`, 'en', appOrigin);

    expect(html).toContain('Birthdays &lt;today&gt; &amp; tomorrow');
    expect(html).toContain('Today: &lt;Anna&gt; &amp; &quot;O&#39;Neil&quot;');
    expect(html).not.toContain('<Anna>');
  });
});
