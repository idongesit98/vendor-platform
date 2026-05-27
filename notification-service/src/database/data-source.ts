import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { register } from 'tsconfig-paths';
import { compilerOptions } from '../../tsconfig.json';

register({
  baseUrl: './',
  paths: compilerOptions.paths,
});

dotenv.config({ path: '.env.docker' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
});
