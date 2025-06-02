import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';


// Загружаем переменные окружения из .env в этой же папке
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Когда мы запускаем CLI снаружи Docker, DB_HOST="db" не резолвится.
// Меняем на localhost, если видим «db»
const rawHost = process.env.DB_HOST;
const hostEnv = rawHost === 'db' ? 'localhost' : rawHost;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: hostEnv,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/src/entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  synchronize: false,
});
