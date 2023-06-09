import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import { User } from '../account/entities/account.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUserDto } from '../account/dto/login-account.dto';

type UserWithoutAuthMsg = Omit<Omit<User, 'password'>, 'refreshToken'>;

@Injectable()
export class AuthService {
  constructor(
    private userService: AccountService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<null | UserWithoutAuthMsg> {
    const existUser = await this.userService.findByUsername(username);

    if (!existUser) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, existUser.password);

    if (!isMatch) {
      return null;
    }
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      password: ignorePass,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      refreshToken: ignoreRefreshToken,
      ...restUser
    } = existUser;

    return restUser;
  }

  async generateAccessToken(user: UserWithoutAuthMsg) {
    const payload = {
      username: user.username,
      sub: user.id,
      admin: user.admin,
    };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(userWAM: UserWithoutAuthMsg) {
    const payload = { username: userWAM.username, sub: userWAM.id };
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRESIN,
    });
    const user = await this.userService.findOne(userWAM.id);
    user.refreshToken = refreshToken;
    await this.userService.update(user.id, user);
    return refreshToken;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Verify and decode the Refresh Token
      const decodedPayload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Find the account by ID
      const user = await this.userService.findOne(decodedPayload.sub);
      // Check if the account exists and the Refresh Token matches
      if (user && user.refreshToken === refreshToken) {
        // Generate a new Access Token
        return this.generateAccessToken(user);
      } else {
        throw new Error('Invalid Refresh Token');
      }
    } catch (error) {
      throw new Error('Invalid Refresh Token');
    }
  }

  async login(loginUser: LoginUserDto) {
    const user = await this.userService.findByUsername(loginUser.username);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...restUser } = user;
    return {
      accessToken: await this.generateAccessToken(restUser),
      refreshToken: await this.generateRefreshToken(restUser),
      user: restUser,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decodedToken = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.userService.findOne(decodedToken.sub);
      return {
        accessToken: await this.refreshAccessToken(refreshToken),
        refreshToken: await this.generateRefreshToken(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
