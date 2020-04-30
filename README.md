# Project 2

Web Programming with Python and JavaScript

# Flack - A Slack like application but with no database

* application.py 
The flask app server that has a session to store username. Listening for socketio.on from the JS file. Store some useful data in global variable that lasts till the server is running. And a few routes for handling login, changing channels and deleting of messages.


* Templates
    * login.html
    The login page

    * index.html
    The main page after a user logs in i.e. the channels page. 


* Static
    * main.js
    Contains the code when a DOM is loaded. Setting up channel links, buttons, etc. Sending XMLHTTP request as well as 'full-duplex communication' using Websockets and controlling of CSS animation states. 

    * style.css
    The styling of the pages and CSS animations.

