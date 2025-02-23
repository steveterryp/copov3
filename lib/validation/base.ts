import { z } from 'zod';

export class ValidationError extends Error {
  constructor(public errors: z.ZodError['errors']) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export abstract class BaseValidator<T> {
  constructor(protected schema: z.ZodType<T>) {}

  async validateData(data: unknown): Promise<T> {
    try {
      return await this.schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  }
}
