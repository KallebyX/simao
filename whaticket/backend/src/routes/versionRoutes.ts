import { Router } from "express";

import * as VersionController from "../controllers/VersionController";

const versionRouter = Router();

versionRouter.get("/version", VersionController.index);
versionRouter.post("/version", VersionController.store);

export default versionRouter;
