import { Alert, Linking, Platform } from 'react-native';

export async function callNumber(phoneNumber: string): Promise<void> {
  const url = `tel:${phoneNumber}`;
  try {
    if (Platform.OS === 'web') {
      // Avoid RN Web's Linking implementation, which assigns window.location
      // directly for tel: links and can leave the tab stuck mid-navigation.
      // A transient anchor click lets the browser handle the custom scheme
      // without disrupting the current document.
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unable to place call', `Your device cannot dial ${phoneNumber}.`);
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Unable to place call', `Please dial ${phoneNumber} manually.`);
  }
}
