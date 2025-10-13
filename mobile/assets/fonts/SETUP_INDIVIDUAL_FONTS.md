# Setting Up Individual Font Weights for React Native

## Step 1: Download Static Font Files

1. Go to: https://fonts.google.com/specimen/Lexend
2. Click "Download family"
3. In the downloaded folder, look for the `static` directory
4. You need these specific files from the `static` folder:
   - `Lexend-Regular.ttf` (for fontWeight: '400' or 'normal')
   - `Lexend-Medium.ttf` (for fontWeight: '500')
   - `Lexend-SemiBold.ttf` (for fontWeight: '600')
   - `Lexend-Bold.ttf` (for fontWeight: '700' or 'bold')

## Step 2: Replace Variable Font

1. Delete the current `Lexend-VariableFont_wght.ttf` from this directory
2. Copy the 4 static .ttf files listed above into this `assets/fonts/` directory

## Step 3: Clean and Re-link

```bash
# Clean previous font links
cd android
./gradlew clean
cd ..

# Re-link the fonts
npx react-native-asset

# For Android, the fonts should now be in:
# android/app/src/main/assets/fonts/
```

## Step 4: Rebuild the App

```bash
npm run android
```

## How React Native Maps Font Weights

React Native on Android uses this naming convention:
- `fontFamily: 'Lexend'` + `fontWeight: '400'` → looks for `Lexend-Regular.ttf`
- `fontFamily: 'Lexend'` + `fontWeight: '500'` → looks for `Lexend-Medium.ttf`  
- `fontFamily: 'Lexend'` + `fontWeight: '600'` → looks for `Lexend-SemiBold.ttf`
- `fontFamily: 'Lexend'` + `fontWeight: '700'` → looks for `Lexend-Bold.ttf`

## Important Notes

- Variable fonts (VariableFont_wght.ttf) don't work with React Native
- Each weight needs its own file
- File names must match exactly (case-sensitive)
- After adding new fonts, always clean and rebuild