import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateRoomSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  category: z.string().optional(),
});

export class UpdateRoomDto extends createZodDto(UpdateRoomSchema) {}
