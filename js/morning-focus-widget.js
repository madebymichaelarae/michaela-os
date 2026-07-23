const API_URL = "/api/morning-focus";

const elements = {
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    focusContent: document.getElementById("focusContent"),
    errorState: document.getElementById("errorState"),

    openFocusLink: document.getElementById("openFocusLink"),
    createFocusButton: document.getElementById("createFocusButton"),

    createMessage: document.getElementById("createMessage"),
    updateMessage: document.getElementById("updateMessage"),

    priority1Text: document.getElementById("priority1Text"),
    priority2Text: document.getElementById("priority2Text"),
    priority3Text: document.getElementById("priority3Text"),

    priority1Done: document.getElementById("priority1Done"),
    priority2Done: document.getElementById("priority2Done"),
    priority3Done: document.getElementById("priority3Done"),

    lookingForwardTo: document.getElementById("lookingForwardTo"),
    leavingInYesterday: document.getElementById("leavingInYesterday"),
    gratefulFor: document.getElementById("gratefulFor")
};

let currentFocus = null;

function showState(stateName) {
    elements.loadingState.hidden = stateName !== "loading";
    elements.emptyState.hidden = stateName !== "empty";
    elements.focusContent.hidden = stateName !== "content";
    elements.errorState.hidden = stateName !== "error";
}

function setText(element, value, fallback = "") {
    element.textContent = value?.trim() || fallback;
}

function renderPriority(number, priority) {
    const checkbox = elements[`priority${number}Done`];
    const text = elements[`priority${number}Text`];
    const row = checkbox.closest(".priority-item");

    const priorityText = priority?.text?.trim() || "";
    const hasText = Boolean(priorityText);

    row.classList.toggle("is-empty", !hasText);

    checkbox.checked = Boolean(priority?.done);
    checkbox.disabled = !hasText;

    setText(text, priorityText);
}

function renderReflection(element, value) {
    const responseText = value?.trim() || "";

    setText(
        element,
        responseText,
        "Not filled in yet"
    );

    element.classList.toggle(
        "is-placeholder",
        !responseText
    );
}

function renderFocus(focus) {
    currentFocus = focus;

    if (!focus.exists) {
        elements.openFocusLink.hidden = true;
        showState("empty");
        return;
    }

    renderPriority(1, focus.priority1);
    renderPriority(2, focus.priority2);
    renderPriority(3, focus.priority3);

    renderReflection(
        elements.lookingForwardTo,
        focus.lookingForwardTo
    );

    renderReflection(
        elements.leavingInYesterday,
        focus.leavingInYesterday
    );

    renderReflection(
        elements.gratefulFor,
        focus.gratefulFor
    );

    if (focus.pageUrl) {
        elements.openFocusLink.href = focus.pageUrl;
        elements.openFocusLink.hidden = false;
    } else {
        elements.openFocusLink.hidden = true;
    }

    showState("content");
}

async function loadFocus() {
    showState("loading");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                `Request failed with status ${response.status}`
            );
        }

        const focus = await response.json();

        renderFocus(focus);
    } catch (error) {
        console.error("Morning Focus load error:", error);
        showState("error");
    }
}

async function updatePriority(number, checked) {
    if (!currentFocus?.pageId) {
        return;
    }

    const checkbox = elements[`priority${number}Done`];

    elements.updateMessage.textContent = "Saving…";
    checkbox.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pageId: currentFocus.pageId,
                priority: number,
                done: checked
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.details ||
                result.error ||
                "Unable to save priority."
            );
        }

        currentFocus[`priority${number}`].done = checked;
        elements.updateMessage.textContent = "Saved";

        window.setTimeout(() => {
            elements.updateMessage.textContent = "";
        }, 1000);
    } catch (error) {
        console.error("Priority update error:", error);

        checkbox.checked = !checked;
        elements.updateMessage.textContent =
            "Could not save.";
    } finally {
        checkbox.disabled = false;
    }
}

[1, 2, 3].forEach((number) => {
    elements[`priority${number}Done`].addEventListener(
        "change",
        (event) => {
            updatePriority(
                number,
                event.target.checked
            );
        }
    );
});

async function createTodayFocus() {
    const button = elements.createFocusButton;

    /*
     * Open a blank tab immediately during the click.
     * Browsers may block a new tab if we wait until
     * after the API request finishes.
     */
    const notionWindow = window.open(
        "",
        "_blank"
    );

    button.disabled = true;
    button.textContent = "Creating…";

    elements.createMessage.textContent =
        "Preparing today’s page…";

    try {
        const response = await fetch(
            API_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({})
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.details ||
                result.error ||
                "Unable to create today’s page."
            );
        }

        if (result.pageUrl) {
            if (notionWindow) {
                notionWindow.location.href =
                    result.pageUrl;
            } else {
                window.open(
                    result.pageUrl,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        } else if (notionWindow) {
            notionWindow.close();
        }

        elements.createMessage.textContent =
            result.created
                ? "Today is ready."
                : "Today’s page was already created.";

        await loadFocus();
    } catch (error) {
        console.error(
            "Morning Focus creation error:",
            error
        );

        if (notionWindow) {
            notionWindow.close();
        }

        elements.createMessage.textContent =
            "Could not create today’s page.";

        button.disabled = false;
        button.textContent = "Start Today";
    }
}

elements.createFocusButton.addEventListener(
    "click",
    createTodayFocus
);

loadFocus();
loadFocus();

loadFocus();
