import { 
  PipeTransform, 
  ArgumentMetadata, 
  BadRequestException,
  Injectable 
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    
    if (errors.length > 0) {
      const errorsMessages = errors.map(error => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', ')
      }));
      
      throw new BadRequestException({ errorsMessages });
    }
    
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}