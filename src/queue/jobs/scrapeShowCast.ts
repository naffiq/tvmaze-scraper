import { Queue, Job, DoneCallback } from "kue";
import { Show } from "../../scraper/interface";
import { pushSaveOrUpdateShowToQueue } from "./saveOrUpdateShow";
import { scrapeShowCast } from "../../scraper";

export const SCRAPE_SHOW_CAST_JOB_NAME = "scrape-show-cast";

/**
 * Creates job that will parse
 **/
export const pushScrapeShowCastToQueue = (
  queue: Queue,
  data: { show: Show; page: number },
  delay?: number
) => {
  const job = queue.createJob(SCRAPE_SHOW_CAST_JOB_NAME, data);

  if (delay) {
    job.delay(delay);
  }

  return job.save(err => {
    if (!err) {
      console.log(`Created job #${job.id} (${SCRAPE_SHOW_CAST_JOB_NAME})`);
    } else {
      console.error("Error!\n", err);
    }
  });
};

export const scrapeShowCastJob = (queue: Queue) => async (
  job: Job,
  done: DoneCallback
) => {
  const { show, page } = job.data;

  try {
    const cast = await scrapeShowCast(show.id);
    pushSaveOrUpdateShowToQueue(queue, { show, cast, page });
  } catch (err) {
    if (err.httpStatus === 429) {
      console.warn("Exceeded request limit, retrying...");
      pushScrapeShowCastToQueue(queue, job.data, 500);
    }
  }
  done();
};
