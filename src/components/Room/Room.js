import './Room.css';
import copyIcon from '../../images/copy.png';
import zoomOutIcon from '../../images/zoom-out.png';
import zoomInIcon from '../../images/zoom-in.png';
import settingsIcon from '../../images/settings.png';
import { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


export default function Room({roomId, roomPsw}) {

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scalePage, setScalePage] = useState(0.9);

  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [pointerEnabled, setPointerEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [insertedPassword, setInsertedPassword] = useState("");

  const document = useRef();
  const settings = useRef();

  const [pointerPositionPercentage, setPointerPositionPercentage] = useState({x: 0, y: 0});

  const [admin, setAdmin] = useState(false);

  const [fileUrl, setFileUrl] = useState();

  const [viewers, setViewers] = useState();

  const [haveYouUpdated, setHaveYouUpdated] = useState(false);

  const [mobile, isMobile] = useState(false);

  const [settingPopup, setSettingPopup] = useState(false);

  const shareLink = "https://readpdftogether.web.app/" + roomId;


  // Detect screen size
  useEffect(() => {

    if(window.innerWidth <= 480) {
      isMobile(true);
    }

    if(mobile) {
      setScalePage(0.4);
    }

  }, [mobile])


  // Changes path on the browser
  useEffect(() => {
    window.history.pushState(null, "React App", roomId);
  }, [roomId])


  // Get file url and room's settings
  useEffect(() => {

    const db = firebase.firestore();
    db.collection('rooms').doc(roomId).get().then((snap) => {
      const data = snap.data();
      if(data == null) {
        alert("Are you sure about the link you have inserted? 🤔\r\n Try to change link and reload the page :)");
        return;
      }
      setFileUrl(data.file);
      setScrollEnabled(data.scrollEnabled);
      setPassword(data.password);
      setPointerEnabled(data.pointerEnabled);
    })

  }, [roomId]);


  // Update viewers counter
  useEffect(() => {

    async function incrementCounterInDatabase() {

      const db = firebase.firestore();
      db.collection('rooms').doc(roomId).get().then((snap) => {
        const data = snap.data();
        firebase.auth().onAuthStateChanged(function(user) {
          if (user) {
            if(user.uid !== data.admin) {
              db.collection('rooms').doc(roomId).set({
                partecipants: data.partecipants + 1,
              }, { merge: true })
            }
            else {
              setAdmin(true);
            }
          }
        });
      })
      
    }

    async function incrementCounterInApp() {

      const db = firebase.firestore();
      db.collection('rooms').doc(roomId).onSnapshot((snap) => {
        if(!isNaN(snap.data().partecipants)) {
          setViewers(snap.data().partecipants);
        }
        setScrollEnabled(snap.data().scrollEnabled);
        setPointerEnabled(snap.data().pointerEnabled);
      })
      
    }

    incrementCounterInDatabase();
    incrementCounterInApp();  
    
  }, [roomId]);


  // Update pageNumber based on database's page
  useEffect(() => {

    async function setPageNumberFromDatabase() {
      const db = firebase.firestore();
      db.collection("rooms").doc(roomId).onSnapshot((snap) => {
        setPageNumber(snap.data().page);
      })
    }

    if(!haveYouUpdated) {
      setPageNumberFromDatabase();
    } else {
      setHaveYouUpdated(false);
    }

  }, [pageNumber, roomId, haveYouUpdated]);


  // Update page's number
  useEffect(() => {

    async function updatePagesInDatabase() {
      
      const db = firebase.firestore();
      
      db.collection("rooms").doc(roomId).set({
        page: pageNumber,
      }, { merge: true })

    }

    if((scrollEnabled && haveYouUpdated) || admin) {
      updatePagesInDatabase();
    }

  }, [roomId, pageNumber, scrollEnabled, admin, haveYouUpdated, viewers]);


  // Decrements partecipants in database when user lefts
  useEffect(() => {

    async function decrementCounterInDatabase() {

      const db = firebase.firestore();
        
      if(viewers === 1) {
        db.collection("rooms").doc(roomId).delete();
        return;
      }

      db.collection('rooms').doc(roomId).get().then((snap) => {
        const data = snap.data();
        db.collection('rooms').doc(roomId).set({
          partecipants: data.partecipants - 1,
        }, { merge: true });
      })

    }

    window.addEventListener("beforeunload", (ev) => {
      ev.preventDefault();
      decrementCounterInDatabase();
    });


  }, [roomId, viewers])


  // Change mouse move position
  useEffect(() => {

    if(admin && pointerEnabled) {
      document.current.addEventListener('mousemove', e => {
        if(document.current.clientWidth !== 0 && document.current.clientHeight !== 0) {
          updatePointerPosition(e);
        }
      })
    }

    async function updatePointerPosition(dim) {

      const db = firebase.database();
      db.ref('rooms/' + roomId).set({
        pointerPercentageX: dim.offsetX/document.current.clientWidth,
        pointerPercentageY: dim.offsetY/document.current.clientHeight
      })

    }

  }, [admin, roomId, pointerEnabled, pointerPositionPercentage])


  // Update pointer position for viewers
  useEffect(() => {

    if(!admin && pointerEnabled) {
      updatePointerPosition();
    }

    async function updatePointerPosition() {

      const db = firebase.database();
      db.ref('rooms/' + roomId).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data != null) {
          const x = data.pointerPercentageX;
          const y = data.pointerPercentageY;
          setPointerPositionPercentage({x, y});
        }
      })
      
    }

  }, [roomId, admin, pointerEnabled])


  // Scroll to settings popup when it opens
  useEffect(() => {

    if(settings.current != null && settingPopup) {
      settings.current.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }

  }, [settingPopup])


  // Updated settings when admin edits them
  useEffect(() => {
    
    async function updateSettings() {
      const db = firebase.firestore();
      db.collection("rooms").doc(roomId).set({
        scrollEnabled: scrollEnabled,
        pointerEnabled: pointerEnabled
      }, { merge: true })
    }

    if(settingPopup && admin) {
      updateSettings();
    }

  }, [roomId, scrollEnabled, pointerEnabled, admin, settingPopup])


  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }


  function renderDocument() {

    if(insertedPassword !== password && !admin) {
      return(
        <div className="passwordBox">
          <h3>This room is protected by a password:</h3>
          <input type="password" className="pswChecker" onChange={(e) => setInsertedPassword(e.target.value)}/>
        </div>
      )
    }

    if(fileUrl !== undefined) {
      return(
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} scale={scalePage} />
        </Document>
      )
    }

  }


  function updateScalePage(sign) {

    const minScale = mobile ? 0.4 : 0.8;
    const maxScale = mobile ? 1.4 : 1.8;

    if(scalePage < minScale) {
      if(sign === "+") {
        setScalePage(scalePage + 0.1)
      }
      return;
    }

    if(scalePage > maxScale) {
      if(sign === "-") {
        setScalePage(scalePage - 0.1)
      }
      return;
    }

    if(sign === "+") {
      setScalePage(scalePage + 0.1)
    }

    if(sign === "-") {
      setScalePage(scalePage - 0.1)
    }

  }


  function renderMinus() {

    const minScale = mobile ? 0.4 : 0.8;

    if(scalePage < minScale) {
      return <img className="plusAndMinusDisabled" alt="zoom-out" src={zoomOutIcon} height={20} width={20} />
    }
    else {
      return <img className="plusAndMinus" alt="zoom-out" src={zoomOutIcon} onClick={() => updateScalePage('-')} height={20} width={20} />
    }

  }


  function renderPlus() {

    const maxScale = mobile ? 1.4 : 1.8;

    if(scalePage > maxScale) {
      return <img className="plusAndMinusDisabled" alt="zoom-in" src={zoomInIcon} height={20} width={20} />
    }
    else {
      return <img className="plusAndMinus" alt="zoom-in" src={zoomInIcon} height={20} width={20} onClick={() => updateScalePage('+')} />
    }

  }


  function renderPrev() {

    if(numPages === 1 || (scrollEnabled === false && !admin)) {
      return(
        <p className="nextAndPrevDisabled">&lt;</p>
      )
    }
    if(pageNumber === numPages) {
      return(
        <p className="nextAndPrev" onClick={() => {setPageNumber(pageNumber - 1); setHaveYouUpdated(true);}}>&lt;</p>
      )
    }
    if(pageNumber === 1) {
      return(
        <p className="nextAndPrevDisabled">&lt;</p>
      )
    }
    else {
      return(
        <p className="nextAndPrev" onClick={() => {setPageNumber(pageNumber - 1); setHaveYouUpdated(true);}}>&lt;</p>
      )
    }

  }


  function renderNext() {
    
    if((numPages === 1 || scrollEnabled === false) && !admin) {
      return(
        <p className="nextAndPrevDisabled">&gt;</p>
      )
    }
    if(pageNumber === numPages) {
      return(
        <p className="nextAndPrevDisabled">&gt;</p>
      )
    }
    if(pageNumber === 1) {
      return(
        <p className="nextAndPrev" onClick={() => {setPageNumber(pageNumber + 1); setHaveYouUpdated(true);}}>&gt;</p>
      )
    }
    else {
      return(
        <p className="nextAndPrev" onClick={() => {setPageNumber(pageNumber + 1); setHaveYouUpdated(true);}}>&gt;</p>
      )
    }

  }


  function renderPointer() {

    if(admin || document.current == null || numPages == null) {
      return;
    }

    if(!pointerEnabled) {
      return;
    }

    return(
      <div className="pointer" style={{
        left: document.current.clientWidth*pointerPositionPercentage.x,
        top: document.current.clientHeight*pointerPositionPercentage.y
        }}
      />
    )

  }


  function renderSettingsPopup() {

    if(!settingPopup) {
      return;
    }

    return(

      <>

        <style jsx global>{`
          body {
            overflow: hidden;
          }
        `}</style>

        <div className="greyBackground" onClick={() => setSettingPopup(false)} />

        <div className="settingsContainer" ref={settings}>

          <div className="rule">
            <h4 className="ruleText">Allow partecipants to move between pages</h4>
            <label className="switch">
              {scrollEnabled ? 
                <input type="checkbox" checked onChange={() => setScrollEnabled(!scrollEnabled)} /> :
                <input type="checkbox" onChange={() => setScrollEnabled(!scrollEnabled)} />
              }
              <span className="slider round"></span>
            </label>
          </div>

          <div className="rule">
            <h4 className="ruleText">Laser pointer (visible only by partecipants): </h4>
            <label className="switch">
              {pointerEnabled ? 
                <input type="checkbox" checked onChange={() => setPointerEnabled(!pointerEnabled)} /> : 
                <input type="checkbox" onChange={() => setPointerEnabled(!pointerEnabled)} />
              }
              <span className="slider round"></span>
            </label>
          </div>

        </div>

      </>

    )

  }


  return(
    <div className="room">

      {renderSettingsPopup()}
              
      <div>
        {mobile ? null : renderPrev()}
      </div>

      <div className="pdfViewer">
        
        <div className="shareLinkContainer">
          {!admin ? null : 
            <div className="settingsIconContainer">
              <img alt="settings-icon" src={settingsIcon} height={20} width={20} onClick={() => setSettingPopup(!settingPopup)}/>
            </div>
          }
          <div className="shareLink">
            <h4>{roomId}</h4>
          </div>
          <div className="copyIconContainer">
            <CopyToClipboard text={shareLink}>
              <img alt="copy-icon" src={copyIcon} height={20} width={20} />
            </CopyToClipboard>
          </div>
        </div>

        <h5>Actual viewers: {viewers} 👁️</h5>
        
        <div className="documentContainer" ref={document}>
          {renderPointer()}
          {renderDocument()}
        </div>

        <div className="controls">
          {mobile ? renderPrev() : null}
          {renderMinus()}
          <p>{pageNumber} / {numPages == null ? "..." : numPages}</p>
          {renderPlus()}
          {mobile ? renderNext() : null}
        </div>

      </div>

      <div>
        {mobile ? null : renderNext()}
      </div>

    </div>
  )
  
}
