import * as express from "express";
import ShowModel from "./model";

const showsRouter = express.Router();

showsRouter.get("/", async (req, res) => {
  const page = Number(req.query.page) || 0;
  res.send(
    await ShowModel.find({
      page
    }).lean()
  );
});

export default showsRouter;
