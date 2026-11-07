# Mobile quality gates

| Gate | Browser or emulator | Physical device |
| --- | --- | --- |
| Layout and input | 360×640, 390×844, 844×390, touch input, text scale and synthetic safe areas | Finger reach, touch accuracy, cutouts, gesture bars and legibility |
| Saves and lifecycle | Reload, native test hooks where provided, simulated offline and visibility | Android Back, lock/unlock, rotate, force-stop, restore and repeated reward settlement |
| Audio | File/decode assertions and preference persistence | Calls, headphones, music focus, muted playback and background resume |
| Performance | Bundle sizes, network requests, sampled frame timing | Cold/warm load, memory, frame pacing, thermals and battery on low/mid phones |
| Access | Focus order, labels and target bounds | TalkBack, VoiceOver and actual one-handed play |

Record build SHA, platform, model, OS/WebView, duration, units and steps. Use PASS, FAIL or UNTESTED and attach screenshots/traces. Keep browser, emulator and physical results separate.
