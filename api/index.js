const apiRouter = require("express").Router();
const artistRouter = require("./artist");

apiRouter.use("/artists", artistRouter);

module.exports = apiRouter;
