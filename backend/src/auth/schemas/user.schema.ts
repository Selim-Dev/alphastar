import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../../database/base.schema';

export type UserDocument = User & Document;

export enum UserRole {
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

@Schema(baseSchemaOptions)
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.Viewer })
  role: UserRole;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Note: unique index on email is already created by the @Prop({ unique: true }) decorator
