/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
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

class App extends Component<AppProps> {
  constructor(props) {
    super(props);
    this.state = {
        location: "unknown",
        error: "",
        count: 0
    };

    this.handleQuery = this.handleQuery.bind(this);
  }

  handleQuery(event) {
    let app = this;
    Geolocation.getCurrentPosition(
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
      {enableHighAccuracy: true, maximumAge: 10000}
      );
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
                <Text style={styles.sectionTitle}>Requests: {this.state.count}</Text>
                <Text style={styles.sectionTitle}>Current location: {this.state.location}</Text>
                <Text style={styles.sectionTitle}>Error: {this.state.error}</Text>
                <Button title="get location" onPress={this.handleQuery} />
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
