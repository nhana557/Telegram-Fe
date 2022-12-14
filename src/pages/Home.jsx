import '../assets/styles/home.css';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ListUser from '../components/ListUser';
import Profile from '../components/Profile';
import Chat from '../components/Chat';
import { getDetailReceiver, getDetailUser } from '../redux/actions/user';
import moment from 'moment';
export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { detailUser, detailReceiver } = useSelector((state) => state);
  const [queryParams] = useSearchParams();
  const [tab, setTab] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [socketio, setSocketio] = useState(null);
  const [message, setMessage] = useState('');
  const [listChat, setListChat] = useState([]);
  const [activeReceiver, setActiveReceiver] = useState('');

 console.log(notifications)

  useEffect(() => {
    document.title = `${process.env.REACT_APP_APP_NAME} - Home`;
    dispatch(getDetailUser(localStorage.getItem('id'), navigate));
  }, []);

  useEffect(() => {
    setTab('');
    if (queryParams.get('tab')) {
      setTab(queryParams.get('tab'));
    }
  }, [queryParams]);
 

  useEffect(() => {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder')

    const alert = (message, time, type) => {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible position-absolute w-25 start-50 content-alert" role="alert" id="note">`,
        `   <div class="text-white">
        <ul  >
          <li style='none '>${message}</li>
          <li>${time}</li>
        </ul>
          
        </div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
      ].join('')
  
      alertPlaceholder.append(wrapper)
    }

    const socket = io(process.env.REACT_APP_API_URL);
    socket.on('send-message-response', (response) => {
      const receiver = localStorage.getItem('receiver');
      
      if (response.length) {
        if (
          receiver === response[0].sender_id || receiver === response[0].receiver_id
        ) {
          
          console.log(response[response.length - 1].date)
          // console.log(moment(response[response.length - 1].date).format('LLL'))
          console.log(new Date().getTime().toLocaleString("en-US", "Asia/Jakarta"))
          console.log(new Date(response[response.length - 1].date).getTime().toLocaleString("en-US", "Asia/Jakarta"))
          const dateNow = new Date().getTime().toLocaleString("en-US", "Asia/Jakarta").split(',').slice(3, 4).toString()
          const dateChat = new Date(response[response.length - 1].date).getTime().toLocaleString("en-US", "Asia/Jakarta").split(',').slice(3,4).toString()
          console.log(dateNow)
          console.log(dateChat)
          if(dateChat === dateNow){
            localStorage.setItem("notif", true)
          if(localStorage.getItem('notif') === 'true'){
            alert(response[response.length - 1].chat, moment(response[response.length - 1].date).format('h:mm a'),'success')
            setTimeout(() =>{
              localStorage.removeItem("notif")
              const ceating = document.getElementById('note');
              // ceating.classList.toggle('d-none')
              ceating.remove()
              // ceating.classList.toggle('d-flex')
            }, 2500)

            // Swal.fire({
            //   // icon: "warning",
            //   title: response[response.length - 1].chat,
            //   confirmButtonText: "yes"
            // })
            // .then((result) =>{
            //   if(result.isConfirmed){

            //   }
            // })
           
            
          }else if(!localStorage.getItem('notif')){
            
          }
          }
          setListChat(response);

          setTimeout(() => {
            const elem = document.getElementById('chatMenuMessage');
            elem.scrollTop = elem.scrollHeight;
          }, 500);
          
          // setTimeout(() =>{

          // }, 1000)
          // socket.on("getNotification", (data) => {
          //   setNotifications((prev) =>{
          //     [...prev, data]
          //   });
          // });
        }
      }
    });
    setSocketio(socket);
  }, []);

  const selectReceiver = (receiverId) => {
    setListChat([]);
    dispatch(getDetailReceiver(receiverId));
    setActiveReceiver(receiverId);
    localStorage.setItem('receiver', receiverId);
    socketio.emit('join-room', localStorage.getItem('id'));
    socketio.emit('chat-history', {
      sender: localStorage.getItem('id'),
      receiver: receiverId,
    });
  };

  const onSendMessage = (e) => {
    e.preventDefault();
    // createNotification(response[response.length - 1].sender_id, response[response.length - 1].chat);
    if (!message) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Message empty!',
      });
      return;
    }
    
    // const createNotification = (sender, message) => {
    //   console.log('tes')
    //   return NotificationManager.info(message, `New chat from: ${sender}`, 4000);
    // };
    const data = {
      sender: localStorage.getItem('id'),
      receiver: activeReceiver,
      date: new Date(),
      chat: message,
      notif: `${detailUser.data.username}/As97$/${message}`
    };
    
    
    socketio.emit('send-message', data);
    
    const payload = {
      sender_id: localStorage.getItem('id'),
      receiver_id: activeReceiver,
      photo: detailUser.data.photo,
      date: new Date(),
      chat: message,
      id: new Date(),
      
    };
    console.log(payload)
    setListChat([...listChat, payload]);

    setMessage('');
    // socketio.emit("sendNotification", {
    //   sender: localStorage.getItem("id"),
    //   sender_name: detailUser.data.username,
    //   chat: message,
    // });

    setTimeout(() => {
      const elem = document.getElementById('chatMenuMessage');
      elem.scrollTop = elem.scrollHeight;
    }, 100);
  };

  const onDeleteMessage = (chat) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          sender: chat.sender_id,
          receiver: chat.receiver_id,
          chatId: chat.id,
        };
        socketio.emit('delete-message', data);
      }
    });
  };

  const onEditMessage = (newChat, chat) => {
    if (!newChat) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Message empty!',
      });
      return;
    }

    const data = {
      sender: chat.sender_id,
      receiver: chat.receiver_id,
      chatId: chat.id,
      chat: newChat,
    };
    socketio.emit('edit-message', data);

    document.getElementById('close').click();
  };
  console.log(listChat)

  return (
    <div className="container-fluid">
      <div id="liveAlertPlaceholder" className='me-2 w-100 bg-primary position-absolute top-0 start-50 translate-middle container-alert' > </div>
      <div className="row">
        {tab === 'profile' ? (
          <>
          <Profile />
          
          </>

        ) : (
          <ListUser setTab={setTab} selectReceiver={selectReceiver} listChat={listChat} />
        )}
        <Chat
          detailReceiver={detailReceiver}
          activeReceiver={activeReceiver}
          listChat={listChat}
          message={message}
          setMessage={setMessage}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
        />
      
      </div>
    </div>
  );
}
