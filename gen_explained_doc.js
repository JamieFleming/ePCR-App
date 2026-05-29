const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, TableOfContents, PageBreak, LevelFormat,
  BorderStyle
} = require("docx");
const fs = require("fs");

// ─── helpers ────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true })],
    spacing: { before: 360, after: 180 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true })],
    spacing: { before: 240, after: 120 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts })],
    spacing: { after: 160 },
  });
}

function code(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Courier New",
        size: 18,
        color: "1E3A5F",
      }),
    ],
    spacing: { before: 80, after: 80 },
    indent: { left: 720 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: "AACCEE", space: 8 },
    },
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
    spacing: { after: 80 },
  });
}

function note(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "💡 " + text,
        font: "Arial",
        size: 20,
        italics: true,
        color: "555555",
      }),
    ],
    spacing: { before: 100, after: 160 },
    indent: { left: 360 },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── content ────────────────────────────────────────────────────────────────

const sections = [

  // ── title page ──────────────────────────────────────────────────────────
  new Paragraph({
    children: [],
    spacing: { before: 2880 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "ePRF App", font: "Arial", size: 64, bold: true, color: "0F4C81" })],
    spacing: { after: 240 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "How The Code Works", font: "Arial", size: 48, bold: true, color: "1A73B8" })],
    spacing: { after: 360 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "A plain-English guide to app.js", font: "Arial", size: 28, italics: true, color: "444444" })],
    spacing: { after: 720 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Written for non-developers and beginners", font: "Arial", size: 22, color: "666666" })],
  }),
  pageBreak(),

  // ── intro ────────────────────────────────────────────────────────────────
  h1("Introduction"),
  body("The ePRF app is an electronic Patient Report Form — it helps ambulance crews record everything that happened on a job, from the patient's symptoms, to the observations taken, medications given, and the final decision about what to do with them."),
  body("The whole app lives in two files: index.html (the layout and buttons you see on screen) and app.js (all the logic that makes it work). This guide walks through app.js section by section and explains what each part does in plain English."),
  body("You don't need to know how to code to read this. Wherever there's a technical word or concept, it will be explained."),
  note("app.js is roughly 8,700 lines long, but it is broken into clear sections. Once you understand the pattern, each section follows the same logic."),
  pageBreak(),

  // ── TOC ──────────────────────────────────────────────────────────────────
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  pageBreak(),

  // ── Section 1: use strict ────────────────────────────────────────────────
  h1("1 — The very first line: \"use strict\""),
  body("The very first line of app.js is:"),
  code('"use strict";'),
  body("This is a safety instruction to the browser. It tells JavaScript to be stricter about mistakes — for example, if you accidentally create a variable with a typo in its name, JavaScript will throw an error straight away rather than silently carrying on. Think of it like turning on spell-check. It helps catch bugs early."),

  // ── Section 2: helpers ───────────────────────────────────────────────────
  h1("2 — Shortcut Helpers"),
  body("The next few lines create four small helper functions that are used throughout the rest of the file. They exist purely to save typing."),

  h2("$ and $$"),
  body("When you want to interact with something on screen — a button, an input box, a section — you need to find it first. The browser has a built-in way to do this, but it is quite verbose:"),
  code("document.querySelector(\"#someId\")"),
  body("To save writing that every time, the code creates two shortcuts:"),
  code("const $ = (selector, root = document) => root.querySelector(selector);"),
  code("const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];"),
  body("$ finds one element on the page (the first match). $$ finds all matching elements and returns them as a list. The ? you'll see dotted throughout — like $(\"#someId\")?.value — means \"only try to read .value if the element actually exists; if not, just return undefined rather than crashing.\""),
  note("Think of $ like searching for a specific person in a room. $$ is like finding everyone wearing the same colour."),

  h2("val()"),
  code("const val = (id) => ($(\"#\" + id)?.value || \"\").trim();"),
  body("val(\"someId\") reads whatever has been typed into a form field (like a text box or dropdown). It also trims off any accidental spaces at the start or end. If the field is empty or doesn't exist, it returns an empty string rather than crashing."),

  h2("isChecked()"),
  code("const isChecked = (id) => Boolean($(\"#\" + id)?.checked);"),
  body("isChecked(\"someId\") returns true or false depending on whether a checkbox is ticked. Simple."),

  h2("onsetTime() and onsetClockSuffix()"),
  body("These two helpers read the onset time from the form. If the user selected \"Other\" from a dropdown, it reads the extra text box they typed in instead. onsetClockSuffix adds a formatted clock time in brackets if one was entered."),

  pageBreak(),

  // ── Section 3: rfSystolic / evaluateRedFlags ──────────────────────────────
  h1("3 — Blood Pressure and Red Flags"),

  h2("rfSystolic()"),
  body("Blood pressure is typed in as a combined reading like \"120/80\". rfSystolic() splits that text on the slash and returns just the first number (120) as a proper number. If there's no blood pressure entered, it returns null (meaning \"nothing here\")."),

  h2("evaluateRedFlags()"),
  body("This function is a placeholder for future logic that would check whether any clinical red flags are present. For now it simply returns an empty list — but the rest of the code is already set up to use its results when that logic is added."),

  pageBreak(),

  // ── Section 4: state ─────────────────────────────────────────────────────
  h1("4 — The State Object"),
  body("The state object is the memory of the app. Every time a user ticks a box, selects a chip, or adds an entry, that selection is saved into state. When it comes time to build the final report text, the code reads everything back out of state."),
  code("const state = {\n  mapMode: \"site\",\n  siteParts: new Set(),\n  ivEntries: [],\n  drugEntries: [],\n  ...\n};"),
  body("There are two types of containers used inside state:"),
  bullet("Set — a list that automatically removes duplicates. Used for chip selections like character, associated symptoms, or injury types. Adding \"Sharp\" twice still only stores it once."),
  bullet("Array ([ ]) — an ordered list where duplicates are allowed. Used for entries that can be repeated, like IV access attempts or medications given."),
  body("Each key in state corresponds to a specific part of the form:"),
  bullet("siteParts / radiationParts — body map selections for pain site and radiation"),
  bullet("character, associated, exacerbating, relieving — SOCRATES pain assessment chips"),
  bullet("ivEntries, drugEntries — IV access and medication entries"),
  bullet("seizureType, seizureFeatures — seizure assessment chip groups"),
  bullet("strokeFaceFindings, strokeArmFindings, etc. — stroke FAST assessment"),
  bullet("safeguardingConcerns, mcaAbilities — safeguarding and mental capacity"),
  bullet("ecgFindings, ecgLeads — ECG assessment chips"),
  bullet("clinicalChanges — clinical change log entries"),
  note("If you want to know what a user selected, look at state. It is the single source of truth for all adult form data."),
  body("There are also three separate let variables for injury tracking — pendingInjuryTypes, pendingInjuryInterventions, and pendingInjuryNv — which hold the data for the injury currently being built before it is pushed into state.injuryEntries."),

  pageBreak(),

  // ── Section 5: CONVEY_TRANSFER / WORSENING ────────────────────────────────
  h1("5 — Fixed Data Lists"),

  h2("CONVEY_TRANSFER"),
  body("This is a list of pairs used in the conveyance checklist — each pair contains the \"all good\" statement and the \"problem\" statement for that item. For example:"),
  code("[\"Consent to conveyance obtained\", \"Consent not obtained\"]"),
  body("Whichever one the user selects gets included in the handover text."),

  h2("WORSENING_GENERIC and WORSENING_PC"),
  body("These contain the worsening advice given to patients when they are left at home. WORSENING_GENERIC is a list of universal warning signs (like chest pain or seizure) that apply to any patient. WORSENING_PC is a larger object keyed by presenting complaint — if the patient's complaint was \"Headache\", the code can look that up and get the specific headache warning signs."),
  body("The redFlags key inside some entries (like Fall and Back pain) adds a special cauda equina warning that is shown separately."),

  pageBreak(),

  // ── Section 6: OPTIONS ───────────────────────────────────────────────────
  h1("6 — The OPTIONS Object"),
  body("OPTIONS is a large configuration object that contains the lists of items to show in every chip grid and dropdown throughout the form. Instead of hard-coding button labels scattered all over the HTML, they are all stored here in one place."),
  body("Examples of what is inside:"),
  bullet("OPTIONS.pain.character — the list of pain character words: Sharp, Dull, Aching, Burning, etc."),
  bullet("OPTIONS.pain.exacerbating — things that make the pain worse: Movement, Inspiration, After eating, etc."),
  bullet("OPTIONS.falls.symptoms — symptoms at time of fall: Dizziness, Palpitations, Tripped, etc."),
  bullet("OPTIONS.seizure — types of seizure, features, precipitants, post-ictal features"),
  bullet("OPTIONS.stroke — stroke findings for FAST assessment"),
  body("When the app starts up, functions like buildButtonGrid() read from OPTIONS to automatically create all the buttons on screen. That means if you ever need to add or remove a chip option, you only need to change it in OPTIONS — everywhere that chip appears will update automatically."),

  pageBreak(),

  // ── Section 7: populate / build functions ─────────────────────────────────
  h1("7 — Populate and Build Functions"),
  body("Before the user can interact with the form, all the interactive chip grids and dropdowns need to be created. These \"populate\" and \"build\" functions do exactly that — they run once when the app loads and fill in the parts of the page that are too repetitive to write manually in HTML."),

  h2("buildButtonGrid()"),
  body("This is the workhorse function for creating chip buttons. You pass it the ID of a container element, a list of options, and some configuration, and it creates a grid of buttons inside that container. Every single chip grid in the app (pain character, seizure type, stroke findings, etc.) is built this way."),
  code("buildButtonGrid(\"characterGrid\", OPTIONS.pain.character, \"pain\", \"character\", \"someHiddenInput\")"),

  h2("populateSelects()"),
  body("This fills in the dropdown menus (select elements) throughout the form. Rather than putting lots of <option> tags in the HTML, this function runs on startup and adds the options from data arrays. Keeps the HTML clean."),

  h2("populateSymptomSearchOptions()"),
  body("Fills in the symptom search tool so users can quickly look up worsening advice for any presenting complaint."),

  h2("buildObsTable()"),
  body("Creates the observations table that appears in the obs recorder feature. Each row is a set of vital sign recordings."),

  h2("buildStrokeCard() and similar card builders"),
  body("Some assessment sections are complex enough to need their own dedicated builder function. buildStrokeCard() creates the full stroke FAST assessment grid with its chip rows. These functions run when the relevant section is first shown."),

  pageBreak(),

  // ── Section 8: init() ────────────────────────────────────────────────────
  h1("8 — The init() Function"),
  body("init() is the starting point of the whole app. It is called once as soon as the page loads, and it sets everything in motion."),
  body("Here is what init() does, in order:"),
  bullet("Calls populateSelects() to fill in all dropdowns"),
  bullet("Calls buildButtonGrid() for every chip grid on the adult form"),
  bullet("Builds the GCS calculator for the primary survey and head injury sections"),
  bullet("Builds the stroke assessment card"),
  bullet("Calls bindEvents() to attach all the click, change, and input listeners"),
  bullet("Sets up the dashboard cards"),
  bullet("Applies the saved theme (dark/light mode)"),
  body("Think of init() as the morning setup routine — everything needs to happen in the right order before the app is ready for use."),
  note("If something does not appear on screen when the app loads, init() is the first place to check."),

  pageBreak(),

  // ── Section 9: showFeature / initDashboard ───────────────────────────────
  h1("9 — The Dashboard and Feature Switching"),

  h2("showDashboard() and showFeature()"),
  body("The app has a dashboard with feature cards (ePRF, Obs Recorder, NEWS2, Drug Finder, Resp Counter). showDashboard() hides everything except those cards. showFeature(featureName) hides the dashboard and shows whichever feature was clicked."),
  body("Features are lazy-loaded — the obs recorder and NEWS2 tool are only fully initialised the first time they are shown. After that, the init flag (_obsRecInited, _news2Inited) prevents them from being set up twice."),

  h2("initDashboard()"),
  body("Attaches click listeners to each dashboard card, plus the back button and the BNF drug search form. The BNF search opens the NICE BNF website in a new browser tab with the search term pre-filled."),

  pageBreak(),

  // ── Section 10: makeEntryManager / entry functions ───────────────────────
  h1("10 — Entry Managers"),
  body("Several parts of the form allow the user to add multiple entries — for example, multiple IV access attempts or multiple medications. The makeEntryManager factory function handles all of that in a reusable way."),

  h2("makeEntryManager()"),
  code("const { render, remove } = makeEntryManager(stateKey, containerId, formatFn, removeAttr, stateObj)"),
  body("You call makeEntryManager once for each type of entry, passing:"),
  bullet("stateKey — the name of the array in state to store entries (e.g. \"ivEntries\")"),
  bullet("containerId — the ID of the div where rendered entries should appear"),
  bullet("formatFn — a function that turns one entry object into a readable string"),
  bullet("removeAttr — the data attribute name used on the remove button"),
  bullet("stateObj — which state object to use (defaults to state for adult, paedsState for paediatric)"),
  body("makeEntryManager returns two functions: render() which redraws all entries from the array, and remove(index) which deletes one entry and redraws."),
  body("The app creates entry managers for:"),
  bullet("IV / vascular access entries (adult and paeds separately)"),
  bullet("Clinical change log entries"),

  h2("addIvEntry()"),
  body("Reads the access type, site, gauge, outcome, flush, and fluids fields from the form. If the required fields (type and site) are filled in, it pushes a new entry object into the state array and calls render() to show it. It then clears the form fields ready for the next entry."),

  h2("addDrugEntry() and renderDrugEntries()"),
  body("Works the same way as IV entries but for medications. renderDrugEntries() also adds a repeat button (↺) next to each entry. Clicking repeat pre-fills the drug form with that entry's details and updates the time to now, making it quick to give a second dose."),

  h2("addChangeEntry() and renderChangeEntries()"),
  body("Records a clinical change — a timestamped note that something changed during the call. Used in the clinical changes section of the form."),

  pageBreak(),

  // ── Section 11: bindEvents() ─────────────────────────────────────────────
  h1("11 — bindEvents()"),
  body("bindEvents() is where all the interactive behaviour of the adult form is wired up. It runs once during init() and attaches event listeners to every button, input, dropdown, and chip group that needs to do something when clicked or changed."),
  body("An event listener is just a piece of code that says: \"when this thing happens, run this function.\" For example:"),
  code("$(\"#addVaButton\")?.addEventListener(\"click\", () => addIvEntry());"),
  body("That line means: find the button with ID addVaButton, and when it is clicked, call addIvEntry()."),
  body("Examples of what bindEvents sets up:"),
  bullet("Add IV access button → calls addIvEntry()"),
  bullet("Add medication button → calls addDrugEntry()"),
  bullet("VA type dropdown → shows or hides gauge/site chip groups depending on whether it's an IV or IO"),
  bullet("VA outcome dropdown → shows or hides the flush chip group"),
  bullet("ABCDE chip clicks → toggles the chip between normal/abnormal state"),
  bullet("Injury map clicks → handles adding injury sites"),
  bullet("GCS buttons → updates the GCS total score"),
  bullet("Pain score buttons → saves the selected severity"),
  bullet("Safeguarding chips → toggles selections"),
  bullet("Copy output button → copies the report text to the clipboard"),
  bullet("Reset button → clears the entire form"),
  note("If a button does nothing when you click it, the event listener for it is either missing from bindEvents(), or there is an error in the function it calls."),

  pageBreak(),

  // ── Section 12: text builders ─────────────────────────────────────────────
  h1("12 — Text Builders"),
  body("The whole point of the app is to generate a structured text report at the end. The text builder functions read everything from state and the form, and piece together the final paragraphs of the ePRF."),

  h2("buildOutput()"),
  body("This is the main text builder. It reads all the form data and produces the complete report in whichever format was selected — Standard, SBAR, ATMIST, or Leave at Home."),
  body("Standard format is the default: it produces flowing paragraphs for each section (patient details, presenting complaint, SOCRATES, observations, interventions, etc.)."),
  body("SBAR (Situation, Background, Assessment, Recommendation) is a structured handover format used when handing over to a hospital team."),
  body("ATMIST (Age, Time, Mechanism, Injuries, Signs, Treatment) is used for trauma handovers."),
  body("Leave at Home produces the SBAR-style text for when the patient is being left at home."),

  h2("buildLahSbarText()"),
  body("Specifically builds the Leave at Home version of the report, including the worsening advice section and what the patient was told to do if things get worse."),

  h2("buildObsText()"),
  body("Reads the observations recorded in the obs sets (obs recorder) and formats them as text. Calculates NEWS2 scores for each set and flags any abnormals."),

  h2("buildHeadInjuryText() and buildConveyanceText()"),
  body("Focused text builders for specific sections — head injury assessment and conveyance decision. Each reads the relevant state and form fields and returns a formatted string."),

  h2("getNiceCTCriteria()"),
  body("Checks whether any of the NICE criteria for CT scanning are met (based on the head injury section). Returns a formatted string listing which criteria apply. Uses the GCS values from the head injury GCS calculator."),

  pageBreak(),

  // ── Section 13: NEWS2 ────────────────────────────────────────────────────
  h1("13 — NEWS2 Scoring"),
  body("NEWS2 is the National Early Warning Score 2 — a clinical scoring system used to identify patients at risk of deterioration. It gives a score for each vital sign, and the total determines how urgently the patient needs review."),

  h2("newsScore()"),
  body("This function takes the six vital sign values and consciousness level and returns a total NEWS2 score plus a breakdown of the individual scores. It uses the official NHS NEWS2 thresholds:"),
  bullet("Respiratory rate — scored 0-3 based on how far outside normal range"),
  bullet("SpO₂ — two different scales (Scale 1 for most patients, Scale 2 for COPD/hypercapnic patients)"),
  bullet("Supplemental oxygen — 2 points if the patient is on oxygen"),
  bullet("Systolic BP — scored 0-3"),
  bullet("Heart rate — scored 0-3"),
  bullet("Temperature — scored 0-3"),
  bullet("AVPU consciousness — 3 points for anything other than Alert"),

  h2("initNews2() and updateNews2()"),
  body("initNews2() sets up the standalone NEWS2 tool (accessible from the dashboard). It only runs once. updateNews2() is called whenever any vital sign changes in the obs recorder — it recalculates the NEWS2 score for that obs set and updates the display."),

  h2("NEWS2_GUIDANCE"),
  body("A lookup object that maps NEWS2 score ranges to the recommended clinical response — from \"routine monitoring\" at score 0, up to \"emergency assessment\" at score 7 or above."),

  pageBreak(),

  // ── Section 14: Obs Recorder and Obs Sets ────────────────────────────────
  h1("14 — Obs Recorder and Obs Sets"),
  body("The obs recorder allows the crew to record multiple sets of observations over time — for example, obs every five minutes during a long transfer. Each \"obs set\" is a self-contained block with a full set of vital signs fields."),

  h2("initObsRecorder()"),
  body("Runs the first time the Obs Recorder feature is opened. Creates the first obs set automatically, then wires up the \"Add Obs Set\" button to create more."),

  h2("createObsSet()"),
  body("Builds one complete obs set — a div containing all the vital signs input fields, chip buttons for AVPU/consciousness, remove button, and event listeners. Each obs set is self-contained; they don't interfere with each other."),
  body("createObsSet() also sets up:"),
  bullet("A remove button that deletes that obs set and renumbers the remaining ones"),
  bullet("Chip click listeners for AVPU, on-oxygen, and similar binary choices within the set"),
  bullet("Input listeners that trigger NEWS2 recalculation whenever a value is typed"),

  h2("updateObsSetNumbers()"),
  body("After adding or removing obs sets, this function renumbers the headers — \"Obs Set 1\", \"Obs Set 2\", etc."),

  h2("buildObsText()"),
  body("Reads all the recorded obs sets and formats them as a text summary, including the NEWS2 score for each set. If multiple sets are present, it also notes any trends (e.g. improving or worsening)."),

  pageBreak(),

  // ── Section 15: GCS Calculator ────────────────────────────────────────────
  h1("15 — GCS Calculator"),
  body("GCS stands for Glasgow Coma Scale — it is a way of scoring a patient's level of consciousness by looking at their eye opening, verbal response, and motor response. It produces a score out of 15."),

  h2("buildGcsCalcHTML()"),
  body("Creates the HTML for a GCS calculator widget. It accepts a prefix parameter so that the same function can build multiple GCS calculators on the page — one for the primary survey, one for the neuro section, one for head injury — without them conflicting."),
  code("buildGcsCalcHTML(\"headGcs\")  // builds a calculator with IDs starting headGcs..."),
  body("The calculator uses button-chips for each level of Eye (1–4), Verbal (1–5), and Motor (1–6). When a button is clicked, its value is saved in a data attribute on the button, and the total is recalculated."),

  h2("updateGcsTally()"),
  body("Called whenever a GCS button is clicked. Reads the selected value for each of Eye, Verbal, and Motor, adds them up, and updates the total display. For the primary survey and neuro calculators, it also writes the total into the main GCS score field so it feeds into the output text."),
  body("The head injury calculator deliberately does not write to the main GCS field — it has its own display and is used separately for the NICE CT criteria check."),

  h2("How the selected value is stored"),
  body("Rather than using a hidden input, the GCS calculator stores the selected value in a data attribute on the button element itself:"),
  code("button.dataset.gcsSelected = \"3\""),
  body("When reading the value back, the code uses:"),
  code("parseInt($(\"#headGcsEye\")?.dataset.gcsSelected || \"\", 10) || 0"),
  body("This is called the \"sentinel pattern\" — if no button has been selected, the dataset value is empty and the code safely returns 0 instead of crashing."),

  pageBreak(),

  // ── Section 16: Conveyance ───────────────────────────────────────────────
  h1("16 — Conveyance Section"),
  body("Conveyance refers to transporting the patient — to hospital, to a GP, to a walk-in centre, or leaving them at home. The conveyance section of the app handles recording the decision and the handover details."),

  h2("buildConveyDestination()"),
  body("Creates the destination chip group — hospital, GP, walk-in centre, etc. Accepts a prefix so it can serve both the adult form (\"convey\") and the paeds form (\"pConvey\") without duplication."),

  h2("toggleConveyChip()"),
  body("Handles clicking a conveyance checklist chip (like \"Consent obtained\" or \"Pre-alert given\"). Each pair in CONVEY_TRANSFER has a positive and a negative chip. Selecting one deselects the other."),

  h2("buildConveyanceText()"),
  body("Produces the handover text for the conveyance section — which destination was chosen, all the checklist items, and any additional notes. This feeds into the SBAR Recommendation section."),

  pageBreak(),

  // ── Section 17: Paediatric Mode ───────────────────────────────────────────
  h1("17 — Paediatric Mode"),
  body("When the paeds mode toggle is switched on, the app shows a different, age-appropriate assessment form. The paeds form has its own state object, its own set of chip grids, and its own text builder."),

  h2("paedsState"),
  body("A separate state object that mirrors the adult state but contains only the fields relevant to paeds assessments:"),
  bullet("pIvEntries — paediatric vascular access entries"),
  bullet("pDrugEntries — paediatric medication entries"),
  bullet("pAirwayInterventions, pWoundInterventions, pPositioningInterventions — treatment selections"),
  bullet("pReferrals — referral selections"),
  body("Having a separate paedsState means that switching between adult and paeds mode does not overwrite each other's data."),

  h2("initPaeds()"),
  body("Runs the first time paeds mode is activated. Builds all the paeds-specific chip grids (ABCDENT assessment, PAT triangle, FLACC pain scale, safeguarding grid, treatment sections) and attaches their event listeners via bindPaedsEvents()."),
  body("A guard flag (_paedsInited) ensures this only runs once — if the user toggles in and out of paeds mode, the form is not rebuilt each time."),

  h2("PAT Triangle"),
  body("The Paediatric Assessment Triangle (PAT) is a rapid visual assessment using three areas: Appearance, Work of breathing, and Circulation to skin. Each area has chip buttons that toggle between normal and abnormal states. This gives a quick first impression of how sick the child is."),

  h2("FLACC Pain Scale"),
  body("FLACC is a pain assessment tool for children who cannot verbally communicate their pain. It scores five areas (Face, Legs, Activity, Cry, Consolability) on a 0–2 scale. updateFlaccScore() sums those scores and displays the total with a label: mild, moderate, or severe."),

  h2("buildPaedsTxText() and buildPaedsOutput()"),
  body("Paeds-specific text builders that read from paedsState and produce the final ePRF report text for a paediatric patient. They follow the same pattern as the adult text builders."),

  pageBreak(),

  // ── Section 18: Resp Counter ──────────────────────────────────────────────
  h1("18 — Respiratory Rate Counter"),
  body("The respiratory rate counter is a tool that helps accurately count a patient's breathing rate. Rather than relying on estimation, the crew starts a timer and taps a button once for each breath. The app calculates the rate per minute automatically."),

  h2("respCounter object"),
  body("A small object that holds the counter's current state:"),
  bullet("duration — the counting window in seconds (15, 30, or 60)"),
  bullet("running — whether the counter is currently active"),
  bullet("startTime / endTime — timestamps for calculating elapsed time"),
  bullet("count — how many taps have been recorded"),
  bullet("timerId — the interval timer handle (used to stop the timer later)"),

  h2("startRespCounter()"),
  body("Starts the count. Sets the start and end timestamps, disables the duration selector so it cannot be changed mid-count, changes the button label to \"Counting...\", and starts a timer that fires every 250ms to update the display."),

  h2("recordRespTap()"),
  body("Called each time the tap button is pressed. Increments the count by 1 and adds a brief pulse animation to the tap button as visual feedback. updateRespCounterDisplay() then recalculates the live rate."),

  h2("finishRespCounter()"),
  body("Called automatically when the counting window expires. Stops the timer, calculates the final rate (taps ÷ duration × 60), and shows the result card. If the rate is below 12 or above 20 (outside the normal range), the result card is highlighted in a warning colour."),

  h2("resetRespCounter()"),
  body("Resets everything back to zero. Optionally clears the result card as well (the false argument keeps it visible so the crew can still read the last result while resetting for a new count)."),

  pageBreak(),

  // ── Section 19: Theme ─────────────────────────────────────────────────────
  h1("19 — Dark / Light Mode Theme"),
  body("The theme code is wrapped in an immediately-invoked function — a block of code that runs itself as soon as the page loads. It:"),
  bullet("Reads the saved theme preference from localStorage (the browser's built-in storage that persists between sessions)"),
  bullet("Applies that theme by setting a data-theme attribute on the root html element"),
  bullet("Updates the toggle button label and the browser tab colour"),
  bullet("Attaches a click listener to the theme toggle button so it switches and saves the preference"),
  body("Using a data-theme attribute on the root element means all the CSS colour variables can switch at once — no JavaScript needed to change individual colours."),

  pageBreak(),

  // ── Section 20: Summary ───────────────────────────────────────────────────
  h1("20 — How It All Fits Together"),
  body("Here is a simple walk-through of what happens from the moment the page loads to the moment a report is generated:"),

  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "The browser loads index.html. The HTML file sets up all the sections, cards, and input fields that will be visible.", font: "Arial", size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "app.js loads. \"use strict\" is set. The helper functions ($, $$, val, isChecked) are defined.", font: "Arial", size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "The state object is created — empty, ready to receive data.", font: "Arial", size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "All the OPTIONS, WORSENING, and CONVEY_TRANSFER data objects are defined.", font: "Arial", size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "init() runs. Dropdowns are populated. Chip grids are built. GCS calculators are injected. bindEvents() wires up all the interactivity.", font: "Arial", size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "The crew uses the form. Every selection, tap, and typed value updates state (or paedsState).", font: "Arial", size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text: "When \"Copy\" is pressed, buildOutput() reads everything from state and produces the complete text report.", font: "Arial", size: 22 })],
    spacing: { after: 160 },
  }),

  body("That's the whole app — seven steps from page load to finished report."),
  body("The key insight is separation of concerns: the HTML defines what you see, OPTIONS defines what the choices are, state holds what was selected, and the text builders turn state into the final report. Each part has one clear job."),
  note("The best way to understand a new section of code is to ask: \"what does it read from?\", \"what does it write to?\", and \"when does it run?\" Almost everything in app.js can be understood from those three questions."),

];

// ─── build document ──────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 720, hanging: 360 } },
            },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 720, hanging: 360 } },
            },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "0F4C81" },
        paragraph: {
          spacing: { before: 480, after: 200 },
          outlineLevel: 0,
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1A73B8" },
        paragraph: {
          spacing: { before: 280, after: 120 },
          outlineLevel: 1,
        },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: sections,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/Users/jamie/Documents/Apps/ePRF/ePRF_Code_Explained.docx", buffer);
  console.log("Done — ePRF_Code_Explained.docx created.");
});
