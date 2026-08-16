import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Recipe } from '../../recipe/entities/recipe.entity';

@Entity('recipe_collections')
export class RecipeCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToMany(() => Recipe)
  @JoinTable({
    name: 'recipe_collection_items',
    joinColumn: { name: 'collectionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'recipeId', referencedColumnName: 'id' },
  })
  recipes: Recipe[];
}
