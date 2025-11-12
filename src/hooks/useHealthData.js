// useHealthData - scaffold for reading Google Fit (Android) and HealthKit (iOS)
//
// Install native libraries in your project after running `expo prebuild`:
//  - For Google Fit (Android): react-native-google-fit (https://github.com/StasDoskalenko/react-native-google-fit)
//  - For HealthKit (iOS): react-native-health (https://github.com/agencyenterprise/react-native-health) or equivalent
//
// Example usage:
//  const { requestPermissions, readSteps, readHeartRate } = useHealthData();
//  await requestPermissions();
//  const steps = await readSteps();
//
import { Platform } from 'react-native';

export function useHealthData() {
  async function requestPermissions() {
    if (Platform.OS === 'android') {
      // After prebuild, install and link react-native-google-fit and request runtime permissions.
      console.log('Request Google Fit permissions: install and configure react-native-google-fit');
      return false;
    } else if (Platform.OS === 'ios') {
      console.log('Request HealthKit permissions: install and configure react-native-health');
      return false;
    }
    return false;
  }

  async function readSteps(startDate = new Date(Date.now() - 7*24*60*60*1000), endDate = new Date()) {
    if (Platform.OS === 'android') {
      // Use react-native-google-fit APIs after installation, e.g. GoogleFit.getDailyStepCountSamples
      return [{ date: new Date().toISOString(), steps: 1234 }];
    } else if (Platform.OS === 'ios') {
      // Use react-native-health APIs to read HKQuantityTypeIdentifierStepCount
      return [{ date: new Date().toISOString(), steps: 1234 }];
    }
    return [];
  }

  async function readHeartRate(startDate, endDate) {
    // similar to readSteps; return mocked data until native libs are installed
    return [{ date: new Date().toISOString(), hr: 68 }];
  }

  return { requestPermissions, readSteps, readHeartRate };
}

export default useHealthData;
