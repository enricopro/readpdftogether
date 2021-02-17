import './RoomSetup.css';
import { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/database';


export default function RoomSetup({onScreen, roomId, onRoomPsw}) {

  const [scroll, setScroll] = useState(false);
  const [wantPassword, setWantPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [pointer, setPointer] = useState(false);
  
  const pswInput = useRef();


  useEffect(() => {

    const input = pswInput.current;

    if(input != null && password !== "") {
      input.addEventListener('keyup', (e) => {
        if(e.keyCode === 13) {
          setSetupCompleted(true);
        }
      })
    }

    return () => {
      if(input != null) {
        input.removeEventListener('keyup', () => {});
      }
    }

  }, [password])


  // Setup room settings
  useEffect(() => {

    if(setupCompleted) {
      setupRoom();
    }

    async function setupRoom() {

      const db = firebase.firestore();
      const docRef = db.collection('rooms').doc(roomId);

      docRef.set({
        password: password,
        scrollEnabled: scroll,
        pointerEnabled: pointer
      }, { merge: true }).then(() => {
        onRoomPsw(password);
        onScreen("room");
      })

    }

  }, [setupCompleted, password, roomId, scroll, pointer, onScreen, onRoomPsw])


  function renderPasswordInput() {

    if(!wantPassword) {
      return;
    }

    return (
      <div className="rule">
      <h4 className="ruleText">Set password</h4>
      <input ref={pswInput} className="pswInput" type="password" onChange={(e) => {setPassword(e.target.value)}}/>
    </div>
    )

  }


  return(
    <div className="roomSetup">

      <h2 className="roomSetupTitle">How do you want to setup your room?</h2>
      
      <div className="rule">
        <h4 className="ruleText">Allow partecipants to move between pages</h4>
        <label className="switch">
          <input type="checkbox" onClick={() => setScroll(!scroll)} />
          <span className="slider round"></span>
        </label>
      </div>

      <div className="rule">
        <h4 className="ruleText">Laser pointer (visible only by partecipants): </h4>
        <label className="switch">
          <input type="checkbox" onClick={() => setPointer(!pointer)} />
          <span className="slider round"></span>
        </label>
      </div>

      <div className="rule">
        <h4 className="ruleText">Password to join</h4>
        <label className="switch">
          <input type="checkbox" onClick={() => setWantPassword(!wantPassword)} />
          <span className="slider round"></span>
        </label>
      </div>

      <h4 className="disclaimer">** The room will be deleted as soon as everybody leave **</h4>

      

      {renderPasswordInput()}

      <div className="doneButton" onClick={() => setSetupCompleted(true)}>DONE</div>

    </div>
  )

}
