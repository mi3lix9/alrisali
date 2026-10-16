# Time-zone boundaries

Source: `@photostructure/tz-lookup` 11.7, https://github.com/photostructure/tz-lookup, a fork of Dark Sky's `tz-lookup`. Licence of the library and its compiled lookup table: CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/.

Its boundaries are compiled from Evan Siroky's timezone-boundary-builder, https://github.com/evansiroky/timezone-boundary-builder, whose output data is licensed under the Open Data Commons Open Database License (ODbL) 1.0, https://opendatacommons.org/licenses/odbl/1-0/, and is built from OpenStreetMap data, © OpenStreetMap contributors, https://www.openstreetmap.org/copyright.

## What is used

- The time zone at the Believer's location, so Prayer Times and Prayer Time Reminders follow that place's clock rather than the device's. The lookup runs on the device; no location leaves it.

## Why this library

- Pure JavaScript with its data inlined (about 88 KB unpacked, no dependencies), so it runs on Hermes. `geo-tz` reads its data from the Node file system, and `browser-geo-tz` downloads it at run time.
- Maintained against current timezone-boundary-builder releases, unlike the original `tz-lookup` (last published 2022).
- Its table is coarser than the full boundaries, so a point within a few kilometres of a border can get the neighbouring zone.

## Changes

- None. The package is used as published.
