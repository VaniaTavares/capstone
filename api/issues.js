const issuesRouter = require("express").Router({ mergeParams: true });
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

issuesRouter.get("/", (req, res, next) => {
  db.all(
    `SELECT * FROM Issue WHERE Issue.series_id = ${req.params.seriesId}`,
    (error, issues) => {
      if (error) {
        next(error);
        return;
      } else {
        res.status(200).send({ issues });
      }
    }
  );
});

issuesRouter.post("/", (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  if (!name || !issueNumber || !publicationDate || !artistId) {
    return res.sendStatus(400);
  }

  const values = {
    $name: name,
    $issueNumber: issueNumber,
    $publicationDate: publicationDate,
    $artistId: artistId,
    $seriesId: req.params.seriesId,
  };

  db.run(
    "INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)",
    values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(
          `SELECT * FROM Issue ORDER BY Issue.id DESC LIMIT 1`,
          (error, issue) => {
            if (error) {
              next(error);
            } else {
              res.status(201).json({ issue });
            }
          }
        );
      }
    }
  );
});

issuesRouter.param("issueId", (req, res, next, issueId) => {
  db.get(
    `SELECT * FROM Issue WHERE Issue.id = $issueId`,
    { $issueId: issueId },
    (error, issue) => {
      if (error) {
        next(error);
        return;
      } else if (issue) {
        req.issue = issue;
        req.issueId = issueId;
        next();
        return;
      } else {
        res.sendStatus(404);
      }
    }
  );
});

issuesRouter.put("/:issueId", (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  if (!name || !issueNumber || !publicationDate || !artistId) {
    return res.sendStatus(400);
  }

  const values = {
    $name: name,
    $issueNumber: issueNumber,
    $publicationDate: publicationDate,
    $artistId: artistId,
    $seriesId: req.params.seriesId,
    $issueId: req.issueId,
  };

  db.run(
    "UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE Issue.series_id = $seriesId AND Issue.id = $issueId",
    values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(
          `SELECT * FROM Issue WHERE Issue.id = ${req.issueId}`,
          (error, issue) => {
            if (error) {
              next(error);
            } else {
              res.status(200).json({ issue });
            }
          }
        );
      }
    }
  );
});

issuesRouter.delete("/:issueId", (req, res, next) => {
  db.run(
    `DELETE FROM Issue WHERE Issue.id = ${req.params.issueId}`,
    (error) => {
      if (error) {
        next(error);
        return;
      } else res.sendStatus(204);
    }
  );
});

module.exports = issuesRouter;
