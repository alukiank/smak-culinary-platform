import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeModerationLog } from '../entities/recipe-moderation-log.entity';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { User } from '../../user/entities/user.entity';
import { ModerationDecision } from '../enums/moderation-decision.enum';
import { ModerateRecipeDto } from '../dto/moderate-recipe.dto';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';
import { RecipeService } from '../../recipe/recipe.service';

@Injectable()
export class RecipeModerationService {
  constructor(
    @InjectRepository(RecipeModerationLog)
    private readonly logRepo: Repository<RecipeModerationLog>,
    private readonly recipeService: RecipeService,
  ) {}

  async createLog(
    recipe: Recipe,
    decision: ModerationDecision,
    reason?: string,
    aiConfidence?: number,
    admin?: User,
  ): Promise<RecipeModerationLog> {
    const log = this.logRepo.create({
      recipe,
      decision,
      reason,
      aiConfidenceScore: aiConfidence,
      admin,
    });
    return await this.logRepo.save(log);
  }

  async getLogs(recipeId: string): Promise<RecipeModerationLog[]> {
    return await this.logRepo.find({
      where: { recipe: { id: recipeId } },
      order: { createdAt: 'DESC' },
      relations: ['admin'],
    });
  }

  async moderateByAdmin(
    recipeId: string,
    adminId: string,
    dto: ModerateRecipeDto,
  ): Promise<RecipeModerationLog> {
    const recipe = await this.recipeService.findOne(recipeId);

    if (recipe.status !== RecipeStatusEnum.MODERATION) {
      throw new BadRequestException(
        'This recipe is not pending human moderation',
      );
    }

    const newStatus =
      dto.decision === ModerationDecision.APPROVED
        ? RecipeStatusEnum.PUBLIC
        : RecipeStatusEnum.REJECTED;

    await this.recipeService.updateStatus(recipe.id, newStatus);

    return await this.createLog(
      recipe,
      dto.decision,
      dto.reason || 'Approved by Admin',
      1.0,
      { id: adminId } as User,
    );
  }
}
