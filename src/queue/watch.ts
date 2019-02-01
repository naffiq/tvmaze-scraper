import * as kue from "kue";

import { scrapeShowsPage, scrapeShowCast } from "../scraper";
import {
  SCRAPE_SHOWS_JOB_NAME,
  pushScrapeShowsToQueue,
  pushScrapeShowCastToQueue,
  SCRAPE_SHOW_CAST_JOB_NAME,
  pushSaveOrUpdateShowToQueue,
  SAVE_OR_UPDATE_SHOW_JOB_NAME
} from "./jobs";
import ShowModel from "../shows/model";
import { Cast } from "../scraper/interface";

const queue = kue.createQueue();

/**
 * Scrapes shows on page.
 * For each show creates job that will parse it's cast.
 * All of the jobs created are delayed to prevent limit issues.
 */
queue.process(SCRAPE_SHOWS_JOB_NAME, async (job, done) => {
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
});

/**
 * Scrapes show's cast and creates a job to save/update it in DB
 */
queue.process(SCRAPE_SHOW_CAST_JOB_NAME, async (job, done) => {
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
});

queue.process(SAVE_OR_UPDATE_SHOW_JOB_NAME, async (job, done) => {
  const { show, cast, page } = job.data;
  const { id, ...showFields } = show;

  const existingShow = await ShowModel.findOne({
    showId: id
  }).exec();
  const sortedCast = (cast as Cast[]).sort((castActorA, castActorB) =>
    castActorA.person.birthday > castActorB.person.birthday ? 1 : 0
  );

  if (existingShow) {
    console.log("Updating show", id);
    await existingShow
      .update({
        ...showFields,
        cast: sortedCast
      })
      .exec();
  } else {
    console.log("saving show", show.id);
    await ShowModel.create({
      showId: id,
      ...showFields,
      cast: sortedCast,
      page
    });
  }

  done();
});
