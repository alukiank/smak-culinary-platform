import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';

export class UpdateRecipeStatusDto {
  @ApiProperty({
    description: 'The new status of the recipe',
    enum: RecipeStatusEnum,
    example: RecipeStatusEnum.PUBLIC,
  })
  @IsEnum(RecipeStatusEnum, {
    message: 'Status must be a valid RecipeStatusEnum value',
  })
  status: RecipeStatusEnum;
}
