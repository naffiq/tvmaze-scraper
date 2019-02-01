import * as express from "express";

import "./config/mongoose";

import showsRouter from "./shows/router";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(showsRouter);

app.listen(PORT, () => {
  console.log(`App listening on ${PORT}`);
});
