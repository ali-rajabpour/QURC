# QuranCoin Telegram MiniApp

A simple Telegram MiniApp for the QuranCoin project that allows users to earn points by following social media accounts and watching an introductory video.

## Features

- **Telegram Authentication**: Uses Telegram Web App authentication via Telegram ID
- **Social Media Verification**:
  - Follow Instagram page (qurancoin.io)
  - Join Telegram channel (https://t.me/qurancointoken)
  - Follow Twitter account (qurancoin_io)
- **Video Watching**: Users must watch an introductory video (intro.mp4)
- **Points System**:
  - Earn 10 points for completing all social media follows and watching the video
  - Earn 10 points every 4 hours just by opening the app
- **Countdown Timer**: Shows time remaining until next points can be earned
- **Simple Interface**: Single-page design with no navigation menus

## Technology Stack

### Backend
- **Node.js** with **Express** framework
- **PostgreSQL** database hosted on Aiven
- **Telegram Web App** authentication
- **REST API** endpoints for all functionality

### Frontend
- **HTML5** with **CSS3** styling
- **JavaScript** for client-side logic
- **Telegram Web App** SDK for integration
- **Amiri** font for Islamic aesthetic

## Project Structure 
www/
├── server.js # Main server file
├── index.html # Frontend interface
├── package.json # Node.js dependencies
├── .env # Environment variables
├── logo_tg.png # Project logo
├── intro.mp4 # Introductory video
└── README.md # This documentation file



## API Endpoints

- `POST /login` - Handle user login
- `GET /status` - Get user status and points
- `POST /verify/{platform}` - Verify social media follows (instagram/telegram/twitter)
- `POST /watch-video` - Mark video as watched
- `POST /calculate-points` - Calculate and update user points

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file with your Telegram bot token:
   ```
   BOT_TOKEN=your_telegram_bot_token
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the App**
   - Open through Telegram Web App interface
   - Access at: `http://163.5.94.144:8443`

## Database Schema

```sql
CREATE TABLE users (
    telegram_id BIGINT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    following_instagram BOOLEAN DEFAULT false,
    following_telegram BOOLEAN DEFAULT false,
    following_twitter BOOLEAN DEFAULT false,
    watched_video BOOLEAN DEFAULT false
);
```

## Development Notes

- **Authentication**: Currently bypasses hash verification for testing. Enable it in production by removing the bypass in `server.js`
- **Security**: Add proper security measures before production deployment
- **Error Handling**: Implement more robust error handling and logging
- **Testing**: Add unit and integration tests
- **Caching**: Implement caching for better performance
- **Scalability**: Consider database optimizations and load balancing

## Future Enhancements

1. Add user profile management
2. Implement referral system
3. Add leaderboard functionality
4. Integrate with blockchain for token rewards
5. Add multi-language support
6. Implement proper logging and monitoring
7. Add admin dashboard for managing users and content

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or support, please contact the project maintainers.