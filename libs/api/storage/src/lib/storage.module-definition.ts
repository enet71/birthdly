import { ConfigurableModuleBuilder } from '@nestjs/common';
import { StorageModuleOptions } from './types';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<StorageModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
