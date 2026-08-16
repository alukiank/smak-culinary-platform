import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { RecipeReviewComment } from '../../recipe-review-comment/entities/recipe-review-comment.entity';

@Entity('recipe_reviews')
@Check(`"rating" >= 1 AND "rating" <= 5`)
@Unique('UQ_USER_RECIPE_REVIEW', ['user', 'recipe'])
export class RecipeReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'text', nullable: true })
  imageId: string;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ default: true })
  isPublished: boolean;

  @ManyToOne(() => User, (user) => user.recipeReviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Recipe, (recipe) => recipe.recipeReviews, {
    onDelete: 'CASCADE',
  })
  recipe: Recipe;

  @OneToMany(() => RecipeReviewComment, (comment) => comment.review)
  comments: RecipeReviewComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
