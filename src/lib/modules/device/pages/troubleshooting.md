# Before you connect

FMC talks to your watch straight from the browser, with no phone app in between. This page covers what it changes on the watch and the problems people have actually run into.

## What FMC can and cannot do

- **It installs watchfaces through the watch's own installer.** The upload follows the same steps the official app takes. FMC starts an install, describes the file, sends it in chunks and finishes. The watch answers every step and can refuse the file. When it does, FMC shows you the refusal and stops.
- **Firmware is the risky part.** From the firmware shelf, FMC flashes unofficial images over the air, and a bad one can brick a watch. FMC offers an image only to a Watch Pro 2 at 50% battery or more, checks the image's checksums and that it was built for that watch, and waits for you to tick that you accept the risk.
- **Watchfaces can go wrong too.** Usually the watch refuses the file, or installs it and it looks wrong, and you delete it on the watch. Once, a face with an image far larger than the screen made a Watch 3 Pro restart in a loop. See "The watch restarts in a loop" below.
- **We won't tell you nothing can go wrong.** We build and test FMC on a CMF Watch Pro 2. Firmware we haven't seen may behave differently, and we can't promise anything about it. If something breaks, [tell us](https://github.com/freethinkel/fmc/issues). The Nothing X fix below exists because someone did.

## Only one app can hold the watch at a time

The watch accepts a single Bluetooth connection. If Nothing X is connected, even in the background, **Connect** in FMC hangs and eventually times out. Close Nothing X or disconnect the watch inside it first.

It works the other way too. While an FMC tab holds the watch, Nothing X can't reach it. When you're done, close the tab or press **Forget device** in the watch panel. Two FMC tabs block each other the same way.

## Nothing X stopped seeing the watch after I used FMC

This one looks like a bricked watch. It isn't. The phone has a Bluetooth pairing conflict, and pairing again clears it.

1. Close the FMC tab so nothing holds the watch.
2. Turn Bluetooth off on the phone, wait a few seconds, turn it back on.
3. Forget the watch in the phone's Bluetooth settings.
4. Put the watch in pairing mode and add it again in Nothing X.

<p class="note type-caption">A user reported this in <a href="https://github.com/freethinkel/fmc/issues/27">issue #27</a>. Another user replied with these steps a few hours later, and nobody has needed a factory reset.</p>

## Deleting a watchface on the watch

You don't need FMC or Nothing X for this. Long-press the current face until the list of installed faces appears. Swipe to the one you want gone and swipe up on it.

A Watch Pro 2 holds {WF_CAPACITY} watchfaces, a Watch 3 Pro {WF_CAPACITY_PRO3}. Once they're all taken, FMC asks which one to overwrite. The factory faces count too, and Nothing X can reinstall them.

## The watch restarts in a loop

The watch has to hold every image of a face in memory. A face with a 1386×1386 image, three times the screen, ran a CMF Watch 3 Pro out of memory: it showed the logo, went black and restarted, again and again, and nothing could connect to it.

It isn't only one huge image: what counts is everything a screen shows at once. A Watch 3 Pro keeps every image of the screen on display decoded in about 6.5 MB of memory, which it shares with the display itself. A face with nine full-screen layers needed about 10 MB and sent a Watch 3 Pro into the same loop.

FMC now prevents this in several places. Images you add in the editor are scaled down to fit the screen. Before any install, FMC also checks the file and refuses it if an image is more than {MAX_IMAGE_SIDE} px on a side, wherever the file came from. Past {SAFE_IMAGE_SIDE} px, bigger than factory faces use, it asks you to confirm before installing. On the way to the watch, layers without transparency are stored without the unused transparency byte. For a Watch 3 Pro, if a screen still needs more than {SCREEN_BUDGET_MB} MB, FMC stores its largest layers in the compressed format the watch's own faces use, which costs a little sharpness. A face that still doesn't fit is refused.

A second loop shows up only on the always-on display: the screen flashes to full brightness over and over until you switch to a factory face. The face reported doing this on a Watch 3 Pro had lost the small thumbnail every factory always-on screen carries. That is our best lead, not a confirmed cause. FMC now refuses a file like that before the install, and the editor puts the thumbnail back, so open the face in the editor and install it from there.

If your watch is already stuck in the loop, we don't have a confirmed fix yet. These are the things worth trying, in order:

1. Right after it restarts, keep the screen awake by tapping it. The large image in the reported case was the always-on one, so the crash may only come when the screen dims.
2. If the face shows up even briefly, long-press it and swipe it away. If you have time, also turn off the always-on display in settings.
3. If the watch goes black after the logo but still shows up in the Bluetooth picker, try the [rescue page](/rescue): it sends a factory reset the moment the watch lets us in, and asks for nothing else. Use the browser you installed the face from.
4. Let the battery run out completely, then charge it and try again.
5. If none of that works, contact Nothing support. A watchface doesn't touch the firmware, so this is a repair they can do.

<p class="note type-caption">If one of these steps worked for you, or something else did, please <a href="https://github.com/freethinkel/fmc/issues">tell us</a> so we can put it at the top of this list.</p>

## When the watch refuses an upload

FMC shows what the watch said. Usually the watch is full, the slot you picked was removed in the meantime, or the watch rejected the finished file. Reconnect and try again. If the same face fails twice, the file is the problem, not the watch.

## Which browsers work

Connecting needs Web Bluetooth, which means Chrome or Edge on desktop, or Chrome on Android. Firefox doesn't support it. On an iPhone, Safari and Chrome don't either, but Bluefy does (see below).

## On an iPhone: Bluefy

Safari has no Web Bluetooth, and every other iPhone browser runs on the same engine. [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055), a free browser from the App Store, adds it.

1. Install Bluefy and open this site in it.
2. **Let go of the watch first.** While another app on the iPhone holds the watch, Bluefy can't see it and its picker comes up empty. Open Settings → Bluetooth: if the watch says **Connected**, an app is holding it, usually Nothing X or a fitness app that syncs workouts. Swipe that app away in the app switcher until the watch reads **Not Connected**. Forgetting the watch in Settings doesn't help, because the app connects it again.
3. In Bluefy, open the watch panel and press **Connect**. Pick the watch, and confirm the pairing on the watch if it asks.
4. Keep Bluefy in front and the screen on until an install finishes. The link drops when the browser goes to the background.

When you're done, close the tab, and the other app can have the watch back.

<p class="note type-caption">If it still doesn't connect, press <strong>Copy log</strong> in the watch panel and paste it into an <a href="https://github.com/freethinkel/fmc/issues">issue</a>.</p>

---

Did your watch do something this page doesn't describe? [Open an issue](https://github.com/freethinkel/fmc/issues) with your browser, the watch model and the firmware version shown in the watch panel. That's enough for us to reproduce it.
