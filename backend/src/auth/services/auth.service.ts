import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = user._id.toString();
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }


  async createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ): Promise<Omit<User, 'passwordHash'> & { id: string }> {
    const existingUser = await this.userRepository.existsByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await this.userRepository.create({
      email,
      passwordHash,
      name,
      role,
    });

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async getUserById(
    id: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }
    return {
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async getAllUsers(): Promise<UserDocument[]> {
    return this.userRepository.findAll();
  }
}
