import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Check,
} from 'typeorm';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { User } from '../../user/entities/user.entity';
import { ModerationDecision } from '../enums/moderation-decision.enum';

@Entity('recipe_moderation_logs')
@Check(`"aiConfidenceScore" >= 0 AND "aiConfidenceScore" <= 1`)
export class RecipeModerationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
  recipe: Recipe;

  @ManyToOne(() => User, { nullable: true })
  admin: User;

  @Column({ type: 'enum', enum: ModerationDecision })
  decision: ModerationDecision;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'float', nullable: true })
  aiConfidenceScore: number;

  @CreateDateColumn()
  createdAt: Date;
}
