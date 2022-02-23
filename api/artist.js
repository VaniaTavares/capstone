const artistRouter = require("express").Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

artistRouter.get("/", (_req, res, next) => {
  db.all(
    "SELECT * FROM Artist WHERE Artist.is_currently_employed=1",
    (error, rows) => {
      if (error) {
        next(error);
      }
      res.status(200).send({ artists: rows });
    }
  );
});

module.exports = artistRouter;
