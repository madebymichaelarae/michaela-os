/* =========================================================
   MICHAELA OS
   Approval Summary
   Powered by Tasks
   ========================================================= */

import {
  queryTaskEntries
} from "./notion-tasks.js";

import {
  WORK_STATUSES,
  getDisplayDate,
  getEasternDateString,
  isWorkTask,
  normalizeValue,
  parseWorkTask,
  sortWorkItems
} from "./notion-work-parser.js";

function groupApprovalItems(
  items
) {
  const sections = {
    waitingOnClient: [],
    internalReview: [],
    revisions: []
  };

  for (const item of items) {
    if (!isWorkTask(item)) {
      continue;
    }

    const status =
      normalizeValue(
        item.status
      );

    if (
      status ===
      WORK_STATUSES.clientReview
    ) {
      sections.waitingOnClient.push(
        item
      );

      continue;
    }

    if (
      status ===
      WORK_STATUSES.internalReview
    ) {
      sections.internalReview.push(
        item
      );

      continue;
    }

    if (
      status ===
      WORK_STATUSES.revisions
    ) {
      sections.revisions.push(
        item
      );
    }
  }

  return {
    waitingOnClient:
      sortWorkItems(
        sections.waitingOnClient
      ),

    internalReview:
      sortWorkItems(
        sections.internalReview
      ),

    revisions:
      sortWorkItems(
        sections.revisions
      )
  };
}

export async function getApprovalSummary() {
  const today =
    getEasternDateString();

  const pages =
    await queryTaskEntries();

  const items =
    pages.map(
      parseWorkTask
    );

  const sections =
    groupApprovalItems(
      items
    );

  const counts = {
    waitingOnClient:
      sections.waitingOnClient.length,

    internalReview:
      sections.internalReview.length,

    revisions:
      sections.revisions.length
  };

  counts.total =
    counts.waitingOnClient +
    counts.internalReview +
    counts.revisions;

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
