import { SetMetadata } from '@nestjs/common';
import { AUTH_TYPE_KEY } from '../constants/auth.constants';
import { AuthType } from 'src/module/auth/enums/auth-type.enum';

export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authTypes);
