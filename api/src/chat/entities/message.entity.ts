import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Chat } from './chat.entity';
import { SenderRoleEnum } from '../enums/sender-role.enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SenderRoleEnum })
  role: SenderRoleEnum;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isInternal: boolean;

  @Column({ type: 'jsonb', nullable: true })
  toolData: {
    modelParts?: any[];
    functionResponses?: Array<{
      name: string;
      response: any;
    }>;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    recipes?: Array<{
      id: string;
      title: string;
      rating?: number;
      coverImageId?: string;
      cookTime?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      description?: string;
      category?: string;
    }>;
    feedback?: 'like' | 'dislike' | null;
    isError?: boolean;
    showDiets?: boolean;
    showAllergies?: boolean;
  } | null;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  chat: Chat;
}
