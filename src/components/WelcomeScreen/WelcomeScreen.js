import './WelcomeScreen.css';
import { useState, useEffect } from 'react';
import firebase from "firebase/app";
import 'firebase/auth';
import 'firebase/storage'
import 'firebase/firestore'


export default function WelcomeScreens({onScreen, onRoomId}) {

  const [dropping, isDropping] = useState(false);
  const [file, setFile] = useState();
  const [loading, setLoading] = useState(false);

  const [loadingDots, setLoadingDots] = useState("...");


  //uploads file
  useEffect(() => {

    if(file) {
      uploadFile();
    }

    async function uploadFile() {

      setLoading(true);

      firebase.auth().signInAnonymously().then((obj) => {
        const storage = firebase.storage().ref();
        const fileRef = storage.child(file.lastModified + '.pdf');
  
        fileRef.put(file, obj.user.uid).then(() => {
          fileRef.getDownloadURL().then((filePath) => {
            const db = firebase.firestore();
            const collection = db.collection('rooms');
            collection.add({
              admin: obj.user.uid,
              file: filePath,
              partecipants: 1,
              page: 1,
              password: "",
              scrollEnabled: false,
              pointerEnabled: false
      
            }).then((docRef) => {
              onRoomId(docRef.id);
              setLoading(false);
              onScreen("roomsetup");
            })
          });
    
        });
      })

    }

  }, [file, onScreen,onRoomId])


  // Updates dots in loading sign
  useEffect(() => {

    let timeout;

    if(loading) {
      timeout = setTimeout(() => {
        if(loadingDots.length === 1) {
          setLoadingDots("..");
        }
        if(loadingDots.length === 2) {
          setLoadingDots("...");
        }
        if(loadingDots.length === 3) {
          setLoadingDots(".");
        }
      }, 500)
    }

    return () => clearTimeout(timeout);

  }, [loading, loadingDots])


  function onDropHandler(e) {
    isDropping(false);
    e.preventDefault();
    if(e.dataTransfer.files[0].type === "application/pdf") {
      setFile(e.dataTransfer.files[0]);
    }
    else {
      alert("Please drop a pdf file!");
    }
  }


  function onDragOverHandler(e) {
    e.preventDefault();
    isDropping(true);
  }


  function onDragLeaveHandler(e) {
    e.preventDefault();
    isDropping(false);
  }


  function renderDropArea() {

    if(loading) {
      return <p className="loadingOnDropArea">Loading{loadingDots}</p>
    }

    return(
      <>
        <h3 className="dropAreaText">Drop pdf file here 📥</h3>
        <h3 className="dropAreaText">or</h3>
        <h3 className="dropAreaTextMobile">Upload a file here 📥</h3>
        <input className="inputFile" type="file" accept="application/pdf" onChange={(e) => handleSelectFile(e)}/>
      </>
    )
    
  }


  function handleSelectFile(e) {
    setFile(e.target.files[0]);
  }


  return(
    <div className="welcomeScreen">
      <h1 className="instructions">Drop a pdf here, share the link and read it with whoever you want!📄</h1>
      <div 
        className={dropping ? "dropAreaOnDragOver" : "dropArea"} 
        onDrop={(e) => onDropHandler(e)}
        onDragOver={(e) => onDragOverHandler(e)}
        onDragLeave={(e) => onDragLeaveHandler(e)}>
        {renderDropArea()}
      </div>
    </div>
  )

}