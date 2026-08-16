import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRoleEnum } from '../enums/user-role.enum';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { Exclude } from 'class-transformer';
import { Subscription } from '../../billing/entities/subscription.entity';
import { Payment } from '../../billing/entities/payment.entity';
import { RecipeReviewComment } from '../../recipe-review-comment/entities/recipe-review-comment.entity';
import { RecipeReview } from '../../recipe-review/entities/recipe-review.entity';
import { RecipeCollection } from '../../recipe-collection/entities/recipe-collection.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  displayname: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.USER })
  role: UserRoleEnum;

  @Column({ type: 'text', array: true, default: [], nullable: true })
  dietary: string[];

  @Column({ type: 'text', array: true, default: [], nullable: true })
  allergies: string[];

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Recipe, (recipe) => recipe.user)
  recipes: Recipe[];

  @OneToMany(() => RecipeReview, (review) => review.user)
  recipeReviews: RecipeReview[];

  @OneToMany(() => RecipeReviewComment, (comment) => comment.user)
  recipeReviewComments: RecipeReviewComment[];

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => RecipeCollection, (collection) => collection.user)
  collections: RecipeCollection[];
}
