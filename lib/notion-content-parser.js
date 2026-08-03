/* =========================================================
   MICHAELA OS
   Compatibility Layer:
   Old Content Parser → New Work Parser
   ========================================================= */

export {
  normalizeValue,
  getEasternDateString,
  getDisplayDate,
  parseWorkTask as parseContentPage,
  sortWorkItems as sortContentItems
} from "./notion-work-parser.js";
