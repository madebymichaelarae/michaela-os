export async function getFinanceHeader() {
  const today = new Date();

  let nextPayday = new Date(
    today.getFullYear(),
    today.getMonth(),
    15
  );

  if (today.getDate() > 15) {
    nextPayday = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      15
    );
  }

  const daysUntilPayday = Math.ceil(
    (nextPayday - today) / (1000 * 60 * 60 * 24)
  );

  return {
    success: true,

    header: {
      availableToSpend: 0,

      payday: {
        daysRemaining: daysUntilPayday,

        nextDate: nextPayday.toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric"
          }
        )
      },

      quote: "Keep working, Michaela."
    }
  };
}
