import { queryContentEntries } from "./notion-content.js";

import {
  getDisplayDate,
  getEasternDateString,
  normalizeValue,
  parseContentPage,
  sortContentItems
} from "./notion-content-parser.js";

const STATUS = {
  WAITING_ON_CLIENT: "waiting on client",
  INTERNAL_REVIEW: "internal review",
  REVISIONS: "revisions"
};

function groupApprovalItems(items) {
  const sections = {
    waitingOnClient: [],
    internalReview: [],
    revisions: []
  };

  items.forEach((item) => {
    const status = normalizeValue(item.status);

    if (status === STATUS.WAITING_ON_CLIENT) {
      sections.waitingOnClient.push(item);
      return;
    }

    if (status === STATUS.INTERNAL_REVIEW) {
      sections.internalReview.push(item);
      return;
    }

    if (status === STATUS.REVISIONS) {
      sections.revisions.push(item);
    }
  });

  return {
    waitingOnClient: sortContentItems(
      sections.waitingOnClient
    ),
    internalReview: sortContentItems(
      sections.internalReview
    ),
    revisions: sortContentItems(sections.revisions)
  };
}

export async function getApprovalSummary() {
  const today = getEasternDateString();

  const pages = await queryContentEntries();

  const items = pages.map(parseContentPage);
  const sections = groupApprovalItems(items);

  const counts = {
    waitingOnClient: sections.waitingOnClient.length,
    internalReview: sections.internalReview.length,
    revisions: sections.revisions.length
  };

  counts.total =
    counts.waitingOnClient +
    counts.internalReview +
    counts.revisions;

  return {
    success: true,
    date: today,
    dateLabel: getDisplayDate(),
    sections,
    counts
  };
}
