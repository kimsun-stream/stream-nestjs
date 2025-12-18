import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const SendMessageSchema = z.object({
  streamId: z.number(),
  message: z.string(),
  token: z.string(),
});

const GetMessagesSchema = z.object({
  streamId: z.number(),
  limit: z.number(),
  nextCursor: z.date(),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {}
export class GetMessagesDto extends createZodDto(GetMessagesSchema) {}
