import { querySettingsEntries } from "./notion-settings.js";

const SETTING_NAMES = {
  waterGoal: "Daily Water Goal",
  proteinGoal: "Daily Protein Goal",
  walkingGoal: "Daily Walking Goal",
  readingGoal: "Reading Goal",
  calorieGoal: "Daily Calories",
  fiberGoal: "Daily Fiber Goal"
};

const DEFAULT_SETTINGS = {
  waterGoal: 72,
  proteinGoal: 70,
  walkingGoal: 2,
  readingGoal: 40,
  calorieGoal: 1800,
  fiberGoal: 25
};

function getPlainText(richText = []) {
  if (!Array.isArray(richText)) {
    return "";
  }

  return richText
    .map((item) => item?.plain_text || "")
    .join("")
    .trim();
}

function getSettingName(page) {
  const property = page?.properties?.Setting;

  if (!property) {
    return "";
  }

  if (property.type === "title") {
    return getPlainText(property.title);
  }

  return "";
}

function getSettingValue(page) {
  const property = page?.properties?.Value;

  if (!property || property.type !== "number") {
    return null;
  }

  const value = Number(property.number);

  return Number.isFinite(value) ? value : null;
}

export async function getSettings() {
  const pages = await querySettingsEntries({
    pageSize: 100
  });

  const settingsByName = new Map();

  for (const page of pages) {
    const name = getSettingName(page);
    const value = getSettingValue(page);

    if (name && value !== null) {
      settingsByName.set(name, value);
    }
  }

  const settings = {};

  for (const [key, notionName] of Object.entries(
    SETTING_NAMES
  )) {
    settings[key] =
      settingsByName.get(notionName) ??
      DEFAULT_SETTINGS[key];
  }

  return settings;
}
