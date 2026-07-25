import {
  getFinanceDataSourceNames,
  retrieveFinanceDataSource
} from "./notion-finance.js";

import {
  getFinanceHeader
} from "./finance/header.js";

import {
  getFinanceAccounts
} from "./finance/accounts.js";

import {
  getFinanceBudget
} from "./finance/budget.js";

import {
  getFinanceSinkingFunds
} from "./finance/sinking-funds.js";

import {
  getFinanceBills
} from "./finance/bills.js";

function simplifyProperty(
  property = {}
) {
  const simplified = {
    id: property.id || null,
    type:
      property.type ||
      "unknown"
  };

  if (property.name) {
    simplified.name =
      property.name;
  }

  if (
    property.type ===
      "select" &&
    Array.isArray(
      property.select?.options
    )
  ) {
    simplified.options =
      property.select.options.map(
        (option) =>
          option.name
      );
  }

  if (
    property.type ===
      "multi_select" &&
    Array.isArray(
      property.multi_select
        ?.options
    )
  ) {
    simplified.options =
      property.multi_select.options.map(
        (option) =>
          option.name
      );
  }

  if (
    property.type ===
      "status" &&
    Array.isArray(
      property.status?.options
    )
  ) {
    simplified.options =
      property.status.options.map(
        (option) =>
          option.name
      );
  }

  if (
    property.type ===
      "relation" &&
    property.relation
  ) {
    simplified.relation = {
      dataSourceId:
        property.relation
          .data_source_id ||
        null,

      databaseId:
        property.relation
          .database_id ||
        null,

      syncedPropertyName:
        property.relation
          .synced_property_name ||
        null,

      syncedPropertyId:
        property.relation
          .synced_property_id ||
        null
    };
  }

  if (
    property.type ===
      "number" &&
    property.number
  ) {
    simplified.numberFormat =
      property.number.format ||
      "number";
  }

  if (
    property.type ===
      "formula" &&
    property.formula
  ) {
    simplified.expression =
      property.formula
        .expression || null;
  }

  if (
    property.type ===
      "rollup" &&
    property.rollup
  ) {
    simplified.rollup = {
      relationPropertyName:
        property.rollup
          .relation_property_name ||
        null,

      rollupPropertyName:
        property.rollup
          .rollup_property_name ||
        null,

      function:
        property.rollup
          .function || null
    };
  }

  return simplified;
}

function simplifyDataSource(
  dataSource
) {
  const properties =
    Object.entries(
      dataSource.properties || {}
    ).reduce(
      (
        result,
        [
          propertyName,
          property
        ]
      ) => {
        result[propertyName] =
          simplifyProperty(
            property
          );

        return result;
      },
      {}
    );

  return {
    id: dataSource.id,

    name:
      dataSource.title
        ?.map(
          (item) =>
            item.plain_text
        )
        .join("")
        .trim() ||
      "Untitled",

    properties
  };
}

export async function getFinanceSchema() {
  const dataSourceNames =
    getFinanceDataSourceNames();

  const entries =
    await Promise.all(
      dataSourceNames.map(
        async (name) => {
          try {
            const dataSource =
              await retrieveFinanceDataSource(
                name
              );

            return [
              name,
              {
                success: true,
                ...simplifyDataSource(
                  dataSource
                )
              }
            ];
          } catch (error) {
            return [
              name,
              {
                success: false,

                error:
                  error.message ||
                  "Unable to retrieve data source."
              }
            ];
          }
        }
      )
    );

  return {
    success: true,

    schemas:
      Object.fromEntries(
        entries
      )
  };
}

export async function handleFinanceRequest(
  req
) {
  const view = String(
    req.query?.view ||
      "schema"
  )
    .trim()
    .toLowerCase();

  switch (view) {
    case "schema":
      return getFinanceSchema();

    case "header":
      return getFinanceHeader();

    case "accounts":
      return getFinanceAccounts();

    case "budget":
      return getFinanceBudget();

    case "sinking-funds":
    case "sinkingfunds":

      case "bills":
  return getFinanceBills();
      return getFinanceSinkingFunds();

      case "bills":
  return getFinanceBills();

    default:
      return {
        success: false,

        error:
          `Unknown finance view: ${view}`
      };
  }
}
