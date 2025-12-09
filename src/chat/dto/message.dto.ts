import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const MessageSchema = z.object({
  roomId: z.string(),
  message: z.string(),
  token: z.string().optional(),
});

export class MessageDto extends createZodDto(MessageSchema) {}
