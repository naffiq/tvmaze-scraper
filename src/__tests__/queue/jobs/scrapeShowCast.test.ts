import "mocha";
import * as kue from "kue";
import * as fetchMock from "fetch-mock";
import { expect } from "chai";

import { mockShows } from "../../mock/shows";

import {
  pushScrapeShowCastToQueue,
  SCRAPE_SHOW_CAST_JOB_NAME,
  scrapeShowCastJob,
  SAVE_OR_UPDATE_SHOW_JOB_NAME
} from "../../../queue/jobs";
import { mockCast } from "../../mock/cast";

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

describe("Scrape show cast job", () => {
  it("should push scrape-show-cast job to the queue", () => {
    pushScrapeShowCastToQueue(queue, {
      show: mockShows[0],
      page: 0
    });
    expect(queue.testMode.jobs.length).to.equal(1);

    const job = queue.testMode.jobs[0];
    expect(job.type).to.equal(SCRAPE_SHOW_CAST_JOB_NAME);
  });

  it("should push scrape-show-cast jobs to the queue when scraped show cast", function(done) {
    this.timeout(3000);
    fetchMock.get("http://api.tvmaze.com/shows/1/cast", {
      status: 200,
      body: mockCast
    });

    scrapeShowCastJob(queue)(
      {
        data: {
          show: mockShows[0],
          page: 0
        }
      } as kue.Job,
      () => {
        expect(queue.testMode.jobs.length).to.equal(1);

        // Save show
        expect(queue.testMode.jobs[0].type).to.equal(
          SAVE_OR_UPDATE_SHOW_JOB_NAME
        );
        expect(queue.testMode.jobs[0].data.show.id).to.equal(1);
        expect(queue.testMode.jobs[0].data.page).to.equal(0);
        expect(queue.testMode.jobs[0].data.cast.length).to.equal(
          mockCast.length
        );

        done();
      }
    );
  });

  it("should reschedule scrape-show-cast", function(done) {
    this.timeout(3000);
    fetchMock.get("http://api.tvmaze.com/shows/1/cast", 429);

    scrapeShowCastJob(queue)(
      {
        data: {
          show: mockShows[0],
          page: 0
        }
      } as kue.Job,
      () => {
        expect(queue.testMode.jobs.length).to.equal(1);

        // Job should be rescheduled
        expect(queue.testMode.jobs[0].type).to.equal(SCRAPE_SHOW_CAST_JOB_NAME);
        expect(queue.testMode.jobs[0].data.page).to.equal(0);
        expect(queue.testMode.jobs[0].data.show.id).to.equal(mockShows[0].id);

        done();
      }
    );
  });
});
