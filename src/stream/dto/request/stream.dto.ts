import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { StreamStatus } from '../stream-status';

const GetStreamsSchema = z.object({
  limit: z.number(),
  cursor: z.number(),
});

const CreateStreamSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const UpdateStreamSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  streamStatus: z.enum(StreamStatus).optional(),
});

export class GetStreamsDto extends createZodDto(GetStreamsSchema) {}
export class CreateStreamDto extends createZodDto(CreateStreamSchema) {}
export class UpdateStreamDto extends createZodDto(UpdateStreamSchema) {}
