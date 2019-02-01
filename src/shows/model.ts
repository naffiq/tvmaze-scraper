import * as mongoose from "mongoose";

import { Cast } from "../scraper/interface";

// const CastSchema = new mongoose.Schema<Cast>({});

interface ShowModelInterface extends mongoose.Document {
  showId: number;
  url: string;
  name: string;
  cast: Cast[];
  page: number;
}

const ShowSchema = new mongoose.Schema({
  showId: {
    type: Number,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  cast: [Object],
  page: Number
});

export const ShowModel = mongoose.model<ShowModelInterface>("Show", ShowSchema);

export default ShowModel;
