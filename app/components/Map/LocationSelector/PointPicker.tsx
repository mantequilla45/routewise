import { latLongStringifier } from '@/lib/util/latLngStringifier';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function PointRow({
  icon,
  label,
  onPress,
}: Readonly<{ icon: IoniconName; label: string; onPress: () => void }>) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.pointInputRow}>
        <View style={styles.pointInputBlock}>
          <View style={styles.pointInputIconLeft}>
            <Ionicons name={icon} color="blue" size={18} />
          </View>
          <Text style={styles.pointInputText} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
        </View>

        <View style={[styles.pointInputBlock, { justifyContent: 'flex-end' }]}>
          <Text style={styles.pointPickerText} numberOfLines={1}>
            Select on Map
          </Text>
          <View style={styles.pointInputIconRight}>
            <Ionicons name={'globe-outline'} color={'black'} size={16} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** The two "Select on Map" rows for the starting point (A) and destination (B). */
export default function PointPicker({
  pointA,
  pointB,
  onSelectPointA,
  onSelectPointB,
}: Readonly<{
  pointA: LatLng | null;
  pointB: LatLng | null;
  onSelectPointA: () => void;
  onSelectPointB: () => void;
}>) {
  return (
    <View style={styles.pointInputBox}>
      <View style={styles.pointInputContainer}>
        <PointRow
          icon="navigate-circle-outline"
          label={pointA ? latLongStringifier(pointA) : 'Select starting point'}
          onPress={onSelectPointA}
        />

        <View style={styles.line}></View>

        <PointRow
          icon="location-outline"
          label={pointB ? latLongStringifier(pointB) : 'Select destination'}
          onPress={onSelectPointB}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pointInputBox: {
    backgroundColor: '#D9D9D9',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  pointInputContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
  },

  pointInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },

  pointInputBlock: {
    flexDirection: 'row',
    width: '50%',
  },

  pointInputIconLeft: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  pointInputIconRight: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  pointInputText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 14,
    flexShrink: 1,
    fontFamily: 'Lexend_400Regular',
  },

  pointPickerText: {
    color: '#000',
    fontSize: 12,
    flexShrink: 1,
    fontFamily: 'Lexend_300Light',
  },

  line: {
    height: 1,
    backgroundColor: '#6C6C6C',
    width: '100%',
    marginVertical: 4,
  },
});
