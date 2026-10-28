import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

/**
 * Drives the bottom sheet on the map screen: one translateY value (0 = visible, 800 = hidden),
 * the opacity of the "tap to open" indicator that replaces it, and the swipe-down gesture.
 */
export function useModalAnimation(isRouteFromList: boolean) {
  const [isModalVisible, setIsModalVisible] = useState(!isRouteFromList);
  const modalPosition = useRef(new Animated.Value(isRouteFromList ? 800 : 0)).current;
  const indicatorOpacity = useRef(new Animated.Value(isRouteFromList ? 1 : 0)).current;

  const showModal = useCallback(
    (callback?: () => void) => {
      setIsModalVisible(true);
      Animated.parallel([
        Animated.spring(modalPosition, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(callback);
    },
    [modalPosition, indicatorOpacity],
  );

  const hideModal = useCallback(
    (callback?: () => void) => {
      setIsModalVisible(false);
      Animated.parallel([
        Animated.timing(modalPosition, {
          toValue: 800,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start(callback);
    },
    [modalPosition, indicatorOpacity],
  );

  // Hide modal when route is from list
  useEffect(() => {
    if (isRouteFromList) {
      hideModal();
    }
  }, [isRouteFromList, hideModal]);

  // Swipe down to dismiss; slight upward drag is allowed with resistance for a bounce effect
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return (
          Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy)
        );
      },
      onPanResponderGrant: () => {
        modalPosition.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        // Max 50px upward with heavy resistance, full downward movement
        let translation = gestureState.dy;
        if (gestureState.dy < 0) {
          translation = Math.max(-50, gestureState.dy * 0.2);
        }
        modalPosition.setValue(translation);
      },
      onPanResponderRelease: (_, gestureState) => {
        modalPosition.flattenOffset();

        // If swiped down more than 100 pixels or with velocity, dismiss; otherwise snap back
        if (gestureState.dy > 100 || gestureState.vy > 0.3) {
          hideModal();
        } else {
          showModal();
        }
      },
    }),
  ).current;

  return {
    isModalVisible,
    modalPosition,
    indicatorOpacity,
    showModal,
    hideModal,
    panHandlers: panResponder.panHandlers,
  };
}
