/**
 * Warmer Walker app: walk around your neighbourhood playing warmer / colder.
 *
 * @format
 */

import React, { Component } from "react";
import {
  Button,
  Modal,
  PermissionsAndroid,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  Text,
  StatusBar,
  Image
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import Geolocation from 'react-native-geolocation-service';
import GoalTracker, {GoalEmojis} from "./GoalTracker";
import { getLatitude, getLongitude } from "geolib";
import Sound from 'react-native-sound';
import { IImageInfo } from "react-native-image-zoom-viewer/built/image-viewer.type";

const STREET_ACCESS = "s-IOITSzOU7t4rwDHK5rIo1OuxHLZhS3BySazIA".split('').reverse().join(''),
  MAX_GOAL_DISTANCE = 1000,  // Distance to goal, in meters.
  STEP_SIZE = 100;  // Distance between clues, in meters.
declare const global: {HermesInternal: null | {}};

Sound.setCategory('Playback');

type AppProps = {

};

type AppState = {
  isModalVisible: boolean,
  clue: string,  // warmer, colder, or found!
  location: string,
  error: string,
  positionCount: number,
  goalTracker?: GoalTracker,
  allGoalTrackers: GoalTracker[],
  goalImages: IImageInfo[],
  warmer: Sound,
  colder: Sound,
  found: Sound
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    let warmer = loadSound('warmer.mp3'),
      colder = loadSound('colder.mp3'),
      found = loadSound('found.mp3');
    
    this.state = {
        isModalVisible: false,
        location: "",
        clue: "",
        error: "",
        positionCount: 0,
        allGoalTrackers: [],
        goalImages: [],
        warmer: warmer,
        colder: colder,
        found: found
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
          goalTracker = new GoalTracker(pos.coords, STEP_SIZE);
          app.setState({goalTracker: goalTracker});
          this.onNext();
        }
        else {
          app.state.allGoalTrackers.forEach(tracker => {
            tracker.updatePosition(pos.coords);
          });
          app.setState({
            clue: goalTracker.clue
          });
          if (goalTracker.sound === GoalEmojis.WARMER) {
            this.state.warmer.play();
          }
          else if (goalTracker.sound === GoalEmojis.COLDER) {
            this.state.colder.play();
          }
          else if (goalTracker.sound === GoalEmojis.FOUND) {
            this.state.found.play();
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
      this.setState({
        clue: "Scanning"
      });
      this.state.colder.play();
      // this.state.goalTracker.chooseGoal(MAX_GOAL_DISTANCE);
      let goalsExpected = 3,
        allGoalTrackers = [];
      for (let goalNum = 0; goalNum < goalsExpected; goalNum++) {
        let goalTracker = new GoalTracker(
          this.state.goalTracker.currentPosition,
          STEP_SIZE).chooseGoal(MAX_GOAL_DISTANCE);
        try {
          let apiUrl = new URL("https://maps.googleapis.com/maps/api/"),
            metadataPath = "streetview/metadata",
            imagePath = "streetview",
            goalPosition = goalTracker.goalPosition;
          let goalLatitude = getLatitude(goalPosition),
            goalLongitude = getLongitude(goalPosition);
          metadataPath += `?location=${goalLatitude},${goalLongitude}`;
          metadataPath += `&key=${STREET_ACCESS}`;
          let metadataResponse = await fetch(new URL(metadataPath, apiUrl.href).href);
          let json = await metadataResponse.json();
          goalLatitude = json.location.lat;
          goalLongitude = json.location.lng;
          imagePath += `?location=${goalLatitude},${goalLongitude}`;
          imagePath += `&size=600x600`;
          imagePath += `&key=${STREET_ACCESS}`;
          let startHeading = Math.random() * 360;
          for (let imageNum = 0; imageNum < 4; imageNum++) {
            let headingPath = imagePath + `&heading=${imageNum * 90 + startHeading}`;
            goalTracker.imageUrls.push(new URL(headingPath, apiUrl.href).href);
          }
        } catch (error) {
          console.error('Error fetching image: ' + error);
          this.setState({
            clue: "",
            goalImages: [],
            error: "No street view."
          })
        }
        allGoalTrackers.push(goalTracker);
      }
      let goalTracker = allGoalTrackers[0];
      this.setState({
        clue: "Ready",
        allGoalTrackers: allGoalTrackers,
        goalTracker: goalTracker,
        goalImages: wrapImages(goalTracker.imageUrls)
      });
    }
  }

  onChooseGoal = (goalTracker: GoalTracker) => {
    this.setState({
      goalTracker: goalTracker,
      goalImages: wrapImages(goalTracker.imageUrls),
      clue: goalTracker.clue
    })
  }

  onShowModal = () => {
    this.setState({isModalVisible: true})
  }

  onCancelModal = () => {
    this.setState({isModalVisible: false})
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
                { this.state.goalImages.length == 0 ? null : (
                  <View>
                    <Modal visible={this.state.isModalVisible} transparent={true}>
                      <ImageViewer
                        imageUrls={this.state.goalImages}
                        enableSwipeDown={true}
                        onCancel={this.onCancelModal} />
                    </Modal>
                    <TouchableWithoutFeedback onPress={this.onShowModal}>
                      <Image
                        style={styles.streetView}
                        source={{uri: this.state.goalImages[0].url}} />
                    </TouchableWithoutFeedback>
                  </View>
                )}
                
                <Text style={styles.sectionTitle}>Clue: {this.state.clue}</Text>
                <Text style={styles.sectionTitle}>Progress: {this.state.goalTracker?.clueProgress}</Text>
                <Text style={styles.sectionTitle}>Error: {this.state.error}</Text>
                {this.state.allGoalTrackers.map((goalTracker, goalNum) => (
                  <Button
                    key={`goal${goalNum+1}`}
                    title={`${goalTracker.emoji} Goal ${goalNum+1}`}
                    onPress={() => this.onChooseGoal(goalTracker)} />
                ))}
                <Button title="Next" onPress={this.onNext} />
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

function loadSound(fileName: string) {
  return new Sound(fileName, Sound.MAIN_BUNDLE, (error: any) => {
    if (error) {
      console.log('failed to load the sound', error);
      return;
    }
  });
}

function wrapImages(urls: string[]): IImageInfo[] {
  return urls.map(url => ({url: url, width: 600, height: 600}));
}

export default App;
