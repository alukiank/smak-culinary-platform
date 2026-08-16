import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '123456qQ',
  database: process.env.DB_NAME || 'cooking_catalog_db',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/infrastructure/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_history',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
