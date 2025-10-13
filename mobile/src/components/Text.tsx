import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

interface TextProps extends RNTextProps {
  weight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';
  children?: React.ReactNode;
}

// Map font weights to Lexend font files
const fontMap = {
  '100': 'Lexend-Thin',
  '200': 'Lexend-ExtraLight',
  '300': 'Lexend-Light',
  '400': 'Lexend-Regular',
  '500': 'Lexend-Medium',
  '600': 'Lexend-SemiBold',
  '700': 'Lexend-Bold',
  '800': 'Lexend-ExtraBold',
  '900': 'Lexend-Black',
  'normal': 'Lexend-Regular',
  'bold': 'Lexend-Bold',
};

export const Text: React.FC<TextProps> = ({ style, weight = '400', children, ...props }) => {
  // Get the appropriate font family based on weight
  const fontFamily = fontMap[weight] || 'Lexend-Regular';
  
  // Merge styles with the correct font family
  const mergedStyle: TextStyle = [
    { fontFamily },
    style,
  ] as TextStyle;

  return (
    <RNText style={mergedStyle} {...props}>
      {children}
    </RNText>
  );
};

// Convenience components for common text styles
export const Title: React.FC<TextProps> = (props) => (
  <Text weight="700" style={[{ fontSize: 24 }, props.style]} {...props} />
);

export const Subtitle: React.FC<TextProps> = (props) => (
  <Text weight="500" style={[{ fontSize: 18 }, props.style]} {...props} />
);

export const Body: React.FC<TextProps> = (props) => (
  <Text weight="400" style={[{ fontSize: 16 }, props.style]} {...props} />
);

export const Caption: React.FC<TextProps> = (props) => (
  <Text weight="300" style={[{ fontSize: 14 }, props.style]} {...props} />
);

export const Label: React.FC<TextProps> = (props) => (
  <Text weight="600" style={[{ fontSize: 14 }, props.style]} {...props} />
);