import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  Index,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { DifficultyEnum } from '../enums/recipe-difficulty.enum';
import { CookSpeedEnum } from '../enums/recipe-cook-speed.enum';
import { RecipeVector } from './recipe-vector.entity';
import { User } from '../../user/entities/user.entity';
import { RecipeStatusEnum } from '../enums/recipe-status.enum';
import { RecipeReview } from '../../recipe-review/entities/recipe-review.entity';
import { TasteEnum } from '../enums/recipe-taste.enum';
import { CuisineEnum } from '../enums/recipe-cuisine.enum';
import { CategoryEnum } from '../enums/recipe-category.enum';
import { RecipeCollection } from '../../recipe-collection/entities/recipe-collection.entity';

@Entity('recipes')
@Check(`"healthScore" <= 100 AND "healthScore" >= 0`)
@Check(`"rating" <= 5 AND "rating" >= 0`)
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'text' })
  title: string;

  @Index()
  @Column({
    type: 'enum',
    enum: CategoryEnum,
  })
  category: CategoryEnum;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', array: true, default: [] })
  ingredients: string[];

  @Column({ type: 'text', array: true, default: [] })
  directions: string[];

  @Column({ type: 'enum', enum: CookSpeedEnum, default: CookSpeedEnum.MEDIUM })
  cookSpeed: CookSpeedEnum;

  @Column({ type: 'int', nullable: true })
  prepTime: number;

  @Column({ type: 'int', nullable: true })
  cookTime: number;

  @Column({
    type: 'enum',
    enum: DifficultyEnum,
    default: DifficultyEnum.MEDIUM,
  })
  difficulty: DifficultyEnum;

  @Index('idx_recipes_cuisune_search_gin', { synchronize: false })
  @Column({
    type: 'enum',
    enum: CuisineEnum,
    array: true,
    default: [],
  })
  cuisineList: CuisineEnum[];

  @Index('idx_recipes_tastes_search_gin', { synchronize: false })
  @Column({
    type: 'enum',
    enum: TasteEnum,
    array: true,
    default: [],
  })
  tastes: TasteEnum[];

  @Index() @Column({ default: false }) isVegan: boolean;
  @Index() @Column({ default: false }) isVegetarian: boolean;
  @Index() @Column({ default: false }) isGluten_free: boolean;
  @Index() @Column({ default: false }) isHalal: boolean;
  @Index() @Column({ default: false }) isKosher: boolean;
  @Index() @Column({ default: false }) isDairyFree: boolean;
  @Index() @Column({ default: false }) isNutFree: boolean;

  @Column({ type: 'int', nullable: true })
  healthScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: RecipeStatusEnum,
    default: RecipeStatusEnum.DRAFT,
  })
  status: RecipeStatusEnum;

  @Column({ type: 'float', nullable: true })
  rating: number;

  @Column({ type: 'int', nullable: true })
  numRatings: number;

  @Column({ type: 'text', nullable: true })
  coverImageId: string;

  @Column({ type: 'text', array: true, default: [] })
  galleryImageIds: string[];

  @Column({ type: 'text', nullable: true })
  youtubeVideoUrl: string;

  @ManyToOne(() => User, (user) => user.recipes, {
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => RecipeReview, (review) => review.recipe)
  recipeReviews: RecipeReview[];

  @OneToOne(() => RecipeVector, (vector) => vector.recipe)
  vector: RecipeVector;

  @ManyToMany(() => RecipeCollection, (collection) => collection.recipes)
  collections: RecipeCollection[];
}
