import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isGreaterThan', async: false })
export class IsGreaterThanConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];

    if (value === undefined || relatedValue === undefined) return true;

    return (
      typeof value === 'number' &&
      typeof relatedValue === 'number' &&
      value >= relatedValue
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be greater than or equal to ${args.constraints[0]}`;
  }
}

export function IsGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsGreaterThanConstraint,
    });
  };
}
