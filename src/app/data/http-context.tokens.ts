import { HttpContextToken } from '@angular/common/http';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);