import "mocha";
import * as kue from "kue";
import * as fetchMock from "fetch-mock";
import { expect } from "chai";
import {
  pushScrapeShowsToQueue,
  SCRAPE_SHOWS_JOB_NAME,
  SCRAPE_SHOW_CAST_JOB_NAME
} from "../../../queue/jobs";

import { mockShows } from "../../mock/shows";
import { scrapeShowsJob } from "../../../queue/jobs/scrapeShows";

const queue = kue.createQueue({
  disableSearch: true
});

before(function() {
  queue.testMode.enter();
});

afterEach(function() {
  fetchMock.reset();
  queue.testMode.clear();
});

after(function() {
  queue.testMode.exit();
  console.log("Shutting down queue");

  queue.shutdown(0, () => {
    console.log("Queue shut down");
  });
});

describe("Scrape shows job", () => {
  it("should push scrape-shows job to the queue", () => {
    pushScrapeShowsToQueue(queue, 0);
    expect(queue.testMode.jobs.length).to.equal(1);

    const job = queue.testMode.jobs[0];
    expect(job.type).to.equal(SCRAPE_SHOWS_JOB_NAME);
  });

  it("should push scrape-show-cast jobs to the queue when scraped shows list", function(done) {
    this.timeout(3000);
    fetchMock.get("http://api.tvmaze.com/shows?page=0", {
      status: 200,
      body: mockShows
    });

    scrapeShowsJob(queue)(
      {
        data: {
          page: 0
        }
      } as kue.Job,
      () => {
        expect(queue.testMode.jobs.length).to.equal(2);

        // First is scrape cast
        expect(queue.testMode.jobs[0].type).to.equal(SCRAPE_SHOW_CAST_JOB_NAME);
        expect(queue.testMode.jobs[0].data.show.id).to.equal(1);

        // Second is scrape next page
        expect(queue.testMode.jobs[1].type).to.equal(SCRAPE_SHOWS_JOB_NAME);
        expect(queue.testMode.jobs[1].data.page).to.equal(1);

        done();
      }
    );
  });

  it("should reschedule scrape-shows", function(done) {
    this.timeout(3000);
    fetchMock.get("http://api.tvmaze.com/shows?page=0", 429);

    scrapeShowsJob(queue)(
      {
        data: {
          page: 0
        }
      } as kue.Job,
      () => {
        expect(queue.testMode.jobs.length).to.equal(1);

        // Job should be rescheduled
        expect(queue.testMode.jobs[0].type).to.equal(SCRAPE_SHOWS_JOB_NAME);
        expect(queue.testMode.jobs[0].data.page).to.equal(0);

        done();
      }
    );
  });
});
