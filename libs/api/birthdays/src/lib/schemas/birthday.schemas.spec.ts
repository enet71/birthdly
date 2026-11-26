import { createBirthdaySchema, updateBirthdaySchema } from './birthday.schemas';

const BIRTHDAY = { name: 'Ada Lovelace', birthDate: '1815-12-10' };

describe('createBirthdaySchema', () => {
  it('accepts the celebrity relationship', () => {
    const result = createBirthdaySchema.safeParse({ ...BIRTHDAY, relationship: 'celebrity' });

    expect(result.success).toBe(true);
    expect(result.data?.relationship).toBe('celebrity');
  });

  it('rejects an unknown relationship', () => {
    expect(createBirthdaySchema.safeParse({ ...BIRTHDAY, relationship: 'idol' }).success).toBe(false);
  });
});

describe('updateBirthdaySchema', () => {
  it('accepts a change to the celebrity relationship', () => {
    const result = updateBirthdaySchema.safeParse({ relationship: 'celebrity' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ relationship: 'celebrity' });
  });

  it('rejects an unknown relationship', () => {
    expect(updateBirthdaySchema.safeParse({ relationship: 'idol' }).success).toBe(false);
  });
});
