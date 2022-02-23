const seriesRouter = require("express").Router();
const sqlite3 = require("sqlite3");
const issuesRouter = require("./issues");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

seriesRouter.get("/", (_req, res, next) => {
  db.all("SELECT * FROM Series", (error, series) => {
    if (error) {
      next(error);
      return;
    }
    res.status(200).send({ series });
  });
});

seriesRouter.param("seriesId", (req, res, next, seriesId) => {
  db.get(
    "SELECT * FROM Series WHERE Series.id=$seriesId",
    {
      $seriesId: seriesId,
    },
    (error, row) => {
      if (error) {
        next(error);
        return;
      } else if (row) {
        req.series = row;
        next();
        return;
      } else {
        res.sendStatus(404);
      }
    }
  );
});

seriesRouter.get("/:seriesId", (req, res) => {
  res.status(200).send({ series: req.series });
});

seriesRouter.post("/", (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    return res.sendStatus(400);
  }
  const values = {
    $name: name,
    $description: description,
  };

  db.run(
    "INSERT INTO Series (name, description) VALUES ($name, $description)",
    values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(
          `SELECT * FROM Series ORDER BY Series.id DESC LIMIT 1`,
          (error, series) => {
            if (error) {
              next(error);
            } else {
              res.status(201).json({ series });
            }
          }
        );
      }
    }
  );
});

seriesRouter.put("/:seriesId", (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    return res.sendStatus(400);
  }
  const values = {
    $name: name,
    $description: description,
    $seriesId: req.params.seriesId,
  };

  db.run(
    `UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId`,
    values,
    (error) => {
      if (error) {
        next(error);
        return;
      } else {
        db.get(
          `SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`,
          (error, series) => {
            if (error) {
              next(error);
              return;
            } else {
              res.status(200).send({ series });
            }
          }
        );
      }
    }
  );
});

seriesRouter.delete("/:seriesId", (req, res, next) => {
  db.all(
    `SELECT * FROM Issue WHERE Issue.series_id = $seriesId`,
    { $seriesId: req.params.seriesId },
    (error, rows) => {
      if (error) {
        next(error);
        return;
      } else if (rows.length) {
        res.sendStatus(400);
      } else {
        db.run(
          `DELETE FROM Series WHERE Series.id = ${req.params.seriesId}`,
          (error) => {
            if (error) {
              next(error);
              return;
            } else {
              res.sendStatus(204);
            }
          }
        );
      }
    }
  );
});

seriesRouter.use("/:seriesId/issues", issuesRouter);

module.exports = seriesRouter;
