import { Queue } from "kue";
import { Show, Cast } from "../../scraper/interface";
import ShowModel from "../../shows/model";

export const SAVE_OR_UPDATE_SHOW_JOB_NAME = "save-or-update-show";

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

export const saveOrUpdateShowJob = () => async (job, done) => {
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
};
