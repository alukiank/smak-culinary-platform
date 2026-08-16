import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Message } from './message.entity';
import { Recipe } from '../../recipe/entities/recipe.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @ManyToOne(() => Recipe, { nullable: true, onDelete: 'SET NULL' })
  recipe: Recipe | null;

  @Column({ type: 'uuid', nullable: true })
  recipeId: string | null;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
