# World Magnetic Model (WMM2025)

Source: The World Magnetic Model WMM2025, produced by the NOAA National Centers for Environmental Information (NCEI) and the British Geological Survey (BGS), https://www.ncei.noaa.gov/products/world-magnetic-model. Coefficient file `WMM.COF`, header `2025.0 WMM-2025 11/13/2024`, from `WMM2025COF.zip`. Licence: public domain (a work of the United States Government, not subject to copyright in the United States); see https://www.ncei.noaa.gov/products/world-magnetic-model.

## What is used

- The 90 Gauss coefficients (degree and order 1 to 12) and their secular variation, which the Qibla compass uses to work out the magnetic declination where the Believer is and correct the compass from magnetic to true north. Valid from 2025.0 to 2030.0.

## Changes

- None to the values. Copied into `src/magnetic-model/data/wmm2025.ts` as TypeScript data.
