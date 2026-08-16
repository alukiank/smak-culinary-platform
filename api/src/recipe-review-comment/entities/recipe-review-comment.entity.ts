import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { RecipeReview } from '../../recipe-review/entities/recipe-review.entity';

@Entity('recipe_review_comments')
export class RecipeReviewComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  text: string;

  @ManyToOne(() => User, (user) => user.recipeReviewComments, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => RecipeReview, (review) => review.comments, {
    onDelete: 'CASCADE',
  })
  review: RecipeReview;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
