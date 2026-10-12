import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const connectionString = process.env.DATABASE_URL || `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`;

// creates an SQL connection using our env variables
export const sql = neon(connectionString);

// this sql function we export is used as a tagged template literal, which allows us to write SQL queries safely