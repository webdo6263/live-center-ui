import './App.css';
import { useEffect, useState } from 'react';

const CHAT_URL = `ws://${window.location.hostname}:3030`
const ws = new WebSocket(CHAT_URL)
function App() {
  const [messages, setMessages] = useState([])
  const [enteredText, setEnteredText] = useState('')
  const [userIp, setUserIp] = useState('')

  const handleEnteredText = (e) => {
    setEnteredText(e.target.value)
  }

  const handleMessageSend = () => {
    const data = {
      type: 'add-msg',
      text: enteredText,
      displayName: 'myself' + Date.now(),
      userIp
    }
    console.log('data being sent', data)
    ws.send(JSON.stringify(data))
  }

  useEffect(()=> {
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
        case 'add-failed': {
          alert('failed to send message due to ', parsedData.reason)
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
  ////{`${text} from ${displayName} at ${createdAt}`}
  return (
    <div className="App">
      <h1>Connect</h1>
      <ul className='messages-container'>
        {
          messages.map(({text, displayName, createdAt, userIp: msgUserIp}) => (
            <li key={displayName} className={`message-container ${msgUserIp === userIp ? 'you' : 'others'}`}>
              <div className='message-wrapper'>
                <span className='avatar'>{displayName.substr(0, 2)}</span>
                <span className='text'>{text}</span>
                <span className='timestamp'>{new Date(createdAt).toLocaleString()}</span>
              </div>
            </li>
          ))
        }
      </ul>
      <div className='controls-container'>
        <input type='text' value={enteredText} onChange={handleEnteredText} />
        <button onClick={handleMessageSend}>Send</button>

      </div>
    </div>
  );
}

export default App;
