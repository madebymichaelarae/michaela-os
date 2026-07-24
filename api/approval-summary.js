import { getApprovalSummary } from "../lib/notion-approval-summary.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed."
    });
  }

  try {
    const approvalSummary = await getApprovalSummary();

    /*
     * Approval statuses can change frequently, so this
     * endpoint should always request fresh Notion data.
     */
    response.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");

    return response.status(200).json(approvalSummary);
  } catch (error) {
    console.error("Approval summary error:", error);

    return response.status(500).json({
      success: false,
      error: "Unable to load the approval summary.",
      details:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}
