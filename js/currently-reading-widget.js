* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  color: var(--text-primary, #40342e);
  background: var(--page-background, transparent);

  font-family: var(
    --font-body,
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif
  );
}

img {
  max-width: 100%;
}

.currently-reading-widget-shell {
  width: 100%;
  padding: 8px;
}

.currently-reading-card {
  width: 100%;
  min-width: 0;
  padding: 18px 20px 20px;

  color: inherit;

  background: var(
    --card-background,
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.98),
      rgba(255, 250, 246, 0.96)
    )
  );

  border: 1px solid var(
    --border-default,
    rgba(91, 65, 49, 0.12)
  );

  border-radius: var(--radius-card, 20px);

  box-shadow: var(
    --shadow-card,
    0 1px 2px rgba(77, 52, 38, 0.05),
    0 8px 22px rgba(77, 52, 38, 0.08)
  );

  transition: var(
    --transition-widget,
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease
  );
}

.currently-reading-card:hover {
  transform: translateY(-1px);

  border-color: var(
    --border-strong,
    rgba(91, 65, 49, 0.18)
  );

  box-shadow: var(
    --shadow-card-hover,
    0 2px 5px rgba(77, 52, 38, 0.07),
    0 13px 30px rgba(77, 52, 38, 0.11)
  );
}

/* ==================================================
   HEADER
   ================================================== */

.currently-reading-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  margin-bottom: 18px;
}

.currently-reading-card__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.currently-reading-card__icon {
  display: grid;
  width: 37px;
  height: 37px;
  flex: 0 0 auto;
  place-items: center;

  color: var(--accent-dark, #94513e);

  font-size: 17px;
  line-height: 1;

  background: var(--accent-soft, #efd8cd);
  border-radius: var(--radius-icon, 12px);
}

.currently-reading-card__eyebrow {
  margin: 0 0 2px;

  color: var(--text-secondary, #806f65);

  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.1;
  text-transform: uppercase;
}

.currently-reading-card__title {
  margin: 0;

  color: var(--text-primary, #40342e);

  font-family: var(
    --font-heading,
    Georgia,
    "Times New Roman",
    serif
  );

  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.05;
}

.currently-reading-card__arrow {
  display: grid;
  width: 31px;
  height: 31px;
  flex: 0 0 auto;
  place-items: center;

  color: var(--accent-dark, #94513e);
  text-decoration: none;

  font-size: 1rem;
  font-weight: 800;
  line-height: 1;

  background: var(
    --surface-accent,
    rgba(183, 110, 85, 0.08)
  );

  border: 1px solid var(
    --border-accent,
    rgba(183, 110, 85, 0.12)
  );

  border-radius: 50%;

  transition:
    transform var(--transition-fast, 150ms ease),
    background var(--transition-fast, 150ms ease);
}

.currently-reading-card:hover
  .currently-reading-card__arrow {
  transform: translateX(2px);
}

.currently-reading-card__arrow:hover {
  background: var(
    --surface-accent-strong,
    rgba(183, 110, 85, 0.13)
  );
}

.currently-reading-card__arrow:focus-visible {
  outline: 3px solid rgba(183, 110, 85, 0.24);
  outline-offset: 3px;
}

/* ==================================================
   LOADING, ERROR AND EMPTY STATES
   ================================================== */

.currently-reading-loading,
.currently-reading-error {
  padding: 15px;

  color: var(--text-secondary, #806f65);
  text-align: center;

  font-size: 0.82rem;
  font-weight: 650;

  background: var(
    --panel-background-soft,
    rgba(255, 255, 255, 0.58)
  );

  border: 1px solid var(
    --border-default,
    rgba(91, 65, 49, 0.12)
  );

  border-radius: var(--radius-panel, 14px);
}

.currently-reading-error {
  color: var(--color-danger, #b9655b);
  background: rgba(185, 101, 91, 0.08);
  border-color: rgba(185, 101, 91, 0.14);
}

.currently-reading-empty {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px 20px;

  background: var(
    --panel-background,
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.88),
      rgba(255, 252, 249, 0.74)
    )
  );

  border: 1px solid var(
    --border-default,
    rgba(91, 65, 49, 0.12)
  );

  border-radius: var(--radius-panel, 14px);

  box-shadow: var(
    --shadow-panel,
    inset 0 1px 0 rgba(255, 255, 255, 0.72)
  );
}

.currently-reading-empty__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;

  background: var(--accent-soft, #efd8cd);
  border-radius: var(--radius-icon, 12px);
}

.currently-reading-empty__title {
  margin: 0 0 4px;

  color: var(--text-primary, #40342e);

  font-size: 0.84rem;
  font-weight: 800;
}

.currently-reading-empty__description {
  margin: 0;

  color: var(--text-secondary, #806f65);

  font-size: 0.74rem;
  line-height: 1.45;
}

/* ==================================================
   CURRENT BOOK
   ================================================== */

.currently-reading-content {
  display: grid;
  gap: 16px;
}

.current-book-panel {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: stretch;
  gap: 18px;

  min-width: 0;
  padding: 16px;

  background: var(
    --panel-background,
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.88),
      rgba(255, 252, 249, 0.74)
    )
  );

  border: 1px solid var(
    --border-default,
    rgba(91, 65, 49, 0.12)
  );

  border-radius: var(--radius-panel, 14px);

  box-shadow: var(
    --shadow-panel,
    inset 0 1px 0 rgba(255, 255, 255, 0.72)
  );
}

.book-cover-wrap {
  position: relative;

  width: 82px;
  aspect-ratio: 2 / 3;
  align-self: center;
  overflow: hidden;

  background: var(
    --surface-muted,
    rgba(248, 239, 233, 0.62)
  );

  border: 1px solid var(
    --border-default,
    rgba(91, 65, 49, 0.12)
  );

  border-radius: 10px;

  box-shadow:
    0 6px 14px rgba(77, 52, 38, 0.12),
    0 2px 4px rgba(77, 52, 38, 0.07);
}

.book-cover {
  display: block;
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.book-cover-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;

  color: var(--accent-dark, #94513e);

  background:
    linear-gradient(
      145deg,
      var(--accent-soft, #efd8cd),
      rgba(255, 255, 255, 0.66)
    );
}

.book-cover-placeholder svg {
  width: 38px;
  height: 38px;

  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.book-details {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  padding: 3px 0;
}

.book-heading {
  min-width: 0;
}

.book-heading h2 {
  margin: 0;

  color: var(--text-primary, #40342e);

  font-family: var(
    --font-heading,
    Georgia,
    "Times New Roman",
    serif
  );

  font-size: clamp(1.05rem, 2.7vw, 1.4rem);
  font-weight: 700;
  line-height: 1.18;

  overflow-wrap: anywhere;
}

.book-heading p {
  margin: 6px 0 0;

  color: var(--text-secondary, #806f65);

  font-size: 0.76rem;
  font-weight: 650;
  line-height: 1.35;

  overflow-wrap: anywhere;
}

/* ==================================================
   BOOK PROGRESS
   ================================================== */

.book-progress {
  width: 100%;
  min-width: 0;
}

.book-progress__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  margin-bottom: 8px;
}

.book-progress__label {
  margin: 0;

  color: var(--text-secondary, #806f65);

  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.book-progress__percent {
  color: var(--accent-dark, #94513e);

  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1;
}

.book-progress__track {
  width: 100%;
  height: 10px;
  overflow: hidden;

  background: var(
    --progress-track,
    rgba(91, 65, 49, 0.09)
  );

  border-radius: var(--radius-pill, 999px);
}

.book-progress__fill {
  width: 0;
  height: 100%;

  background: var(--accent, #b86f57);
  border-radius: inherit;

  transition:
    width 650ms
    cubic-bezier(0.22, 1, 0.36, 1);
}

/* ==================================================
   PAGES TODAY SUMMARY
   ================================================== */

.pages-today-summary {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 11px 16px;

  background: var(
    --panel-background-soft,
    rgba(255, 255, 255, 0.58)
  );

  border: 1px solid var(
    --border-default,
    rgba(91, 65, 49, 0.12)
  );

  border-radius: var(--radius-panel, 14px);

  box-shadow: var(
    --shadow-panel,
    inset 0 1px 0 rgba(255, 255, 255, 0.72)
  );
}

.pages-today-summary__icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;

  font-size: 0.8rem;
  line-height: 1;

  background: var(--accent-soft, #efd8cd);
  border-radius: 9px;
}

.pages-today-summary__copy {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin: 0;

  color: var(--text-secondary, #806f65);

  font-size: 0.74rem;
  font-weight: 700;
}

.pages-today-summary__copy strong {
  color: var(--text-primary, #40342e);

  font-size: 1rem;
  font-weight: 850;
}

/* ==================================================
   VISIBILITY AND RESPONSIVE BEHAVIOR
   ================================================== */

[hidden] {
  display: none !important;
}

@media (max-width: 480px) {
  .currently-reading-widget-shell {
    padding: 6px;
  }

  .currently-reading-card {
    padding: 16px;
  }

  .currently-reading-card__header {
    margin-bottom: 14px;
  }

  .current-book-panel {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
  }

  .book-cover-wrap {
    width: 72px;
  }

  .book-details {
    gap: 15px;
  }
}

@media (max-width: 350px) {
  .current-book-panel {
    grid-template-columns: 62px minmax(0, 1fr);
    gap: 12px;
  }

  .book-cover-wrap {
    width: 62px;
  }

  .book-progress__label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .currently-reading-card,
  .currently-reading-card__arrow,
  .book-progress__fill {
    transition: none;
  }
}
