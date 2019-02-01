import * as kue from "kue";

import {
  SCRAPE_SHOWS_JOB_NAME,
  SCRAPE_SHOW_CAST_JOB_NAME,
  SAVE_OR_UPDATE_SHOW_JOB_NAME,
  scrapeShowsJob,
  scrapeShowCastJob,
  saveOrUpdateShowJob
} from "./jobs";

const queue = kue.createQueue();

queue.process(SCRAPE_SHOWS_JOB_NAME, scrapeShowsJob(queue));

/**
 * Scrapes show's cast and creates a job to save/update it in DB
 */
queue.process(SCRAPE_SHOW_CAST_JOB_NAME, scrapeShowCastJob(queue));

queue.process(SAVE_OR_UPDATE_SHOW_JOB_NAME, saveOrUpdateShowJob());
