import { Router } from "express";
import { RegisterController } from "../controllers/Auth/RegisterController";
import { LoginController } from "../controllers/Auth/LoginController";

const AuthRouter = Router();

AuthRouter.post('/register', RegisterController);
AuthRouter.post('/login', LoginController);

export default AuthRouter;