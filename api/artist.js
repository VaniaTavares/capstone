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
        return;
      }
      res.status(200).send({ artists: rows });
    }
  );
});

artistRouter.param("artistId", (req, res, next, artistId) => {
  db.get(
    "SELECT * FROM Artist WHERE Artist.id=$artistId",
    {
      $artistId: artistId,
    },
    (error, row) => {
      if (error) {
        next(error);
        return;
      } else if (row) {
        req.artist = row;
        next();
        return;
      } else {
        res.sendStatus(404);
      }
    }
  );
});

artistRouter.get("/:artistId", (req, res) => {
  res.status(200).send({ artist: req.artist });
});

artistRouter.post("/", (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  if (!name || !dateOfBirth || !biography) {
    return res.sendStatus(400);
  }
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

  const values = {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed,
  };

  db.run(
    "INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)",
    values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(
          `SELECT * FROM Artist ORDER BY Artist.id DESC LIMIT 1`,
          (error, artist) => {
            if (error) {
              next(error);
            } else {
              res.status(201).json({ artist: artist });
            }
          }
        );
      }
    }
  );
});

artistRouter.put("/:artistId", (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  if (!name || !dateOfBirth || !biography) {
    return res.sendStatus(400);
  }
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  const values = {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed,
    $artistId: req.params.artistId,
  };

  db.run(
    `UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId`,
    values,
    (error) => {
      if (error) {
        next(error);
        return;
      } else {
        db.get(
          `SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
          (error, artist) => {
            if (error) {
              next(error);
              return;
            } else {
              res.status(200).send({ artist });
            }
          }
        );
      }
    }
  );
});

artistRouter.delete("/:artistId", (req, res, next) => {
  db.run(
    `UPDATE Artist set is_currently_employed = 0 WHERE Artist.id = ${req.params.artistId}`,
    (error) => {
      if (error) {
        next(error);
        return;
      } else {
        db.get(
          `SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
          (error, artist) => {
            if (error) {
              next(error);
              return;
            } else {
              res.status(200).send({ artist });
            }
          }
        );
      }
    }
  );
});

module.exports = artistRouter;
