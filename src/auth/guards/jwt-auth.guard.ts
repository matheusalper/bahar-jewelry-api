import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Faz 2'de 'jwt' stratejisi strategies/jwt.strategy.ts içinde tanımlanacak
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
