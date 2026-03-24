import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateRoomSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export class CreateRoomDto extends createZodDto(CreateRoomSchema) {}
