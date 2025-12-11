import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const SendMessageSchema = z.object({
  roomId: z.string(),
  message: z.string(),
  token: z.string().optional(),
});

const GetMessagesSchema = z.object({
  roomId: z.string(),
  limit: z.number(),
  cursor: z.date().optional(),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {}
export class GetMessagesDto extends createZodDto(GetMessagesSchema) {}
