import './App.css';
import { useEffect, useState, useRef } from 'react';

const getRandomCharacterCode = () => {
  return 'a'.charCodeAt(0) + Math.floor((Math.random() * 100) % 26)
}

const getRandomCharacters = (charCount) => {
  let randomChars = []
  while(charCount--) {
    randomChars.push(getRandomCharacterCode())
  }
  return String.fromCharCode(...randomChars)
}

const CHAT_URL = `ws://${window.location.hostname}:3030`
const ws = new WebSocket(CHAT_URL)
function App() {
  const [messages, setMessages] = useState([])
  const [enteredText, setEnteredText] = useState('')
  const [name, setName] = useState('')
  const [userIp, setUserIp] = useState('')
  const [userId, setUserId] = useState('')
  const [userCount, setUserCount] = useState(0)
  const [isLiveChatShown, setIsLiveChatShown] = useState(false)
  const msgContainerRef = useRef()
  //const iframeContainerRef = useRef()
  const [isIframeLoaded, setIsFrameLoaded] = useState(false)

  const handleIframeLoad = () => {
    //console.log(iframeContainerRef.current.contentWindow.LITHIUM.CommunityJsonObject.User)
    setIsFrameLoaded(true)
  }

  const handleEnteredText = (e) => {
    setEnteredText(e.target.value)
  }
  const handleSubmit = event => {
    event.preventDefault(); 
  }

  const handleAskLive = () => {
    setIsLiveChatShown(!isLiveChatShown)
  }

  const handleMessageSend = () => {
    if (!(enteredText?.trim())) return
    const data = {
      type: 'add-msg',
      text: enteredText,
      displayName: name || 'John Doe',
      userIp,
      userId
    }
    console.log('data being sent', data)
    setEnteredText('')
    ws.send(JSON.stringify(data))
    /*fetch('https://plino.herokuapp.com/api/v1/classify/', {
      method: "POST",
      mode: 'no-cors',
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        emai_text: enteredText 
      })
    })
      .then((response) => {
        console.log('spam checkkkkk', response)
        
      })
      .catch(err => {
        alert('Stop Spamming Spammer!!!!')
      })*/
  }

  useEffect(() => {
    msgContainerRef?.current?.lastChild?.scrollIntoView()
  }, [messages]);

  useEffect(()=> {
    let name = localStorage.getItem('community-live-center-name');
    if (!name) {
      name = getRandomCharacters(2);
      localStorage.setItem('community-live-center-name', name);
      setName(name)
    }

    let userId = localStorage.getItem('community-live-center-userId');
    if (!userId) {
      userId = getRandomCharacters(15);
      localStorage.setItem('community-live-center-userId', userId);
      setUserId(userId)
    }

    // ip stopped working
    fetch('https://geolocation-db.com/json/')
      .then(response => response.json())
      .then(data => {
        console.log('setting user ip', data.IPv4)
        setUserIp(data.IPv4)
      })
      
    ws.onerror = error => {
      console.log(`WebSocket error: ${error}`)
    }
    ws.onopen = () => {
      console.log('connected')
    }

    ws.onmessage = ({data}) => {
      //const message = JSON.parse(evt.data)
      //this.addMessage(message)
      const parsedData = JSON.parse(data)
      console.log('msg received', parsedData)
      switch(parsedData?.type) {
        case 'all-msgs': {
            setMessages(parsedData.messages)
            break;
        }
        case 'active-user-count': {
          setUserCount(+parsedData.activeUserCount)
          break;
        }
        case 'add-failed': {
          alert('Cannot send msg: ' + parsedData.reason)
          break
        }
        default: {
            console.log('invalid data type', parsedData?.type)
        }
    }
      
    }

    ws.onclose = () => {
      console.log('disconnected')
    }
  }, [])

  return (
    <div className="App">
      <iframe 
        className='communtiy-atlassian-iframe' 
        seamless="seamless" 
        title="main-community" 
        src="https://community.atlassian.com/" 
        onLoad={handleIframeLoad}
      ></iframe>
      {
        isIframeLoaded ? (
          <div>
            <button className='ask-live-button' onClick={handleAskLive}>Ask Live</button>
            {
              isLiveChatShown ? (
                <div className='community-live-center'>
                  <div className={`user-count ${userCount ? 'available': 'not-available'}`}>
                    <span className='status-icon'></span>
                    {userCount} user(/s) online
                  </div>
                  <ul ref={msgContainerRef} className='messages-container'>
                    {
                      messages?.map(({text, displayName, createdAt, userId: msguserId}) => (
                        <li key={msguserId} className={`message-container ${msguserId === userId ? 'you' : 'others'}`}>
                          <div className='message-wrapper'>
                            <span className='avatar'>{msguserId === userId ? 'ME' : displayName?.substr(0, 2)}</span>
                            <span className='text'>{text}</span>
                            <span className='timestamp'>{new Date(createdAt).toLocaleString()}</span>
                          </div>
                        </li>
                      ))
                    }
                  </ul>
                  <div className='controls-container'>
                    <form onSubmit={handleSubmit}>
                      <input className='input-text' type='text' value={enteredText} onChange={handleEnteredText} />
                      <button className='send-btn' type="submit" onClick={handleMessageSend}>Send</button>
                    </form>
                  </div>
                  <div className='notification-container'>
                    {
                      messages?.length ? null : (
                        <span className='info'>No messages to show. Start a conversation</span>
                      )
                    }
                  </div>
                </div>
              ) : null
            }
          </div>
        ) : null
      }
      
    </div>
  );
}

export default App;
