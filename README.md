# WebConference
One-to-one webrtc program with a working chat in real time.

I used the webrtc library to create the peer to peer connection, as well as ready-made stun ice servers, to handle the initial communication. 
In addition I created a data stream to transfer the chat messages in real time, and to distinguish whether the user is remote or local 
The main problem in the chat was the synchronization of the datastream, with the offer/answer/joined/ready messages, as I had to create the datastream after the ready message (sent by the second user when he logs in) and before the joined/ready. Second problem was the exchange of the offer/answer messages between the two users, and synchronizing them. In my attempt to allow more than two users to log into the same room, I configured the messages to send 
everyone to send everyone offer/answers and exchange ice servers. However, this was not feasible and I ended up using the library 
kurento. For this I created 2 files, the mul party version was quite different and had several dependencies.

Dependencies: 
a) WebConference 

- Download the Node program 
- From cmd go to the project folder directory run the following
  npm init -y
  npm install -S express@4.15.4 socket.io@2.0.3

- Run the command: node server.js. (in cmd)
- Open in chrome: h p://localhost:3000/ in up to 2 windows 


