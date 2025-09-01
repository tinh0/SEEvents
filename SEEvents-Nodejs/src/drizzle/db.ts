import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema.js";
import mysql from "mysql2/promise";
export const db = drizzle({ logger: true, connection: { uri: process.env.DATABASE_URL }});