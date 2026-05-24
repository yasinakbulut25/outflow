import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export function SkeletonCard() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style} className="bg-white border border-border rounded-xl p-4 mb-2">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 rounded-full bg-surface" />
        <View className="flex-1 gap-2">
          <View className="h-3.5 w-1/2 rounded bg-surface" />
          <View className="h-3 w-1/3 rounded bg-surface" />
        </View>
        <View className="h-4 w-16 rounded bg-surface" />
      </View>
    </Animated.View>
  );
}
