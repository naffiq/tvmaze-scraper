import { Queue } from "kue";
import { Show, Cast } from "../scraper/interface";

export const SCRAPE_SHOWS_JOB_NAME = "scrape-shows";
export const SCRAPE_SHOW_CAST_JOB_NAME = "scrape-show-cast";
export const SAVE_OR_UPDATE_SHOW_JOB_NAME = "save-or-update-show";

export const pushScrapeShowsToQueue = (
  queue: Queue,
  page: number,
  delay?: number,
  cb?: () => any
) => {
  const job = queue.createJob(SCRAPE_SHOWS_JOB_NAME, {
    page
  });

  if (delay) {
    job.delay(delay);
  }

  return job.save(err => {
    if (!err) {
      console.log(`Created job #${job.id}`);
    } else {
      console.error("Error!\n", err);
    }
    if (cb) {
      cb();
    }
  });
};

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

export const pushSaveOrUpdateShowToQueue = (
  queue: Queue,
  data: { show: Show; page: number; cast: Cast[] }
) => {
  const job = queue.createJob(SAVE_OR_UPDATE_SHOW_JOB_NAME, data).save(err => {
    if (!err) {
      console.log(`Created job #${job.id} (${SAVE_OR_UPDATE_SHOW_JOB_NAME})`);
    } else {
      console.error("Error!\n", err);
    }
  });

  return job;
};
