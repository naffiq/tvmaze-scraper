import { Queue, Job, DoneCallback } from "kue";
import { scrapeShowsPage } from "../../scraper";
import { pushScrapeShowCastToQueue } from "./scrapeShowCast";

export const SCRAPE_SHOWS_JOB_NAME = "scrape-shows";

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
 * Scrapes shows on page.
 * For each show creates job that will parse it's cast.
 * All of the jobs created are delayed to prevent limit issues.
 */
export const scrapeShowsJob = (queue: Queue) => async (
  job: Job,
  done: DoneCallback
) => {
  const { page } = job.data;
  console.log(`Fetching shows on page ${page}...`);

  try {
    const shows = await scrapeShowsPage(page);
    // shows.forEach((show, index) => {});
    console.log(`Fetched ${shows.length} shows on page ${page}`);

    shows.forEach((show, index) => {
      const delayToPreventLimits = (index + 1) * 500;
      pushScrapeShowCastToQueue(
        queue,
        {
          show,
          page
        },
        delayToPreventLimits
      );
    });

    /**
     * Delaying next job until all of the casts for shows are scraped
     * to prevent rate limiting issues
     */
    const estimatedCastScrapeTime = (shows.length + 1) * 500;
    pushScrapeShowsToQueue(queue, page + 1, estimatedCastScrapeTime);
  } catch (err) {
    // When page doesn't exist it means queue is over
    if (err.httpStatus === 404) console.log("Queue is over");

    /**
     * @tutorial https://www.tvmaze.com/api#rate-limiting
     */
    if (err.httpStatus === 429) {
      console.warn("Exceeded request limit, retrying...");
      pushScrapeShowsToQueue(queue, page, 500);
    }
  }
  done();
};
