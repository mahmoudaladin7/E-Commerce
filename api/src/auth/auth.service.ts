import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async login(email: string, password: string) {
    const user = await this.users.findWithHashByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email, user.role);
  }
  private async issueTokens(
    userId: string,
    email: string,
    role: 'ADMIN' | 'CUSTOMER',
  ) {
    const accessPayload = { sub: userId, email, role };
    const refreshPayload = {
      sub: userId,
      email,
      role,
      typ: 'refresh' as const,
    };

    const access = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '900s'),
    } as any);
    const refresh = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d'),
    } as any);

    return { accessToken: access, refreshToken: refresh };
  }
  async refresh(refreshToken: string) {
    // verify throws if invalid/expired
    const decoded = await this.jwt.verifyAsync<{
      sub: string;
      email: string;
      role: 'ADMIN' | 'CUSTOMER';
      typ?: string;
    }>(refreshToken, { secret: this.config.get<string>('JWT_REFRESH_SECRET') });
    if (decoded.typ !== 'refresh')
      throw new UnauthorizedException('Invalid token type');

    return this.issueTokens(decoded.sub, decoded.email, decoded.role);
  }
}
