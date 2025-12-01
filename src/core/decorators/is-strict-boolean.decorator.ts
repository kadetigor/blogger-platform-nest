import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrictBoolean(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrictBoolean',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'boolean';
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a boolean value`;
        },
      },
    });
  };
}