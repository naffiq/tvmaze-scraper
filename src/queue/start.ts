import * as kue from "kue";
import { pushScrapeShowsToQueue } from "./jobs";

const queue = kue.createQueue();

pushScrapeShowsToQueue(queue, 0, null, () => process.exit());
