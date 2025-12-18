import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const GetStreamsSchema = z.object({
  limit: z.number().default(20),
  cursor: z.number().default(0),
});

const CreateStreamSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const UpdateStreamSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export class GetStreamsDto extends createZodDto(GetStreamsSchema) {}
export class CreateStreamDto extends createZodDto(CreateStreamSchema) {}
export class UpdateStreamDto extends createZodDto(UpdateStreamSchema) {}
