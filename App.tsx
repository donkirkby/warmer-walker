/**
 * Warmer Walker app: walk around your neighbourhood playing warmer / colder.
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
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import GoalTracker, { Clue } from "./GoalTracker";

declare const global: {HermesInternal: null | {}};

type AppProps = {

};

type AppState = {
  clueCount: number,
  clue: string,  // warmer, colder, or found!
  location: string,
  error: string,
  positionCount: number,
  goalTracker?: GoalTracker
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
        clueCount: 0,
        location: "",
        clue: "",
        error: "",
        positionCount: 0
    };
  }

  componentDidMount() {
    this.requestLocationPermission();
  }

  async requestLocationPermission() {
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
        this.registerPositionWatcher();
      } else {
        this.setState({error: "Permission denied for precise location."})
      }
    } catch (err) {
      console.warn(err);
      this.setState({error: "Unexpected error occurred."})
    }
  }
  
  registerPositionWatcher() {
    let app = this;
    Geolocation.watchPosition(
      (pos) => {
        let goalTracker = app.state.goalTracker;
        if (goalTracker === undefined) {
          goalTracker = new GoalTracker(pos.coords, 100).chooseGoal(1000);
        }

        let clue = goalTracker.updatePosition(pos.coords);
        if (clue !== Clue.None) {
          app.setState({
            clue: Clue[clue],
            clueCount: this.state.clueCount + 1
          });
        }
        app.setState({
          location: pos.coords.latitude + "; " + pos.coords.longitude,
          error: "",
          positionCount: this.state.positionCount + 1,
          goalTracker: goalTracker
        })
      },
      (err) => {
        console.warn(err);
        app.setState({
          error: "Failed to update position: " + err.message,
          positionCount: this.state.positionCount + 1
        })
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10 // meters
      }
    )
  }

  onNext = () => {
    if (this.state.goalTracker !== undefined) {
      this.setState({
        goalTracker: this.state.goalTracker.chooseGoal(1000),
        clueCount: 0
      });
    }
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
                <Text style={styles.sectionTitle}>Clue: {this.state.clue}</Text>
                <Text style={styles.sectionTitle}>Count: {this.state.clueCount}</Text>
                <Button title="Next" onPress={this.onNext} />
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
