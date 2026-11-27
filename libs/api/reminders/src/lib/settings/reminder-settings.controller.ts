import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Put } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReminderScheduleResponse, ReminderSettingsDto } from '@birthday/shared-models';
import { AuthUser, CurrentUser } from '@birthday/api-auth';
import { devicePreferencesSchema, reminderLocaleSchema, saveReminderScheduleSchema } from '../schemas';
import { ReminderSettingsService } from './reminder-settings.service';

@Controller('reminders/settings')
export class ReminderSettingsController {
  constructor(
    private readonly settingsService: ReminderSettingsService,
    private readonly config: ConfigService,
  ) {}

  @Get('schedule')
  public async getSchedule(@CurrentUser() user: AuthUser): Promise<ReminderScheduleResponse> {
    const schedule = await this.settingsService.getSchedule(user.id);
    return { ...schedule, emailAvailable: this.emailAvailable };
  }

  @Put('schedule')
  public async saveSchedule(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<ReminderScheduleResponse> {
    const { schedule, preferences } = saveReminderScheduleSchema.parse(body);
    const saved = await this.settingsService.saveSchedule(user.id, schedule, preferences);
    return { ...saved, emailAvailable: this.emailAvailable };
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

  private get emailAvailable(): boolean {
    return Boolean(this.config.get('BREVO_API_KEY') && this.config.get('BREVO_SENDER_EMAIL'));
  }
}
