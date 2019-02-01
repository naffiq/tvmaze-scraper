import * as mongoose from "mongoose";

export const MONGO_CONNECT_URL =
  process.env.MONGO_CONNECT_URL || "mongodb://127.0.0.1:27017/tvmaze-scraper";

export default mongoose.connect(
  MONGO_CONNECT_URL,
  {
    useNewUrlParser: true
  },
  err => {
    if (err) {
      throw err;
    }
    console.log("mongo connection is set up");

    // get the default connection
    const connection = mongoose.connection;

    // bind connection to error event (to get notification of connection errors)
    connection.on(
      "error",
      console.error.bind(console, "MongoDB connection error:")
    );
  }
);
