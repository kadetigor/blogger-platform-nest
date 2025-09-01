import { Extension } from '../domain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';

export type ErrorResponseBody = {
  errorsMessages: Array<{
    field: string;
    message: string;
  }>;
};
