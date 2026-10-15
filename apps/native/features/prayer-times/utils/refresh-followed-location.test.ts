import { describe, expect, it, vi } from "vitest";

import { refreshFollowedLocation } from "./refresh-followed-location";
import type {
  FollowedLocationDeps,
  FollowedLocationSettings,
} from "./refresh-followed-location";

const MECCA = { latitude: 21.4225, longitude: 39.8262, name: "Mecca" };
const KARBALA = { latitude: 32.616, longitude: 44.0249 };
const NAJAF = { latitude: 31.9946, longitude: 44.3149, name: "Najaf" };

const following: FollowedLocationSettings = {
  location: MECCA,
  locationFollowsDevice: true,
};

const deps = (reads: FollowedLocationSettings[]) => {
  const readSettings = vi.fn<FollowedLocationDeps["readSettings"]>(() =>
    Promise.resolve(reads.shift() ?? following)
  );
  const update = vi.fn<FollowedLocationDeps["update"]>(() => Promise.resolve());
  return {
    readSettings,
    update,
    permitted: () => Promise.resolve(true),
    position: () => Promise.resolve(KARBALA),
    nameOf: () => Promise.resolve("Karbala"),
  };
};

describe(refreshFollowedLocation, () => {
  it("saves the device position when the device has moved", async () => {
    const d = deps([following, following]);
    await refreshFollowedLocation(d);
    expect(d.update).toHaveBeenCalledWith({
      location: { ...KARBALA, name: "Karbala" },
    });
  });

  it("leaves a location the Believer chose by hand", async () => {
    const d = deps([{ location: NAJAF, locationFollowsDevice: false }]);
    await refreshFollowedLocation(d);
    expect(d.update).not.toHaveBeenCalled();
  });

  it("keeps a manual location chosen while the GPS was being read", async () => {
    const d = deps([
      following,
      { location: NAJAF, locationFollowsDevice: false },
    ]);
    await refreshFollowedLocation(d);
    expect(d.update).not.toHaveBeenCalled();
  });

  it("skips the write when the device has not moved far", async () => {
    const d = deps([
      {
        location: { ...KARBALA, name: "Karbala" },
        locationFollowsDevice: true,
      },
    ]);
    await refreshFollowedLocation(d);
    expect(d.update).not.toHaveBeenCalled();
  });
});
