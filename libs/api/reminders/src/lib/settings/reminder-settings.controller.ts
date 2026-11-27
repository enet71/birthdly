import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Put } from '@nestjs/common';
import { ReminderScheduleDto, ReminderSettingsDto } from '@birthday/shared-models';
import { AuthUser, CurrentUser } from '@birthday/api-auth';
import { devicePreferencesSchema, reminderLocaleSchema, saveReminderScheduleSchema } from '../schemas';
import { ReminderSettingsService } from './reminder-settings.service';

@Controller('reminders/settings')
export class ReminderSettingsController {
  constructor(private readonly settingsService: ReminderSettingsService) {}

  @Get('schedule')
  public getSchedule(@CurrentUser() user: AuthUser): Promise<ReminderScheduleDto> {
    return this.settingsService.getSchedule(user.id);
  }

  @Put('schedule')
  public saveSchedule(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<ReminderScheduleDto> {
    const { schedule, preferences } = saveReminderScheduleSchema.parse(body);
    return this.settingsService.saveSchedule(user.id, schedule, preferences);
  }

  @Get()
  public get(@CurrentUser() user: AuthUser): Promise<ReminderSettingsDto | null> {
    return this.settingsService.get(user.id);
  }

  @Put('device')
  public saveDevicePreferences(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<ReminderSettingsDto> {
    return this.settingsService.saveDevicePreferences(user.id, devicePreferencesSchema.parse(body));
  }

  @Patch('locale')
  @HttpCode(HttpStatus.NO_CONTENT)
  public saveLocale(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<void> {
    return this.settingsService.saveLocale(user.id, reminderLocaleSchema.parse(body).locale);
  }
}
