import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
};
