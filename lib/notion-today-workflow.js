/* =========================================================
   MICHAELA OS
   Today’s Workflow
   Powered by Tasks
   ========================================================= */

import {
  queryTaskEntries
} from "./notion-tasks.js";

import {
  WORK_STATUSES,
  getDisplayDate,
  getEasternDateString,
  isDraftingStatus,
  isWorkTask,
  normalizeValue,
  parseWorkTask,
  sortWorkItems
} from "./notion-work-parser.js";

function groupWorkflowItems(
  items,
  today
) {
  const sections = {
    toDraft: [],
    readyToSchedule: [],
    scheduled: []
  };

  for (const item of items) {
    if (!isWorkTask(item)) {
      continue;
    }

    const status =
      normalizeValue(
        item.status
      );

    const dueDate =
      item.draftDate
        ?.slice(0, 10) ||
      item.sendDate
        ?.slice(0, 10) ||
      null;

    /*
     * Overdue and current unfinished drafting work stays
     * visible until its status moves forward.
     */
    if (
      isDraftingStatus(
        status
      ) &&
      dueDate &&
      dueDate <= today
    ) {
      sections.toDraft.push(
        item
      );

      continue;
    }

    if (
      status ===
      WORK_STATUSES.readyToSchedule
    ) {
      sections.readyToSchedule.push(
        item
      );

      continue;
    }

    if (
      status ===
      WORK_STATUSES.scheduled
    ) {
      sections.scheduled.push(
        item
      );
    }
  }

  return {
    toDraft:
      sortWorkItems(
        sections.toDraft
      ),

    readyToSchedule:
      sortWorkItems(
        sections.readyToSchedule
      ),

    scheduled:
      sortWorkItems(
        sections.scheduled
      )
  };
}

export async function getTodayWorkflow() {
  const today =
    getEasternDateString();

  /*
   * Pull all Tasks, then filter in JavaScript.
   *
   * This is intentionally resilient to Notion select/status
   * property differences and keeps personal tasks out through
   * the Area = Work check in isWorkTask().
   */
  const pages =
    await queryTaskEntries();

  const items =
    pages.map(
      parseWorkTask
    );

  const sections =
    groupWorkflowItems(
      items,
      today
    );

  const counts = {
    toDraft:
      sections.toDraft.length,

    readyToSchedule:
      sections.readyToSchedule.length,

    scheduled:
      sections.scheduled.length
  };

  counts.total =
    counts.toDraft +
    counts.readyToSchedule +
    counts.scheduled;

  return {
    success: true,

    date:
      today,

    dateLabel:
      getDisplayDate(),

    sections,

    counts
  };
}
