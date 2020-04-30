document.addEventListener('DOMContentLoaded', () =>{

    username = document.querySelector('#display-name').innerHTML;
    localStorage.setItem('username', username);

    // Set links up to load new channel messages
    function setChannelLink(){
        document.querySelectorAll('.channel-link').forEach(link => {
            link.onclick = ()=> {
                load_channel(link.dataset.channel);
                return false;
            }
        });
    }

    // Autofocus Modal text input
    $('.modal').on('shown.bs.modal', function() {
        $(this).find('[autofocus]').focus();
    });
    

    // Check for any previous active channel
    const activeChannel = localStorage.getItem('activeChannel');

    // Loop thorugh channel list to see if previous active channel is present in the list
    var load_prev = false;
    Array.from(document.querySelectorAll('#channels>li'), li => {
    if (li.textContent == activeChannel)
        load_prev = true;
    return load_prev
    });


    // If there was any previous channel load it else load general channel
    if (load_prev)
        load_channel(activeChannel);
    else
        load_channel('general');


    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // Disable the create channel button by default
    document.querySelector("#create-channel-button").disabled = true;

    // Enable button only if there is text in the input field and channel already doesn't exist
    document.querySelector("#channel").onkeyup = () => {
        if (document.querySelector('#channel').value.length > 0 && localStorage.getItem('taken') != document.querySelector("#channel").value){
            var letterNumber = /^[0-9a-zA-Z]+$/;
            // Only letters and numbers allowed
            if(document.querySelector('#channel').value.match(letterNumber)){
                document.querySelector("#create-channel-button").disabled = false;
            } else
                document.querySelector("#create-channel-button").disabled = true;
        } else
            document.querySelector("#create-channel-button").disabled = true;
    }

    document.querySelector('#send').disabled = true;
    document.querySelector('#msg').onkeyup = () => {
        if (document.querySelector('#msg').value.length > 0)
            document.querySelector('#send').disabled = false;
        else
            document.querySelector('#send').disabled = true;

    }

    // Variable to detect the messages div to scroll up later
    const messages = document.querySelector('#msgs');

    // Renders content of the seleted channel 
    function load_channel(channel) {
        setChannelLink();
        
        const request = new XMLHttpRequest();
        request.open('GET', `/channel/${channel}`);
        request.onload = () => {

            // Push state to URL.
            document.title = channel;

            // Store the selected channel in localStorage
            localStorage.setItem('activeChannel', channel);

            // Clear out the msgs div first
            document.querySelector('#msgs').innerHTML = '';

            document.querySelector("#channel-name").innerHTML = '#' + channel;

            // Template for all the converstions in a channel
            const template = Handlebars.compile(document.querySelector("#conversations").innerHTML);
            var users_msgs = JSON.parse(request.responseText);

            // Add a deleteOption to delete the message send by the respective user, By default it's False 
            deleteOption = false;
            for (var i = 0; i < users_msgs.length; i++) {
                // If the sender of the message is viewing his own msgs then set the deleteOption to True
                if (localStorage.getItem('username') === users_msgs[i][0]){
                    users_msgs[i].push(true);
                }
            }
            
            const content = template({'users_msgs': users_msgs});
             
            document.querySelector("#msgs").innerHTML += content;
            // Set the amount of vertical scroll equal to total container size 
            messages.scrollTop = messages.scrollHeight;
            SetDeleteButton();
        };
        request.send();
    }


    // Set up delete button when clicked, remove post.
    function SetDeleteButton(){
        document.querySelectorAll('.delete-msg').forEach(button => {
            button.onclick = function() {
                this.parentElement.style.animationPlayState = 'running';
                this.parentElement.addEventListener('animationend', () => {
                    this.parentElement.remove();
                    const request = new XMLHttpRequest();
                    const hiddenMsg = this.parentElement.querySelector('#hidden-msg').innerHTML;
                    const channel = localStorage.getItem('activeChannel');
                    request.open('GET', `/delete_msg/${channel}/${hiddenMsg}`);
                    request.send();
                });
            };
        });
    }


    // When connected, configure form submit buttons
    socket.on('connect', () => {

        // Every time user submits a msg emit a "new msg" event
        document.querySelector('#msg-form').onsubmit = () => {
            const msg = document.querySelector('#msg').value;
            const username =  document.querySelector('#display-name').innerHTML;
            channel = localStorage.getItem('activeChannel');

            const today = new Date();
            const time = today.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true});

            socket.emit('new msg', {'msg': msg, 'username': username, 'channel': channel, 'dateTime': time});
            document.querySelector("#msg").value = "";
            return false;
        }

        // Every time user creates a new channel
        document.querySelector('#create-channel-form').onsubmit = ()=> {
            const channel = document.querySelector('#channel').value;
            const username = document.querySelector('#display-name').innerHTML;
            socket.emit('new channel', {'channel': channel, 'username': username});
            return false;
        }

    });


    // When a new message is announced, add the new message in the chat
    socket.on('announce message', data => {
        if (data.success){
            const template = Handlebars.compile(document.querySelector("#conversations").innerHTML);
            
            // Recreating a list of list to mimic whats returned from application.py to render in handlebars
            users_msgs = [[data.username, data.dateTime, data.msg, data.deleteOption]];
            const content = template({'users_msgs': users_msgs});
        
            // Check if all the users are in the same channel
            if (localStorage.getItem('activeChannel') === data.channel){
                document.querySelector("#msgs").innerHTML += content;
                messages.scrollTop = messages.scrollHeight; 
            }

            
            // Add a delete message option to the one who wrote it
            if (localStorage.getItem('username') === data.username){
                const messageDiv = document.querySelectorAll('.message-div');
                const deleteMsg = document.createElement('button');
                deleteMsg.className = 'delete-msg';
                deleteMsg.innerHTML = 'x';
                // Add the delete option to the msg just sent
                messageDiv[messageDiv.length - 1].append(deleteMsg);
                SetDeleteButton();
            }
                
        } else{
            alert('You have reached max limit of messages');
        }
        
    });
    

    // When new channel is announced, add to the channel list
    socket.on('announce channel', data => {
        if (data.success){
            // $('#addChannelModal').modal('delete');
            document.querySelector('#channel').value = '';

            // Template for channels
            const template = Handlebars.compile(document.querySelector('#result').innerHTML);
            const content = template({'channel': data.channel});
            document.querySelector('#channels').innerHTML += content;
            setChannelLink();
            location.reload();
            if (data.username === document.querySelector('#display-name').innerHTML){
                load_channel(data.channel);
            }
        } else{
            alert('Channel name already exists.')   
        }
        
    });
});