import { Global, Module } from '@nestjs/common';
import { PhotoStorageService } from './services';
import { ConfigurableModuleClass } from './storage.module-definition';

@Global()
@Module({
  providers: [PhotoStorageService],
  exports: [PhotoStorageService],
})
export class StorageModule extends ConfigurableModuleClass {}
