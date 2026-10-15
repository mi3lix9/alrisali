import type { MapCamera } from "@alrisali/domain/gatherings";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

/** A pin on the map: a Gathering's venue, titled. */
export interface VenuePin {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
}

const FILL = { flex: 1 } as const;

/**
 * Venues on the platform's map: Apple Maps on iOS, Google Maps on Android.
 * `onPinPress` gets the pressed pin's id. A non-interactive map ignores
 * touches (a preview inside a scrolling screen).
 */
export const VenueMap = ({
  pins,
  camera,
  interactive,
  onPinPress,
  className,
}: {
  pins: readonly VenuePin[];
  camera: MapCamera;
  interactive: boolean;
  onPinPress?: (id: string) => void;
  className: string;
}) => {
  const { t } = useTranslation("gatherings");
  const markers = pins.map(({ id, title, latitude, longitude }) => ({
    id,
    title,
    coordinates: { latitude, longitude },
  }));
  const onMarkerClick = ({ id }: { id?: string }) => {
    if (id !== undefined) {
      onPinPress?.(id);
    }
  };

  let map = (
    <View className="flex-1 items-center justify-center p-4">
      <Text muted className="text-center">
        {t("map.unavailable")}
      </Text>
    </View>
  );
  if (Platform.OS === "ios") {
    map = (
      <AppleMaps.View
        style={FILL}
        cameraPosition={camera}
        markers={markers}
        onMarkerClick={onMarkerClick}
        uiSettings={{
          compassEnabled: interactive,
          myLocationButtonEnabled: false,
          scaleBarEnabled: interactive,
          togglePitchEnabled: false,
        }}
      />
    );
  } else if (Platform.OS === "android") {
    map = (
      <GoogleMaps.View
        style={FILL}
        cameraPosition={camera}
        markers={markers}
        onMarkerClick={onMarkerClick}
        uiSettings={{
          compassEnabled: interactive,
          mapToolbarEnabled: false,
          myLocationButtonEnabled: false,
          rotationGesturesEnabled: interactive,
          scrollGesturesEnabled: interactive,
          tiltGesturesEnabled: interactive,
          zoomControlsEnabled: false,
          zoomGesturesEnabled: interactive,
        }}
      />
    );
  }

  return (
    <View
      className={`bg-muted overflow-hidden rounded-xl ${className}`}
      pointerEvents={interactive ? "auto" : "none"}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? "auto" : "no-hide-descendants"}
    >
      {map}
    </View>
  );
};
