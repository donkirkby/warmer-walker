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
  Image
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import Geolocation from 'react-native-geolocation-service';
import GoalTracker, { Clue } from "./GoalTracker";
import { getLatitude, getLongitude } from "geolib";

const STREET_ACCESS = "s-IOITSzOU7t4rwDHK5rIo1OuxHLZhS3BySazIA".split('').reverse().join('');
declare const global: {HermesInternal: null | {}};

type AppProps = {

};

type AppState = {
  clueCount: number,
  clue: string,  // warmer, colder, or found!
  location: string,
  error: string,
  positionCount: number,
  goalTracker?: GoalTracker,
  goalUrl?: URL
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

  componentWillUnmount() {
    Geolocation.stopObserving();
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
          goalTracker = new GoalTracker(pos.coords, 100);
          app.setState({goalTracker: goalTracker});
          this.onNext();
        }
        else {
          let clue = goalTracker.updatePosition(pos.coords);
          if (clue !== Clue.None) {
            app.setState({
              clue: Clue[clue],
              clueCount: this.state.clueCount + 1
            });
          }
        }
        app.setState({
          location: pos.coords.latitude + "; " + pos.coords.longitude,
          error: "",
          positionCount: this.state.positionCount + 1
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

  onNext = async () => {
    if (this.state.goalTracker !== undefined) {
      this.state.goalTracker.chooseGoal(1000);

      this.setState({
        clue: "Scanning",
        clueCount: 0
      });
      try {
        let apiUrl = new URL("https://maps.googleapis.com/maps/api/"),
          metadataPath = "streetview/metadata",
          imagePath = "streetview",
          goalPosition = this.state.goalTracker.goalPosition;
        let goalLatitude = getLatitude(goalPosition),
          goalLongitude = getLongitude(goalPosition);
        metadataPath += `?location=${goalLatitude},${goalLongitude}`;
        metadataPath += `&key=${STREET_ACCESS}`;
        let metadataResponse = await fetch(new URL(metadataPath, apiUrl.href).href);
        let json = await metadataResponse.json();
        goalLatitude = json.location.lat;
        goalLongitude = json.location.lng;
        imagePath += `?location=${goalLatitude},${goalLongitude}`;
        imagePath += `&size=300x300`;
        imagePath += `&heading=${Math.random() * 360}`;
        imagePath += `&key=${STREET_ACCESS}`;
        this.setState({
          clue: "Ready",
          goalUrl: new URL(imagePath, apiUrl.href)
        });
      } catch (error) {
        console.error('Error fetching image: ' + error);
      }
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
            {global.HermesInternal == null ? null : (
              <View style={styles.engine}>
                <Text style={styles.footer}>Engine: Hermes</Text>
              </View>
            )}
            <View style={styles.body}>
              <View style={styles.sectionContainer}>
                { this.state.goalUrl === undefined ? null : (
                  <Image
                    style={styles.streetView}
                    source={{uri: this.state.goalUrl.href}} />
                )}
                
                <Text style={styles.sectionTitle}>Clue: {this.state.clue}</Text>
                <Text style={styles.sectionTitle}>Progress: {this.state.goalTracker?.clueProgress}</Text>
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
  streetView: {
    width: 300,
    height: 300
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
