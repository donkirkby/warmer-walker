/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { Component } from "react";
import {
  Button,
  PermissionsAndroid,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Geolocation from 'react-native-geolocation-service';

declare const global: {HermesInternal: null | {}};

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Warmer Walker Location Permission",
        message:
          "Warmer Walker needs access to your precise " +
          "location so it can tell how close you are to the targets.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use the location");
    } else {
      console.log("Location permission denied");
    }
  } catch (err) {
    console.warn(err);
  }
};

type AppProps = {

};

type AppState = {
  location: string,
  error: string,
  count: number
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
        location: "unknown",
        error: "",
        count: 0
    };
  }

  componentDidMount() {
    let app = this;
    Geolocation.watchPosition(
      (pos) => {
        app.setState({
          location: pos.coords.latitude + "; " + pos.coords.longitude,
          error: "",
          count: app.state.count+1
        })
      },
      (err) => {
        app.setState({
          error: "Failed to update: " + err.message,
          count: app.state.count+1
        })
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10 // meters
      }
    )
  }

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}>
            <Header />
            {global.HermesInternal == null ? null : (
              <View style={styles.engine}>
                <Text style={styles.footer}>Engine: Hermes</Text>
              </View>
            )}
            <View style={styles.body}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Try permissions</Text>
                <Button title="request permissions" onPress={requestLocationPermission} />
              </View>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Updates: {this.state.count}</Text>
                <Text style={styles.sectionTitle}>Current location: {this.state.location}</Text>
                <Text style={styles.sectionTitle}>Error: {this.state.error}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
