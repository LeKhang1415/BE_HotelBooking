import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/constants/auth.constants';
import { UserRole } from 'src/module/users/enum/user-role.enum';

export const Roles = (...userRole: UserRole[]) =>
  SetMetadata(ROLES_KEY, userRole);
