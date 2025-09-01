// Express.js
import express from 'express';
import path from 'path';
import events from './routes/events.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import communities from './routes/communities.js';
import profiles from './routes/profiles.js'
import communityModerators from './routes/moderators.js';
import communityMembers from './routes/communityMembers.js';
import friends from './routes/friends.js'
import cors from 'cors';
import users from './routes/users.js';
import messaging from './routes/messaging.js';
import { setupEventNotificationScheduler } from "./controllers/eventController.ts";
import communityChat from './routes/communityChat.ts';

const port = process.env.PORT || 8080;

const app = express();

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://www.gstatic.com;"
  );
  next();
});

app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors({
  origin: 'https://seevents.expo.app' // Replace with your frontend origin
  
}));

// Logger middleware
app.use(logger);

//Routes
app.use('/api/events', events);
app.use('/api/users', users);
app.use('/api/profiles', profiles)
app.use('/api/communities', communities);
app.use('/api/community_moderators', communityModerators)
app.use('/api/community_members', communityMembers)
app.use('/api/friends', friends)
app.use('/api/chat', messaging);
app.use('/api/community_chat', communityChat);


app.use(notFound);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  // Initialize the event notification scheduler
  setupEventNotificationScheduler();
});

