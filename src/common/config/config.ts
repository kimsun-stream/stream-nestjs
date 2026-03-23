export default () => ({
  SERVER_PORT: process.env.SERVER_PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  FRONT_URL: process.env.FRONT_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
});
