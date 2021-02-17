import './App.css';
import Room from './components/Room/Room';
import RoomSetup from './components/RoomSetup/RoomSetup';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import { useEffect, useState } from 'react';
import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';

export default function App() {

  const [screen, setScreen] = useState("welcomescreen");
  const [roomId, setRoomId] = useState();
  const [roomPsw, setRoomPsw] = useState("");


  // Initialize Firebase
  useEffect(() => {
    var firebaseConfig = {
      apiKey: "AIzaSyChb_vyvWjZyyOFQBVpt5uHirlK_2JoRBs",
      authDomain: "readpdftogether.firebaseapp.com",
      projectId: "readpdftogether",
      storageBucket: "readpdftogether.appspot.com",
      messagingSenderId: "375705951763",
      appId: "1:375705951763:web:d8d35296f009cb23f829e6",
      measurementId: "G-5W8J6E5JP4",
      databaseURL: "https://readpdftogether-default-rtdb.europe-west1.firebasedatabase.app"
    };

    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
  }, [])


  // Check if we are logging in a room
  useEffect(() => {

    if(window.location.href.length > 32) {
      setRoomId(window.location.href.substring(32));
      setScreen("room");
      firebase.auth().signInAnonymously();
    }

  }, [])


  function renderScreens() {
    if(screen === "welcomescreen") {
      return <WelcomeScreen onScreen={setScreen} onRoomId={setRoomId}/>
    }
    else if(screen === "roomsetup") {
      return <RoomSetup onScreen={setScreen} roomId={roomId} onRoomPsw={setRoomPsw}/>
    }
    else if(screen === "room") {
      return <Room roomId={roomId} roomPsw={roomPsw}/>
    }
  }


  return (
    <div className="app">
      {renderScreens()}
    </div>
  );
}
