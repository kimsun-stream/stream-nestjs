import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const RegisterSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string(),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
