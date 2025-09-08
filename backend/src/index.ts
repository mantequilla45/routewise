import express, { Request, Response } from 'express';

const app = express();

console.log("Testing")

app.get('/', (req : Request, res : Response) => {
    res.send('Hello TypeScript + Express');
});
