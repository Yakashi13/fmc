# Privacy policy

Last updated: November 18, 2026

This covers fmc.tools and the FMC Companion app.

## fmc.tools

The site counts anonymous events with Aptabase, which we host ourselves: pages opened, a face viewed, the editor
opened, a watch connected and a face flashed. No cookies, no IP address stored, no device id. If you create an
account, fmc.tools keeps your email, name, avatar, the faces you upload and your likes. Flashing a watch from the
site happens in your browser over Web Bluetooth; nothing about the watch is sent to us.

## FMC Companion

FMC Companion (iOS and Android) installs watch faces, firmware and apps on the CMF Watch Pro 2 and passes data
between the phone and the apps on the watch. It has no ads and no tracking, and it doesn't sell or share your data.
It counts anonymous usage events (see below).

### What stays on your phone and watch

- **Bluetooth.** The app talks to your watch over Bluetooth. The watch's keys and the list of faces on it are kept
  on the phone.
- **Permissions you grant to watch apps.** Your answers are stored only on the phone. Deleting an app from the watch
  with FMC Companion forgets them.
- **Calendar.** When you allow a watch app to use your calendars, upcoming events are read on the phone and sent to
  the watch over Bluetooth. They are not sent anywhere else.
- **Notifications (Android).** When you allow a watch app to use notifications, their text is sent only to the watch.

### What leaves the phone

- **fmc.tools.** The catalog of watch faces, apps and firmware comes from fmc.tools. If you sign in, your fmc.tools
  account (email, name, avatar) and your likes are handled by fmc.tools under its own terms.
- **Weather and town.** When you allow a watch app to use location or weather, the phone's location is used to get
  the weather and the town's name. On iOS this goes through Apple's WeatherKit and geocoder; on Android, through
  Open-Meteo (location rounded to about 1 km) and the system's geocoder. The watch gets only the town and the
  weather, with the location rounded to about 10 km.
- **Web requests by watch apps.** A watch app can fetch an `https://` address only on a host you allowed for it.
- **Updates (Android).** The app checks GitHub for a newer release.

### Anonymous usage statistics

The app sends anonymous usage events to Aptabase, which we host ourselves, so we can see which features get used.
The events are: the app started, a watch was connected (with stock or patched firmware), a watch face was installed
(its fmc.tools id), a watch app was installed or deleted (its name), and the App Loader or the firmware was updated.
An event carries the app version, the operating system, the language and the country worked out from the IP
address. The IP address itself isn't stored, and there is no device id, account or cookie, so events can't be tied
to you. They never carry your location, calendar, notifications or anything you type.

Bluetooth traffic to the watch is not encrypted end to end: anyone nearby with a Bluetooth scanner could read what
goes to the watch.

## Contact

Questions: open an issue at https://github.com/fmctools/companion/issues.
