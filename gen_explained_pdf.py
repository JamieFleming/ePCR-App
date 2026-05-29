from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    HRFlowable, ListFlowable, ListItem, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

OUTPUT = "/Users/jamie/Documents/Apps/ePRF/ePRF_Code_Explained.pdf"

# ── Styles ────────────────────────────────────────────────────────────────────

styles = getSampleStyleSheet()

TITLE_STYLE = ParagraphStyle("DocTitle",
    fontName="Helvetica-Bold", fontSize=36,
    textColor=colors.HexColor("#0F4C81"),
    alignment=TA_CENTER, spaceAfter=16)

SUBTITLE_STYLE = ParagraphStyle("DocSubtitle",
    fontName="Helvetica-Bold", fontSize=24,
    textColor=colors.HexColor("#1A73B8"),
    alignment=TA_CENTER, spaceAfter=12)

BYLINE_STYLE = ParagraphStyle("DocByline",
    fontName="Helvetica-Oblique", fontSize=14,
    textColor=colors.HexColor("#444444"),
    alignment=TA_CENTER, spaceAfter=8)

H1_STYLE = ParagraphStyle("H1",
    fontName="Helvetica-Bold", fontSize=18,
    textColor=colors.HexColor("#0F4C81"),
    spaceBefore=24, spaceAfter=8,
    borderPad=4)

H2_STYLE = ParagraphStyle("H2",
    fontName="Helvetica-Bold", fontSize=13,
    textColor=colors.HexColor("#1A73B8"),
    spaceBefore=14, spaceAfter=6)

BODY_STYLE = ParagraphStyle("Body",
    fontName="Helvetica", fontSize=11,
    textColor=colors.HexColor("#222222"),
    leading=17, spaceAfter=8,
    alignment=TA_JUSTIFY)

CODE_STYLE = ParagraphStyle("Code",
    fontName="Courier", fontSize=9,
    textColor=colors.HexColor("#1E3A5F"),
    backColor=colors.HexColor("#EEF4FB"),
    leading=14, spaceAfter=6, spaceBefore=4,
    leftIndent=16, rightIndent=8,
    borderColor=colors.HexColor("#AACCEE"),
    borderWidth=1, borderPadding=6,
    borderRadius=2)

NOTE_STYLE = ParagraphStyle("Note",
    fontName="Helvetica-Oblique", fontSize=10,
    textColor=colors.HexColor("#555555"),
    backColor=colors.HexColor("#FFFBE6"),
    leading=15, spaceAfter=8, spaceBefore=4,
    leftIndent=14, rightIndent=8,
    borderColor=colors.HexColor("#DDBB00"),
    borderWidth=1, borderPadding=6)

BULLET_STYLE = ParagraphStyle("BulletItem",
    fontName="Helvetica", fontSize=11,
    textColor=colors.HexColor("#222222"),
    leading=15, spaceAfter=3, leftIndent=18)

# ── Helpers ───────────────────────────────────────────────────────────────────

def h1(text):
    return [
        Spacer(1, 6),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0F4C81"), spaceAfter=4),
        Paragraph(text, H1_STYLE),
    ]

def h2(text):
    return [Paragraph(text, H2_STYLE)]

def body(text):
    return [Paragraph(text, BODY_STYLE)]

def code(text):
    # escape XML special chars
    safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # preserve newlines as <br/>
    safe = safe.replace("\n", "<br/>")
    return [Paragraph(safe, CODE_STYLE)]

def note(text):
    return [Paragraph("&#x1F4A1; " + text, NOTE_STYLE)]

def bullet(text):
    return [Paragraph("&#x2022;&#160;&#160;" + text, BULLET_STYLE)]

def numbered(items):
    result = []
    for i, text in enumerate(items, 1):
        result.append(Paragraph(f"{i}.&#160;&#160;{text}", BULLET_STYLE))
    return result

def pb():
    return [PageBreak()]

# ── Page numbering ─────────────────────────────────────────────────────────────

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self._page_number = 0

    def showPage(self):
        self._page_number += 1
        self._saved_page_states.append((self._page_number, dict(self.__dict__)))
        self._startPage()

    def save(self):
        for page_num, state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_footer(page_num)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_page_footer(self, page_num):
        if page_num <= 2:
            return  # skip title & TOC pages
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#888888"))
        self.drawRightString(letter[0] - inch, 0.5 * inch, f"Page {page_num}")
        self.drawString(inch, 0.5 * inch, "ePRF App — How The Code Works")

# ── Content ───────────────────────────────────────────────────────────────────

story = []

# Title page
story += [
    Spacer(1, 2.2 * inch),
    Paragraph("ePRF App", TITLE_STYLE),
    Paragraph("How The Code Works", SUBTITLE_STYLE),
    Spacer(1, 0.3 * inch),
    Paragraph("A plain-English guide to app.js", BYLINE_STYLE),
    Spacer(1, 0.15 * inch),
    Paragraph("Written for non-developers and beginners", ParagraphStyle("sub2",
        fontName="Helvetica", fontSize=12, textColor=colors.HexColor("#666666"),
        alignment=TA_CENTER)),
] + pb()

# Introduction
story += h1("Introduction")
story += body("The ePRF app is an electronic Patient Report Form — it helps ambulance crews record everything that happened on a job, from the patient's symptoms, to the observations taken, medications given, and the final decision about what to do with them.")
story += body("The whole app lives in two files: index.html (the layout and buttons you see on screen) and app.js (all the logic that makes it work). This guide walks through app.js section by section and explains what each part does in plain English.")
story += body("You don't need to know how to code to read this. Wherever there's a technical word or concept, it will be explained.")
story += note("app.js is roughly 8,700 lines long, but it is broken into clear sections. Once you understand the pattern, each section follows the same logic.")
story += pb()

# Section 1
story += h1("1 — The Very First Line: \"use strict\"")
story += body("The very first line of app.js is:")
story += code('"use strict";')
story += body("This is a safety instruction to the browser. It tells JavaScript to be stricter about mistakes — for example, if you accidentally create a variable with a typo in its name, JavaScript will throw an error straight away rather than silently carrying on. Think of it like turning on spell-check. It helps catch bugs early.")
story += pb()

# Section 2
story += h1("2 — Shortcut Helpers")
story += body("The next few lines create four small helper functions that are used throughout the rest of the file. They exist purely to save typing.")
story += h2("$ and $$")
story += body("When you want to interact with something on screen — a button, an input box, a section — you need to find it first. The browser has a built-in way to do this, but it is quite verbose:")
story += code("document.querySelector(\"#someId\")")
story += body("To save writing that every time, the code creates two shortcuts:")
story += code('const $ = (selector, root = document) => root.querySelector(selector);\nconst $$ = (selector, root = document) => [...root.querySelectorAll(selector)];')
story += body("$ finds one element on the page (the first match). $$ finds all matching elements and returns them as a list. The ? you'll see dotted throughout — like $(\"#someId\")?.value — means \"only try to read .value if the element actually exists; if not, just return undefined rather than crashing.\"")
story += note("Think of $ like searching for a specific person in a room. $$ is like finding everyone wearing the same colour.")
story += h2("val()")
story += code("const val = (id) => ($(\"#\" + id)?.value || \"\").trim();")
story += body("val(\"someId\") reads whatever has been typed into a form field (like a text box or dropdown). It also trims off any accidental spaces at the start or end. If the field is empty or doesn't exist, it returns an empty string rather than crashing.")
story += h2("isChecked()")
story += code("const isChecked = (id) => Boolean($(\"#\" + id)?.checked);")
story += body("isChecked(\"someId\") returns true or false depending on whether a checkbox is ticked. Simple.")
story += h2("onsetTime() and onsetClockSuffix()")
story += body("These two helpers read the onset time from the form. If the user selected \"Other\" from a dropdown, it reads the extra text box they typed in instead. onsetClockSuffix adds a formatted clock time in brackets if one was entered.")
story += pb()

# Section 3
story += h1("3 — Blood Pressure and Red Flags")
story += h2("rfSystolic()")
story += body("Blood pressure is typed in as a combined reading like \"120/80\". rfSystolic() splits that text on the slash and returns just the first number (120) as a proper number. If there's no blood pressure entered, it returns null (meaning \"nothing here\").")
story += h2("evaluateRedFlags()")
story += body("This function is a placeholder for future logic that would check whether any clinical red flags are present. For now it simply returns an empty list — but the rest of the code is already set up to use its results when that logic is added.")
story += pb()

# Section 4
story += h1("4 — The State Object")
story += body("The state object is the memory of the app. Every time a user ticks a box, selects a chip, or adds an entry, that selection is saved into state. When it comes time to build the final report text, the code reads everything back out of state.")
story += code("const state = {\n  mapMode: \"site\",\n  siteParts: new Set(),\n  ivEntries: [],\n  drugEntries: [],\n  ...\n};")
story += body("There are two types of containers used inside state:")
story += bullet("Set — a list that automatically removes duplicates. Used for chip selections like character, associated symptoms, or injury types. Adding \"Sharp\" twice still only stores it once.")
story += bullet("Array ([ ]) — an ordered list where duplicates are allowed. Used for entries that can be repeated, like IV access attempts or medications given.")
story += body("Each key in state corresponds to a specific part of the form:")
story += bullet("siteParts / radiationParts — body map selections for pain site and radiation")
story += bullet("character, associated, exacerbating, relieving — SOCRATES pain assessment chips")
story += bullet("ivEntries, drugEntries — IV access and medication entries")
story += bullet("seizureType, seizureFeatures — seizure assessment chip groups")
story += bullet("strokeFaceFindings, strokeArmFindings, etc. — stroke FAST assessment")
story += bullet("safeguardingConcerns, mcaAbilities — safeguarding and mental capacity")
story += bullet("ecgFindings, ecgLeads — ECG assessment chips")
story += bullet("clinicalChanges — clinical change log entries")
story += note("If you want to know what a user selected, look at state. It is the single source of truth for all adult form data.")
story += pb()

# Section 5
story += h1("5 — Fixed Data Lists")
story += h2("CONVEY_TRANSFER")
story += body("This is a list of pairs used in the conveyance checklist — each pair contains the \"all good\" statement and the \"problem\" statement for that item. For example:")
story += code("[\"Consent to conveyance obtained\", \"Consent not obtained\"]")
story += body("Whichever one the user selects gets included in the handover text.")
story += h2("WORSENING_GENERIC and WORSENING_PC")
story += body("These contain the worsening advice given to patients when they are left at home. WORSENING_GENERIC is a list of universal warning signs (like chest pain or seizure) that apply to any patient. WORSENING_PC is a larger object keyed by presenting complaint — if the patient's complaint was \"Headache\", the code can look that up and get the specific headache warning signs.")
story += body("The redFlags key inside some entries (like Fall and Back pain) adds a special cauda equina warning that is shown separately.")
story += pb()

# Section 6
story += h1("6 — The OPTIONS Object")
story += body("OPTIONS is a large configuration object that contains the lists of items to show in every chip grid and dropdown throughout the form. Instead of hard-coding button labels scattered all over the HTML, they are all stored here in one place.")
story += body("Examples of what is inside:")
story += bullet("OPTIONS.pain.character — the list of pain character words: Sharp, Dull, Aching, Burning, etc.")
story += bullet("OPTIONS.pain.exacerbating — things that make the pain worse: Movement, Inspiration, After eating, etc.")
story += bullet("OPTIONS.falls.symptoms — symptoms at time of fall: Dizziness, Palpitations, Tripped, etc.")
story += bullet("OPTIONS.seizure — types of seizure, features, precipitants, post-ictal features")
story += bullet("OPTIONS.stroke — stroke findings for FAST assessment")
story += body("When the app starts up, functions like buildButtonGrid() read from OPTIONS to automatically create all the buttons on screen. That means if you ever need to add or remove a chip option, you only need to change it in OPTIONS — everywhere that chip appears will update automatically.")
story += pb()

# Section 7
story += h1("7 — Populate and Build Functions")
story += body("Before the user can interact with the form, all the interactive chip grids and dropdowns need to be created. These functions run once when the app loads and fill in the parts of the page that are too repetitive to write manually in HTML.")
story += h2("buildButtonGrid()")
story += body("This is the workhorse function for creating chip buttons. You pass it the ID of a container element, a list of options, and some configuration, and it creates a grid of buttons inside that container. Every single chip grid in the app is built this way.")
story += code("buildButtonGrid(\"characterGrid\", OPTIONS.pain.character, \"pain\", \"character\", \"someHiddenInput\")")
story += h2("populateSelects()")
story += body("This fills in the dropdown menus (select elements) throughout the form. Rather than putting lots of &lt;option&gt; tags in the HTML, this function runs on startup and adds the options from data arrays. Keeps the HTML clean.")
story += h2("populateSymptomSearchOptions()")
story += body("Fills in the symptom search tool so users can quickly look up worsening advice for any presenting complaint.")
story += h2("buildStrokeCard() and similar card builders")
story += body("Some assessment sections are complex enough to need their own dedicated builder function. buildStrokeCard() creates the full stroke FAST assessment grid with its chip rows. These functions run when the relevant section is first shown.")
story += pb()

# Section 8
story += h1("8 — The init() Function")
story += body("init() is the starting point of the whole app. It is called once as soon as the page loads, and it sets everything in motion.")
story += body("Here is what init() does, in order:")
story += bullet("Calls populateSelects() to fill in all dropdowns")
story += bullet("Calls buildButtonGrid() for every chip grid on the adult form")
story += bullet("Builds the GCS calculator for the primary survey and head injury sections")
story += bullet("Builds the stroke assessment card")
story += bullet("Calls bindEvents() to attach all the click, change, and input listeners")
story += bullet("Sets up the dashboard cards")
story += bullet("Applies the saved theme (dark/light mode)")
story += note("If something does not appear on screen when the app loads, init() is the first place to check.")
story += pb()

# Section 9
story += h1("9 — The Dashboard and Feature Switching")
story += h2("showDashboard() and showFeature()")
story += body("The app has a dashboard with feature cards (ePRF, Obs Recorder, NEWS2, Drug Finder, Resp Counter). showDashboard() hides everything except those cards. showFeature(featureName) hides the dashboard and shows whichever feature was clicked.")
story += body("Features are lazy-loaded — the obs recorder and NEWS2 tool are only fully initialised the first time they are shown. After that, the init flag (_obsRecInited, _news2Inited) prevents them from being set up twice.")
story += h2("initDashboard()")
story += body("Attaches click listeners to each dashboard card, plus the back button and the BNF drug search form. The BNF search opens the NICE BNF website in a new browser tab with the search term pre-filled.")
story += pb()

# Section 10
story += h1("10 — Entry Managers")
story += body("Several parts of the form allow the user to add multiple entries — for example, multiple IV access attempts or multiple medications. The makeEntryManager factory function handles all of that in a reusable way.")
story += h2("makeEntryManager()")
story += code("const { render, remove } = makeEntryManager(stateKey, containerId, formatFn, removeAttr, stateObj)")
story += body("You call makeEntryManager once for each type of entry, passing:")
story += bullet("stateKey — the name of the array in state to store entries (e.g. \"ivEntries\")")
story += bullet("containerId — the ID of the div where rendered entries should appear")
story += bullet("formatFn — a function that turns one entry object into a readable string")
story += bullet("removeAttr — the data attribute name used on the remove button")
story += bullet("stateObj — which state object to use (defaults to state for adult, paedsState for paediatric)")
story += body("makeEntryManager returns two functions: render() which redraws all entries from the array, and remove(index) which deletes one entry and redraws.")
story += h2("addIvEntry()")
story += body("Reads the access type, site, gauge, outcome, flush, and fluids fields from the form. If the required fields (type and site) are filled in, it pushes a new entry object into the state array and calls render() to show it. It then clears the form fields ready for the next entry.")
story += h2("addDrugEntry() and renderDrugEntries()")
story += body("Works the same way as IV entries but for medications. renderDrugEntries() also adds a repeat button (↺) next to each entry. Clicking repeat pre-fills the drug form with that entry's details and updates the time to now, making it quick to give a second dose.")
story += h2("addChangeEntry() and renderChangeEntries()")
story += body("Records a clinical change — a timestamped note that something changed during the call. Used in the clinical changes section of the form.")
story += pb()

# Section 11
story += h1("11 — bindEvents()")
story += body("bindEvents() is where all the interactive behaviour of the adult form is wired up. It runs once during init() and attaches event listeners to every button, input, dropdown, and chip group that needs to do something when clicked or changed.")
story += body("An event listener is just a piece of code that says: \"when this thing happens, run this function.\" For example:")
story += code("$(\"#addVaButton\")?.addEventListener(\"click\", () => addIvEntry());")
story += body("That line means: find the button with ID addVaButton, and when it is clicked, call addIvEntry().")
story += body("Examples of what bindEvents sets up:")
story += bullet("Add IV access button → calls addIvEntry()")
story += bullet("Add medication button → calls addDrugEntry()")
story += bullet("VA type dropdown → shows or hides gauge/site chip groups depending on whether it's an IV or IO")
story += bullet("VA outcome dropdown → shows or hides the flush chip group")
story += bullet("ABCDE chip clicks → toggles the chip between normal/abnormal state")
story += bullet("GCS buttons → updates the GCS total score")
story += bullet("Pain score buttons → saves the selected severity")
story += bullet("Copy output button → copies the report text to the clipboard")
story += bullet("Reset button → clears the entire form")
story += note("If a button does nothing when you click it, the event listener for it is either missing from bindEvents(), or there is an error in the function it calls.")
story += pb()

# Section 12
story += h1("12 — Text Builders")
story += body("The whole point of the app is to generate a structured text report at the end. The text builder functions read everything from state and the form, and piece together the final paragraphs of the ePRF.")
story += h2("buildOutput()")
story += body("This is the main text builder. It reads all the form data and produces the complete report in whichever format was selected — Standard, SBAR, ATMIST, or Leave at Home.")
story += body("Standard format is the default: it produces flowing paragraphs for each section (patient details, presenting complaint, SOCRATES, observations, interventions, etc.).")
story += body("SBAR (Situation, Background, Assessment, Recommendation) is a structured handover format used when handing over to a hospital team.")
story += body("ATMIST (Age, Time, Mechanism, Injuries, Signs, Treatment) is used for trauma handovers.")
story += body("Leave at Home produces the SBAR-style text for when the patient is being left at home.")
story += h2("buildLahSbarText()")
story += body("Specifically builds the Leave at Home version of the report, including the worsening advice section and what the patient was told to do if things get worse.")
story += h2("buildObsText()")
story += body("Reads the observations recorded in the obs sets (obs recorder) and formats them as text. Calculates NEWS2 scores for each set and flags any abnormals.")
story += h2("buildHeadInjuryText() and buildConveyanceText()")
story += body("Focused text builders for specific sections — head injury assessment and conveyance decision. Each reads the relevant state and form fields and returns a formatted string.")
story += h2("getNiceCTCriteria()")
story += body("Checks whether any of the NICE criteria for CT scanning are met (based on the head injury section). Returns a formatted string listing which criteria apply. Uses the GCS values from the head injury GCS calculator.")
story += pb()

# Section 13
story += h1("13 — NEWS2 Scoring")
story += body("NEWS2 is the National Early Warning Score 2 — a clinical scoring system used to identify patients at risk of deterioration. It gives a score for each vital sign, and the total determines how urgently the patient needs review.")
story += h2("newsScore()")
story += body("This function takes the six vital sign values and consciousness level and returns a total NEWS2 score plus a breakdown of the individual scores. It uses the official NHS NEWS2 thresholds:")
story += bullet("Respiratory rate — scored 0-3 based on how far outside normal range")
story += bullet("SpO2 — two different scales (Scale 1 for most patients, Scale 2 for COPD/hypercapnic patients)")
story += bullet("Supplemental oxygen — 2 points if the patient is on oxygen")
story += bullet("Systolic BP — scored 0-3")
story += bullet("Heart rate — scored 0-3")
story += bullet("Temperature — scored 0-3")
story += bullet("AVPU consciousness — 3 points for anything other than Alert")
story += h2("initNews2() and updateNews2()")
story += body("initNews2() sets up the standalone NEWS2 tool (accessible from the dashboard). It only runs once. updateNews2() is called whenever any vital sign changes in the obs recorder — it recalculates the NEWS2 score for that obs set and updates the display.")
story += h2("NEWS2_GUIDANCE")
story += body("A lookup object that maps NEWS2 score ranges to the recommended clinical response — from \"routine monitoring\" at score 0, up to \"emergency assessment\" at score 7 or above.")
story += pb()

# Section 14
story += h1("14 — Obs Recorder and Obs Sets")
story += body("The obs recorder allows the crew to record multiple sets of observations over time — for example, obs every five minutes during a long transfer. Each obs set is a self-contained block with a full set of vital signs fields.")
story += h2("initObsRecorder()")
story += body("Runs the first time the Obs Recorder feature is opened. Creates the first obs set automatically, then wires up the \"Add Obs Set\" button to create more.")
story += h2("createObsSet()")
story += body("Builds one complete obs set — a div containing all the vital signs input fields, chip buttons for AVPU/consciousness, remove button, and event listeners. Each obs set is self-contained; they don't interfere with each other.")
story += body("createObsSet() also sets up:")
story += bullet("A remove button that deletes that obs set and renumbers the remaining ones")
story += bullet("Chip click listeners for AVPU, on-oxygen, and similar binary choices within the set")
story += bullet("Input listeners that trigger NEWS2 recalculation whenever a value is typed")
story += h2("updateObsSetNumbers()")
story += body("After adding or removing obs sets, this function renumbers the headers — \"Obs Set 1\", \"Obs Set 2\", etc.")
story += pb()

# Section 15
story += h1("15 — GCS Calculator")
story += body("GCS stands for Glasgow Coma Scale — it is a way of scoring a patient's level of consciousness by looking at their eye opening, verbal response, and motor response. It produces a score out of 15.")
story += h2("buildGcsCalcHTML()")
story += body("Creates the HTML for a GCS calculator widget. It accepts a prefix parameter so that the same function can build multiple GCS calculators on the page — one for the primary survey, one for the neuro section, one for head injury — without them conflicting.")
story += code("buildGcsCalcHTML(\"headGcs\")  // builds a calculator with IDs starting headGcs...")
story += body("The calculator uses button-chips for each level of Eye (1-4), Verbal (1-5), and Motor (1-6). When a button is clicked, its value is saved in a data attribute on the button, and the total is recalculated.")
story += h2("updateGcsTally()")
story += body("Called whenever a GCS button is clicked. Reads the selected value for each of Eye, Verbal, and Motor, adds them up, and updates the total display. For the primary survey and neuro calculators, it also writes the total into the main GCS score field so it feeds into the output text.")
story += body("The head injury calculator deliberately does not write to the main GCS field — it has its own display and is used separately for the NICE CT criteria check.")
story += h2("How the selected value is stored")
story += body("Rather than using a hidden input, the GCS calculator stores the selected value in a data attribute on the button element itself:")
story += code("button.dataset.gcsSelected = \"3\"")
story += body("When reading the value back, the code uses:")
story += code("parseInt($(\"#headGcsEye\")?.dataset.gcsSelected || \"\", 10) || 0")
story += body("This is called the sentinel pattern — if no button has been selected, the dataset value is empty and the code safely returns 0 instead of crashing.")
story += pb()

# Section 16
story += h1("16 — Conveyance Section")
story += body("Conveyance refers to transporting the patient — to hospital, to a GP, to a walk-in centre, or leaving them at home. The conveyance section of the app handles recording the decision and the handover details.")
story += h2("buildConveyDestination()")
story += body("Creates the destination chip group — hospital, GP, walk-in centre, etc. Accepts a prefix so it can serve both the adult form (\"convey\") and the paeds form (\"pConvey\") without duplication.")
story += h2("toggleConveyChip()")
story += body("Handles clicking a conveyance checklist chip (like \"Consent obtained\" or \"Pre-alert given\"). Each pair in CONVEY_TRANSFER has a positive and a negative chip. Selecting one deselects the other.")
story += h2("buildConveyanceText()")
story += body("Produces the handover text for the conveyance section — which destination was chosen, all the checklist items, and any additional notes. This feeds into the SBAR Recommendation section.")
story += pb()

# Section 17
story += h1("17 — Paediatric Mode")
story += body("When the paeds mode toggle is switched on, the app shows a different, age-appropriate assessment form. The paeds form has its own state object, its own set of chip grids, and its own text builder.")
story += h2("paedsState")
story += body("A separate state object that mirrors the adult state but contains only the fields relevant to paeds assessments:")
story += bullet("pIvEntries — paediatric vascular access entries")
story += bullet("pDrugEntries — paediatric medication entries")
story += bullet("pAirwayInterventions, pWoundInterventions, pPositioningInterventions — treatment selections")
story += bullet("pReferrals — referral selections")
story += body("Having a separate paedsState means that switching between adult and paeds mode does not overwrite each other's data.")
story += h2("initPaeds()")
story += body("Runs the first time paeds mode is activated. Builds all the paeds-specific chip grids (ABCDENT assessment, PAT triangle, FLACC pain scale, safeguarding grid, treatment sections) and attaches their event listeners.")
story += body("A guard flag (_paedsInited) ensures this only runs once — if the user toggles in and out of paeds mode, the form is not rebuilt each time.")
story += h2("PAT Triangle")
story += body("The Paediatric Assessment Triangle (PAT) is a rapid visual assessment using three areas: Appearance, Work of breathing, and Circulation to skin. Each area has chip buttons that toggle between normal and abnormal states. This gives a quick first impression of how sick the child is.")
story += h2("FLACC Pain Scale")
story += body("FLACC is a pain assessment tool for children who cannot verbally communicate their pain. It scores five areas (Face, Legs, Activity, Cry, Consolability) on a 0-2 scale. updateFlaccScore() sums those scores and displays the total with a label: mild, moderate, or severe.")
story += pb()

# Section 18
story += h1("18 — Respiratory Rate Counter")
story += body("The respiratory rate counter helps accurately count a patient's breathing rate. Rather than relying on estimation, the crew starts a timer and taps a button once for each breath. The app calculates the rate per minute automatically.")
story += h2("respCounter object")
story += body("A small object that holds the counter's current state:")
story += bullet("duration — the counting window in seconds (15, 30, or 60)")
story += bullet("running — whether the counter is currently active")
story += bullet("startTime / endTime — timestamps for calculating elapsed time")
story += bullet("count — how many taps have been recorded")
story += bullet("timerId — the interval timer handle (used to stop the timer later)")
story += h2("startRespCounter()")
story += body("Starts the count. Sets the start and end timestamps, disables the duration selector so it cannot be changed mid-count, and starts a timer that fires every 250ms to update the display.")
story += h2("recordRespTap()")
story += body("Called each time the tap button is pressed. Increments the count by 1 and adds a brief pulse animation to the tap button as visual feedback.")
story += h2("finishRespCounter()")
story += body("Called automatically when the counting window expires. Stops the timer, calculates the final rate (taps divided by duration, multiplied by 60), and shows the result card. If the rate is below 12 or above 20 (outside the normal range), the result card is highlighted in a warning colour.")
story += h2("resetRespCounter()")
story += body("Resets everything back to zero. Optionally clears the result card as well.")
story += pb()

# Section 19
story += h1("19 — Dark / Light Mode Theme")
story += body("The theme code is wrapped in an immediately-invoked function — a block of code that runs itself as soon as the page loads. It:")
story += bullet("Reads the saved theme preference from localStorage (the browser's built-in storage that persists between sessions)")
story += bullet("Applies that theme by setting a data-theme attribute on the root html element")
story += bullet("Updates the toggle button label and the browser tab colour")
story += bullet("Attaches a click listener to the theme toggle button so it switches and saves the preference")
story += body("Using a data-theme attribute on the root element means all the CSS colour variables can switch at once — no JavaScript needed to change individual colours.")
story += pb()

# Section 20
story += h1("20 — How It All Fits Together")
story += body("Here is a simple walk-through of what happens from the moment the page loads to the moment a report is generated:")
story += numbered([
    "The browser loads index.html. The HTML file sets up all the sections, cards, and input fields that will be visible.",
    "app.js loads. \"use strict\" is set. The helper functions ($, $$, val, isChecked) are defined.",
    "The state object is created — empty, ready to receive data.",
    "All the OPTIONS, WORSENING, and CONVEY_TRANSFER data objects are defined.",
    "init() runs. Dropdowns are populated. Chip grids are built. GCS calculators are injected. bindEvents() wires up all the interactivity.",
    "The crew uses the form. Every selection, tap, and typed value updates state (or paedsState).",
    "When \"Copy\" is pressed, buildOutput() reads everything from state and produces the complete text report.",
])
story += body("That's the whole app — seven steps from page load to finished report.")
story += body("The key insight is separation of concerns: the HTML defines what you see, OPTIONS defines what the choices are, state holds what was selected, and the text builders turn state into the final report. Each part has one clear job.")
story += note("The best way to understand a new section of code is to ask: \"what does it read from?\", \"what does it write to?\", and \"when does it run?\" Almost everything in app.js can be understood from those three questions.")

# ── Build ─────────────────────────────────────────────────────────────────────

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=letter,
    leftMargin=inch,
    rightMargin=inch,
    topMargin=inch,
    bottomMargin=inch,
    title="ePRF App — How The Code Works",
    author="ePRF",
    subject="A plain-English guide to app.js",
)

doc.build(story, canvasmaker=NumberedCanvas)
print(f"PDF created: {OUTPUT}")
