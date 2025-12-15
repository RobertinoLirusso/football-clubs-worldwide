import { APP_ID, ErrorHandler } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig = {
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    { provide: APP_ID, useValue: 'serverApp' }
  ]
};