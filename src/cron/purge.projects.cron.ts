import * as ProjectDAL from "@dal/project.dal";
import { Logger } from "@utils/logger";
import { isDevEnvironment } from "@config/config";
import { CronJob } from "cron";

type PurgeStatus = {
  removed: boolean;
  count: number;
};

async function _purgeSoftDeletedProjects(): Promise<PurgeStatus> {
  const MAX_DAYS = 90; //  90 days = 3 months.....
  const MAX_DAYS_IN_MILLISECONDS = isDevEnvironment()
    ? new Date(Date.now() - 10 * 60 * 1000) // 10 minutes older records.....
    : new Date(Date.now() - MAX_DAYS * 60 * 60 * 24 * 1000);

  const count = await ProjectDAL.purgeAllProjects(MAX_DAYS_IN_MILLISECONDS);
  return { count: count, removed: count > 0 };
}

async function _purgeDormantProjects(): Promise<PurgeStatus> {
  const MAX_DAYS = 7; //  7 days...
  const MAX_DAYS_IN_MILLISECONDS = isDevEnvironment()
    ? new Date(Date.now() - 60 * 60 * 1000) // 1 hour older records.....
    : new Date(Date.now() - MAX_DAYS * 60 * 60 * 24 * 1000);

  const count = await ProjectDAL.purgeDormantProjects(MAX_DAYS_IN_MILLISECONDS);
  return { count: count, removed: count > 0 };
}

// *Runs daily at 12:00am......
// *for development 3 minutes.....
const CRON_EXPRESSION = isDevEnvironment() ? "*/180 * * * * *" : "0 0 0 * * *";

const PurgingCronJob = new CronJob(CRON_EXPRESSION, async () => {
  Logger.info("Purging cron job inititated!");

  const softDeletedProjects = await _purgeSoftDeletedProjects();
  const dormantProjects = await _purgeDormantProjects();

  if (softDeletedProjects.removed) {
    Logger.info(`Purged soft deleted projects${softDeletedProjects.count} projects!`);
  }

  if (dormantProjects.removed) {
    Logger.info(`Purged dormant projects${dormantProjects.count} projects!`);
  }

  Logger.info("Purging cron job finished");
});

PurgingCronJob.start();
