const socket = io()


const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //element
    const $newMessage = $messages.lastElementChild

    //height
    const newMessageStyles = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + $newMessageMargin

    //visible h
    const visibleHeight = $messages.offsetHeight

    // h of msg
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset ) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('locationMessage', (message)=>{
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        location: message.location,
        createdAt:  moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error);
        } else {
            console.log('Message Delivered!');
        }
    })
})


$sendLocationButton.addEventListener('click', () => {
     if (!navigator.geolocation) {
         return alert('Geo is not suoported by your browser.')
     }
     
    $sendLocationButton.setAttribute('disabled', 'disabled')

     navigator.geolocation.getCurrentPosition( (position)=> {
        socket.emit('sendLocation',   {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, () => {    
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
     })

     })
})

socket.on('connect', () => {
    socket.emit('join', {username , room }, (error) => {
        if (error) {
            alert(error)
            location.href = '/'
        }
    })
})