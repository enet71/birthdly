import { ConfigurableModuleBuilder } from '@nestjs/common';
import { CelebritiesModuleOptions } from './types';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<CelebritiesModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
