import { PartialType } from '@nestjs/swagger';
import { CreateRecipeDto } from './recipe-create.dto';

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}
