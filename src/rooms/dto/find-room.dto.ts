import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const FindAllSchema = z.object({
  limit: z.coerce.number().catch(30),
  page: z.coerce.number().catch(1),
  isLive: z.coerce.boolean().catch(true),
  sort: z.enum(['view', 'recent']).catch('view'),
});

export class FindAllRoomDto extends createZodDto(FindAllSchema) {}
