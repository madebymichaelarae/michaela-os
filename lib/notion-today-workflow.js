import { queryContentEntries } from "./notion-content.js";

import {
  getDisplayDate,
  getEasternDateString,
  normalizeValue,
  parseContentPage,
  sortContentItems
} from "./notion-content-parser.js";

const STATUS = {
  TODO: "todo",
  READY_TO_SCHEDULE: "ready to schedule",
  SCHEDULED: "scheduled"
};

function groupWorkflowItems(items, today) {
  const sections = {
    toDraft: [],
    readyToSchedule: [],
    scheduled: []
  };

  items.forEach((item) => {
    const status = normalizeValue(item.status);
    const draftDate = item.draftDate?.slice(0, 10);

    /*
     * Only Todo entries due today or earlier belong
     * in the drafting section.
     */
    if (
      status === STATUS.TODO &&
      draftDate &&
      draftDate <= today
    ) {
      sections.toDraft.push(item);
      return;
    }

    if (status === STATUS.READY_TO_SCHEDULE) {
      sections.readyToSchedule.push(item);
      return;
    }

    if (status === STATUS.SCHEDULED) {
      sections.scheduled.push(item);
    }
  });

  return {
    toDraft: sortContentItems(sections.toDraft),
    readyToSchedule: sortContentItems(
      sections.readyToSchedule
    ),
    scheduled: sortContentItems(sections.scheduled)
  };
}

export async function getTodayWorkflow() {
  const today = getEasternDateString();

  /*
   * queryContentEntries remains the single source of truth
   * for communicating with Notion.
   */
  const pages = await queryContentEntries();

  const items = pages.map(parseContentPage);
  const sections = groupWorkflowItems(items, today);

  const counts = {
    toDraft: sections.toDraft.length,
    readyToSchedule: sections.readyToSchedule.length,
    scheduled: sections.scheduled.length
  };

  counts.total =
    counts.toDraft +
    counts.readyToSchedule +
    counts.scheduled;

  return {
    success: true,
    date: today,
    dateLabel: getDisplayDate(),
    sections,
    counts
  };
}
