import postgres, { Sql } from 'postgres';


const connectionKey = process.env.DATABASE_URL;

if(!connectionKey) {
    throw Error("Empty key");
}

console.log(connectionKey);
const sql: Sql = postgres(connectionKey);

export default sql;
