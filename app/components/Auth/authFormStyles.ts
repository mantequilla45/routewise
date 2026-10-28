import { StyleSheet } from 'react-native';

/** Styles shared by LoginForm and SignupForm and the pieces under components/Auth. */
export const authFormStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldContainer: {
    flexDirection: 'column', // stack children vertically
    justifyContent: 'flex-start', // start content from top
    alignItems: 'stretch', // stretch inputs to full width (or use 'flex-start' to align left)
    paddingBottom: 10, // space at the bottom
  },
  text: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    fontWeight: '400', // normal
    lineHeight: 12 * 1.6, // 160% → React Native needs a number, not %
    letterSpacing: -0.02 * 12, // -2% of font size
    color: '#FFFFFF',
    paddingBottom: 10,
  },
  emailtextbox: {
    fontSize: 16,
    fontFamily: 'Lexend_400Regular',
    paddingLeft: 10, // 10px padding to the left
    borderWidth: 2, // 2px border thickness
    borderColor: '#585756', // default black border, change if you want
    borderRadius: 8, // 8px corner radius
    height: 40, // optional: keeps the box nicely sized
    color: 'white',
  },
  passwordWrapper: {
    flexDirection: 'row', // input and eye icon in a row
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#585756',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  passwordtextbox: {
    flex: 1, // fills the remaining space
    fontSize: 16,
    fontFamily: 'Lexend_400Regular',
    paddingVertical: 8, // adjust instead of fixed height
    color: 'white',
  },
  eyeButton: {
    marginLeft: 10,
  },
  thirdcontainer: {
    flexDirection: 'row', // side by side
    justifyContent: 'space-between', // optional: space between them
    alignItems: 'center', // center vertically
    paddingBottom: 10,
  },
  firsthalf: {
    flex: 1, // takes 50% of width
    flexDirection: 'row', // checkbox + text in a row
    alignItems: 'center',
  },
  rememberText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 4, // spacing between icon and text
  },
  secondhalf: {
    flex: 1, // takes the other 50%
  },
  forgotText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#FFCC66', // golden color
    alignSelf: 'flex-end', // right-aligned
    fontWeight: '700', // bold
  },
  loginbutton: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
    backgroundColor: '#4C4C4C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginbuttonText: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    color: 'white',
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  dividersText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  linkText: {
    color: '#888888', // grey for links
    textDecorationLine: 'underline', // optional: makes it look clickable
  },
  googlebutton: {
    paddingVertical: 10, // same height as login button
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%', // 50% of parent container width
    alignSelf: 'center', // center horizontally
  },
  googlebuttonContent: {
    flexDirection: 'row', // logo + text in a row
    alignItems: 'center',
  },
  googleIcon: {
    marginRight: 4,
  },
  googlebuttonText: {
    color: 'black',
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
  },
});
