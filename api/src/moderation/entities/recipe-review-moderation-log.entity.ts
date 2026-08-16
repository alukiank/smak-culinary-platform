import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { RecipeReview } from '../../recipe-review/entities/recipe-review.entity';
import { User } from '../../user/entities/user.entity';
import { ModerationDecision } from '../enums/moderation-decision.enum';

@Entity('recipe_review_moderation_logs')
export class RecipeReviewModerationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ModerationDecision,
  })
  decision: ModerationDecision;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'float', nullable: true })
  aiConfidenceScore: number;

  @ManyToOne(() => RecipeReview, { onDelete: 'CASCADE' })
  review: RecipeReview;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  admin: User;

  @CreateDateColumn()
  createdAt: Date;
}
