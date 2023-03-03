import './App.css';
import { useEffect, useState, useRef } from 'react';

const CHAT_URL = `ws://${window.location.hostname}:3030`
const ws = new WebSocket(CHAT_URL)
function App() {
  const [messages, setMessages] = useState([])
  const [enteredText, setEnteredText] = useState('')
  const [name, setName] = useState('John Doe')
  const [userIp, setUserIp] = useState('')
  const msgContainerRef = useRef()

  const handleEnteredText = (e) => {
    setEnteredText(e.target.value)
  }
  const handleSubmit = event => {
    event.preventDefault(); 
  }

  const handleMessageSend = () => {
    const data = {
      type: 'add-msg',
      text: enteredText,
      displayName: name || 'John Doe',
      userIp
    }
    console.log('data being sent', data)
    setEnteredText('')
    ws.send(JSON.stringify(data))
  }

  useEffect(() => {
    msgContainerRef?.current?.lastChild?.scrollIntoView()
  }, [messages]);

  useEffect(()=> {
    fetch('https://geolocation-db.com/json/')
      .then(response => response.json())
      .then(data => {
        console.log('setting user ip', data.IPv4)
        setUserIp(data.IPv4)
      })

    const queryParams = new URLSearchParams(window.location.search)
    const name = queryParams.get('name')
    if (name) setName(name)
      
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

  return (
    <div className="App">
      <h1>Connect</h1>
      <ul ref={msgContainerRef} className='messages-container'>
        {
          messages?.map(({text, displayName, createdAt, userIp: msgUserIp}) => (
            <li key={displayName} className={`message-container ${msgUserIp === userIp ? 'you' : 'others'}`}>
              <div className='message-wrapper'>
                <span className='avatar'>{displayName?.substr(0, 2)}</span>
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
  );
}

export default App;
