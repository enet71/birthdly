import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BirthdayDto } from '@birthday/shared-models';
import { AuthUser, CurrentUser } from '@birthday/api-auth';
import { BirthdaysService } from './birthdays.service';
import { BIRTHDAY_PHOTO_FIELD, BIRTHDAY_PHOTO_MAX_BYTES } from './constants';
import { createBirthdaySchema, updateBirthdaySchema } from './schemas';
import { UploadedPhoto } from './types';

// The signed-in user's birthdays. Invalid bodies fail zod parsing; the API answers that with 400.
@Controller('birthdays')
export class BirthdaysController {
  constructor(private readonly birthdaysService: BirthdaysService) {}

  @Get()
  public list(@CurrentUser() user: AuthUser): Promise<BirthdayDto[]> {
    return this.birthdaysService.list(user.id);
  }

  @Post()
  public create(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<BirthdayDto> {
    return this.birthdaysService.create(user.id, createBirthdaySchema.parse(body));
  }

  @Patch(':id')
  public update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown): Promise<BirthdayDto> {
    return this.birthdaysService.update(user.id, id, updateBirthdaySchema.parse(body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public delete(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.birthdaysService.delete(user.id, id);
  }

  // Only the one file part is accepted; a larger file is answered with 413 by multer.
  @Put(':id/photo')
  @UseInterceptors(FileInterceptor(BIRTHDAY_PHOTO_FIELD, { limits: { fileSize: BIRTHDAY_PHOTO_MAX_BYTES, files: 1, fields: 0, parts: 1 } }))
  public setPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() photo: UploadedPhoto | undefined,
  ): Promise<BirthdayDto> {
    if (!photo) {
      throw new BadRequestException(`The "${BIRTHDAY_PHOTO_FIELD}" file is required`);
    }
    return this.birthdaysService.setPhoto(user.id, id, photo.buffer);
  }

  @Delete(':id/photo')
  public removePhoto(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<BirthdayDto> {
    return this.birthdaysService.removePhoto(user.id, id);
  }
}
