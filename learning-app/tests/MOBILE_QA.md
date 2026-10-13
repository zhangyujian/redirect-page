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
