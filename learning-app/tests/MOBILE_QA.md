# Mobile Layout QA

Checked on 2026-10-13 with the in-app Chromium browser and viewport overrides.
This is responsive browser QA, not a claim of physical iOS/Android device testing.

## Width Matrix

Dashboard, courses, certifications, practice, command manual and notes were
checked at 360 x 800, 390 x 844 and 430 x 932. The document scroll width matched
the body client width on every page. Internal chapter and note lists may scroll
without expanding the document.

Additional checks:

- At 320 x 740, the new-note button, note list and editor fit the viewport.
- At 844 x 390, the course reader retains a scrollable content area; the
  chapter strip stays horizontal and secondary sidebar text is hidden.
- Four-system drawer selection and the distribution center remain accessible.
- Login inputs use 16px text and the dialog fits within the viewport.
- Command search and expanded command details do not expand the document.
- Terminal input uses a separate row, 16px text and a visible run button;
  `man 1 ls` executes in the offline sandbox at 360px.
- Multiple new notes select the newest item and return the list to its top.
- Long note names wrap without clipping; title/content remain paired when
  switching between notes. All note delete controls remain within the list.
- Delete opens the confirmation dialog; cancellation leaves the note intact.
- Bottom navigation, return links and close buttons have touch-sized targets.

## Device Follow-Up

The layout uses dynamic viewport units, safe-area insets and the Chromium
`interactive-widget=resizes-content` hint. Physical mobile keyboard behavior,
browser-specific safe areas and older browsers still need real-device checks.
User zoom remains enabled.

## Notes Interaction Regression

The 2026-10-13 follow-up checked actual keyboard actions, not only form fills:

- Enter in the note-name input moves focus to the body; IME composition Enter
  is left to the input method.
- Enter in the body inserts a newline. Backspace and Delete remove characters.
- Saving and reloading preserve multiline content and the selected note.
- Switching notes keeps their titles and content independent.
- Canceling delete leaves the note unchanged; confirming the last deletion
  produces an empty list, not a replacement blank note.
- Deleted notes can be restored after a page reload, including their content.
- Finish editing blurs the inputs and restores the mobile bottom navigation.
- At 320px, every editor action is at least 44px high and stays inside the page.
- Storage-failure unit tests verify that delete and restore keep at least one
  persisted active or recovery copy even when a write fails.

## Sticky-Note Board

- New cards display title, category, creation time and actual multiline body
  previews. Old notes keep their content and display their last known update
  time with an explicit legacy-record label.
- Preset and custom categories persist after reload. Creating in an empty
  selected category inherits that category.
- Category filters show only matching cards and select a matching editor record.
  Deleting the active filtered card keeps the next selection in that category.
- A 13-note browser check verified the initial 12 cards, loading the remainder,
  opening the oldest card and changing its category without hiding the card
  when returning from the editor.
- At 320px, 390px and 430px the document stays within the viewport. Finish editing
  returns to the selected card with mobile navigation space reserved.
- Enter still moves from the title to the body; the body retains line breaks.
- Creation time stays fixed when the body or category changes; update time changes.
