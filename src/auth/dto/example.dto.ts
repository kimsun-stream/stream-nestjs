import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const ExampleCredentialSchema = z.object({
  id: z.coerce.number(),
});

export class ExampleDto extends createZodDto(ExampleCredentialSchema) {}
