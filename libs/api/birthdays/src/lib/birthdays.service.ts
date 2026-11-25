import { BadRequestException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { BirthdayDto, CreateBirthdayRequest, UpdateBirthdayRequest } from '@birthday/shared-models';
import { birthdays, DATABASE, Database } from '@birthday/api-database';
import { PhotoStorageService } from '@birthday/api-storage';
import { BirthdayChangesListener } from './changes';
import { BIRTHDAY_PHOTO_CONTENT_TYPE } from './constants';

const BIRTHDAY_COLUMNS = {
  id: birthdays.id,
  name: birthdays.name,
  birthDate: birthdays.birthDate,
  relationship: birthdays.relationship,
  notes: birthdays.notes,
  photoKey: birthdays.photoKey,
};

type BirthdayRow = Omit<BirthdayDto, 'photoUrl'> & { photoKey: string | null };

// Every query is limited to the signed-in user's rows: the API connects as the database owner, without row-level
// security, so this filter is what keeps users apart.
@Injectable()
export class BirthdaysService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly changesListener: BirthdayChangesListener,
    private readonly photoStorage: PhotoStorageService,
  ) {}

  public async list(userId: string): Promise<BirthdayDto[]> {
    const rows = await this.db.select(BIRTHDAY_COLUMNS).from(birthdays).where(eq(birthdays.userId, userId)).orderBy(asc(birthdays.createdAt));

    return Promise.all(rows.map((row: BirthdayRow) => this.toDto(row)));
  }

  public async create(userId: string, request: CreateBirthdayRequest): Promise<BirthdayDto> {
    const [birthday] = await this.db
      .insert(birthdays)
      .values({ userId, name: request.name, birthDate: request.birthDate, relationship: request.relationship, notes: request.notes })
      .returning(BIRTHDAY_COLUMNS);

    await this.changesListener.birthdayChanged({ userId, birthdayId: birthday.id, deletedGoogleEventId: null });
    return this.toDto(birthday);
  }

  // Another user's birthday answers like a missing one, so its existence is not revealed. Only a new name or date is
  // reported: notes and relationship stay in Birthdly.
  public async update(userId: string, id: string, request: UpdateBirthdayRequest): Promise<BirthdayDto> {
    const { birthday, isVisibleChange } = await this.db.transaction(async (tx) => {
      const [before] = await tx
        .select({ name: birthdays.name, birthDate: birthdays.birthDate })
        .from(birthdays)
        .where(and(eq(birthdays.id, id), eq(birthdays.userId, userId)))
        .for('update');
      const [updated] = await tx
        .update(birthdays)
        .set({ name: request.name, birthDate: request.birthDate, relationship: request.relationship, notes: request.notes })
        .where(and(eq(birthdays.id, id), eq(birthdays.userId, userId)))
        .returning(BIRTHDAY_COLUMNS);

      return { birthday: updated, isVisibleChange: before?.name !== updated?.name || before?.birthDate !== updated?.birthDate };
    });

    if (!birthday) {
      throw new NotFoundException();
    }
    if (isVisibleChange) {
      await this.changesListener.birthdayChanged({ userId, birthdayId: id, deletedGoogleEventId: null });
    }
    return this.toDto(birthday);
  }

  // Deleting a birthday that is already gone succeeds, so a repeated delete from two devices is not an error.
  public async delete(userId: string, id: string): Promise<void> {
    const [deleted] = await this.db
      .delete(birthdays)
      .where(and(eq(birthdays.id, id), eq(birthdays.userId, userId)))
      .returning({ googleEventId: birthdays.googleEventId, photoKey: birthdays.photoKey });

    if (deleted) {
      await this.changesListener.birthdayChanged({ userId, birthdayId: id, deletedGoogleEventId: deleted.googleEventId });
      await this.deletePhotoObject(deleted.photoKey);
    }
  }

  // Every photo gets a new key, so a browser never shows a cached old photo. The new object is stored before the row
  // points to it, and the replaced one is deleted after.
  public async setPhoto(userId: string, id: string, photo: Buffer): Promise<BirthdayDto> {
    this.assertPhotosEnabled();
    if (!isWebp(photo)) {
      throw new BadRequestException('The photo must be a WebP image');
    }
    await this.assertBirthdayExists(userId, id);

    const photoKey = `users/${userId}/birthdays/${id}/${randomUUID()}.webp`;

    await this.photoStorage.put(photoKey, photo, BIRTHDAY_PHOTO_CONTENT_TYPE);
    const result = await this.replacePhotoKey(userId, id, photoKey);

    if (!result) {
      await this.photoStorage.delete(photoKey);
      throw new NotFoundException();
    }
    await this.deletePhotoObject(result.previousPhotoKey);
    return this.toDto(result.birthday);
  }

  public async removePhoto(userId: string, id: string): Promise<BirthdayDto> {
    this.assertPhotosEnabled();

    const result = await this.replacePhotoKey(userId, id, null);

    if (!result) {
      throw new NotFoundException();
    }
    await this.deletePhotoObject(result.previousPhotoKey);
    return this.toDto(result.birthday);
  }

  // The photo is not part of the Google sync, so changing it keeps `updated_at`, which the sync compares with changes
  // in Google.
  private replacePhotoKey(
    userId: string,
    id: string,
    photoKey: string | null,
  ): Promise<{ birthday: BirthdayRow; previousPhotoKey: string | null } | null> {
    return this.db.transaction(async (tx) => {
      const [before] = await tx
        .select({ photoKey: birthdays.photoKey })
        .from(birthdays)
        .where(and(eq(birthdays.id, id), eq(birthdays.userId, userId)))
        .for('update');

      if (!before) {
        return null;
      }

      const [birthday] = await tx
        .update(birthdays)
        .set({ photoKey, updatedAt: sql`${birthdays.updatedAt}` })
        .where(and(eq(birthdays.id, id), eq(birthdays.userId, userId)))
        .returning(BIRTHDAY_COLUMNS);

      return { birthday, previousPhotoKey: before.photoKey };
    });
  }

  // Checks that the birthday exists before the photo is uploaded to the storage.
  private async assertBirthdayExists(userId: string, id: string): Promise<void> {
    const [birthday] = await this.db
      .select({ id: birthdays.id })
      .from(birthdays)
      .where(and(eq(birthdays.id, id), eq(birthdays.userId, userId)));

    if (!birthday) {
      throw new NotFoundException();
    }
  }

  private async deletePhotoObject(photoKey: string | null): Promise<void> {
    if (photoKey) {
      await this.photoStorage.delete(photoKey);
    }
  }

  private assertPhotosEnabled(): void {
    if (!this.photoStorage.isEnabled) {
      throw new ServiceUnavailableException('Photos are not available');
    }
  }

  private async toDto({ photoKey, ...birthday }: BirthdayRow): Promise<BirthdayDto> {
    const photoUrl = photoKey && this.photoStorage.isEnabled ? await this.photoStorage.getUrl(photoKey) : null;

    return { ...birthday, photoUrl };
  }
}

// A WebP file starts with `RIFF`, four bytes of size, and `WEBP`.
function isWebp(file: Buffer): boolean {
  return file.length > 12 && file.toString('ascii', 0, 4) === 'RIFF' && file.toString('ascii', 8, 12) === 'WEBP';
}
