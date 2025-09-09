import 'dotenv/config';
import express, { Response, Request } from 'express';
import sql from './lib/sql';

const app = express();

const main = async () => {
    console.log("Testing DB connection...");

    const test = await sql`
        SELECT * 
        FROM "Test"
        WHERE id = ${1}
    `;

    app.get('/', (req: Request, res: Response) => {
        res.send(`Created at: ${test[0].created_at}`);
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

main();
