import express from 'express';
import router from './routes/DummyRoute';
import AuthRouter from './routes/AuthRoutes';
import cors from 'cors'

const app = express();

app.use(express.json());

app.use('/api/v1/dummy', router);
app.use('/auth', AuthRouter);
app.use(cors);


export default app;