import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('recipe_vectors')
export class RecipeVector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'vector',
    length: 768,
    nullable: true,
  })
  embedding: number[];

  @OneToOne(() => Recipe, (recipe) => recipe.vector, { onDelete: 'CASCADE' })
  @JoinColumn()
  recipe: Recipe;
}
