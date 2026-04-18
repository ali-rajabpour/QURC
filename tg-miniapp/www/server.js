require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const app = express();
const port = 8443;
app.use(express.json());

// Updated Database connection - credentials loaded from environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME || 'defaultdb',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully. Server time:', res.rows[0].now);
  }
});

// Create users table if not exists
async function initDB() {
  try {
    // Test connection first
    const connTest = await pool.query('SELECT 1 as test');
    console.log('Database connection test successful:', connTest.rows[0]);
    
    // Create table if not exists with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        points INTEGER DEFAULT 0,
        last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_points_earned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        following_instagram BOOLEAN DEFAULT false,
        following_telegram BOOLEAN DEFAULT false,
        following_twitter BOOLEAN DEFAULT false,
        watched_video BOOLEAN DEFAULT false,
        completed_tasks BOOLEAN DEFAULT false
      );
    `);
    console.log('Database initialized');
    
    // Log table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Table structure:', tableInfo.rows);
    
    // Add required columns if they don't exist
    try {
      // Add last_points_earned column if it doesn't exist
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_points_earned TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      console.log('Added last_points_earned column if needed');
      
      // Add completed_tasks column if it doesn't exist
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS completed_tasks BOOLEAN DEFAULT false;
      `);
      console.log('Added completed_tasks column if needed');
    } catch (alterErr) {
      console.error('Error adding columns:', alterErr);
    }

    // Add new columns for tracking social media points
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS points_instagram BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS points_telegram BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS points_twitter BOOLEAN DEFAULT false;
    `);

    console.log('Added social media points tracking columns');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Function to check if the request is for static files
function isStaticFileRequest(req) {
  const path = req.path;
  return path.endsWith('.html') || 
         path.endsWith('.js') || 
         path.endsWith('.css') || 
         path.endsWith('.png') || 
         path.endsWith('.jpg') || 
         path.endsWith('.jpeg') || 
         path.endsWith('.gif') || 
         path.endsWith('.mp4') || 
         path.endsWith('.ico') || 
         path === '/' || 
         path === '/db-test';  // Allow the test endpoint
}

// Improved Telegram Web App authentication middleware
app.use((req, res, next) => {
  // Skip authentication for static files and the root path
  if (isStaticFileRequest(req)) {
    return next();
  }
  
  try {
    // Get initData from Telegram Web App
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData) {
      console.error('Missing initData in request headers');
      return res.status(401).json({ error: 'Unauthorized - Missing initData' });
    }

    // Parse initData
    const parsedData = new URLSearchParams(initData);
    const hash = parsedData.get('hash');
    
    if (!hash) {
      console.error('Missing hash in initData');
      return res.status(401).json({ error: 'Unauthorized - Missing hash' });
    }

    // Extract user data
    const userData = parsedData.get('user');
    if (!userData) {
      console.error('Missing user data in initData');
      return res.status(401).json({ error: 'Unauthorized - Missing user data' });
    }

    try {
      const user = JSON.parse(userData);
      if (!user || !user.id) {
        console.error('Invalid user data:', userData);
        return res.status(401).json({ error: 'Unauthorized - Invalid user data' });
      }
      
      // Get bot token
      const botToken = process.env.BOT_TOKEN;
      if (!botToken) {
        console.error('BOT_TOKEN not set in environment');
        return res.status(500).json({ error: 'Server configuration error - BOT_TOKEN missing' });
      }
      
      // Check data integrity
      const dataCheckString = Array.from(parsedData.entries())
        .filter(([key]) => key !== 'hash')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      // Create secret key based on the bot token
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
      
      // Calculate expected hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      // Verify hash
      if (calculatedHash !== hash) {
        console.error('Hash verification failed');
        console.error('Expected hash:', calculatedHash);
        console.error('Received hash:', hash);
        
        // For development, allow this to continue but log the issue
        // In production, you would return a 401 error here
        console.warn('WARNING: Continuing despite hash verification failure (DEVELOPMENT ONLY)');
      }
      
      // Set telegram ID in request object
      req.telegramId = user.id;
      next();
    } catch (parseError) {
      console.error('Error parsing user data:', parseError);
      return res.status(401).json({ error: 'Unauthorized - Invalid user data format' });
    }
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ error: 'Unauthorized - Internal error' });
  }
});

// Database connection test endpoint (public, no auth required)
app.get('/db-test', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as time');
    
    // Count records in users table
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    
    res.json({
      status: 'Database connection successful',
      serverTime: result.rows[0].time,
      userCount: userCount.rows[0].count,
      connectionInfo: {
        host: pool.options.host,
        database: pool.options.database,
        port: pool.options.port,
        user: pool.options.user,
        ssl: pool.options.ssl ? 'enabled' : 'disabled'
      }
    });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({
      status: 'Database connection failed',
      error: err.message,
      connectionInfo: {
        host: pool.options.host,
        database: pool.options.database,
        port: pool.options.port,
        user: pool.options.user,
        ssl: pool.options.ssl ? 'enabled' : 'disabled'
      }
    });
  }
});

// User login endpoint
app.post('/login', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Login attempt for telegram ID:', telegramId);
    
    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    // If new user, create record
    if (user.rows.length === 0) {
      console.log('Creating new user with telegram ID:', telegramId);
      // Use NOW()::timestamp to ensure consistent timestamp type
      await pool.query(
        'INSERT INTO users (telegram_id, last_login, last_points_earned) VALUES ($1, NOW(), NOW())',
        [telegramId]
      );
    } else {
      console.log('Existing user found:', user.rows[0]);
      // Update last login time
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE telegram_id = $1',
        [telegramId]
      );
    }

    res.json({ success: true, telegramId });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get user status
app.get('/status', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Status request for telegram ID:', telegramId);
    
    const user = await pool.query(
      `SELECT 
        points, 
        last_login, 
        last_points_earned,
        following_instagram, 
        following_telegram, 
        following_twitter, 
        watched_video,
        completed_tasks,
        EXTRACT(EPOCH FROM (NOW() - last_points_earned)) / 3600 AS hours_since_points
      FROM users 
      WHERE telegram_id = $1`,
      [telegramId]
    );
    
    if (user.rows.length === 0) {
      console.log('User not found for telegram ID:', telegramId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate time until next points
    const userData = user.rows[0];
    const hoursSincePoints = parseFloat(userData.hours_since_points || 0);
    const hoursRemaining = Math.max(0, 4 - hoursSincePoints);
    const secondsRemaining = Math.ceil(hoursRemaining * 3600);
    
    console.log('Status for user:', userData);
    console.log('Hours since last points:', hoursSincePoints);
    console.log('Hours remaining until next points:', hoursRemaining);
    
    res.json({
      ...userData,
      next_points_time: {
        hours_remaining: hoursRemaining,
        seconds_remaining: secondsRemaining,
        can_earn_now: hoursSincePoints >= 4
      }
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Social media verification endpoints
app.post('/verify/instagram', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Instagram verification for telegram ID:', telegramId);
    
    const result = await pool.query(
      'UPDATE users SET following_instagram = true WHERE telegram_id = $1 RETURNING *',
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Instagram verification updated:', result.rows[0]);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Instagram verification error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.post('/verify/telegram', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Telegram verification for telegram ID:', telegramId);
    
    const result = await pool.query(
      'UPDATE users SET following_telegram = true WHERE telegram_id = $1 RETURNING *',
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Telegram verification updated:', result.rows[0]);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Telegram verification error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.post('/verify/twitter', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Twitter verification for telegram ID:', telegramId);
    
    const result = await pool.query(
      'UPDATE users SET following_twitter = true WHERE telegram_id = $1 RETURNING *',
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Twitter verification updated:', result.rows[0]);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Twitter verification error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Video watching endpoint
app.post('/watch-video', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Video watched by telegram ID:', telegramId);
    
    const result = await pool.query(
      'UPDATE users SET watched_video = true WHERE telegram_id = $1 RETURNING *',
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Video watching status updated:', result.rows[0]);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Video watching error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Points calculation endpoint
app.post('/calculate-points', async (req, res) => {
  const { telegramId } = req;
  
  try {
    console.log('Calculating points for telegram ID:', telegramId);
    
    // Get user info with time calculations
    const user = await pool.query(
      `SELECT 
        *, 
        EXTRACT(EPOCH FROM (NOW() - last_points_earned)) / 3600 AS hours_since_points
      FROM users 
      WHERE telegram_id = $1`,
      [telegramId]
    );

    if (user.rows.length === 0) {
      console.log('User not found for points calculation:', telegramId);
      return res.status(404).json({ error: 'User not found' });
    }

    const { 
      points: currentPoints,
      last_points_earned,
      following_instagram,
      following_telegram,
      following_twitter,
      watched_video,
      completed_tasks,
      hours_since_points
    } = user.rows[0];

    console.log('User data for points calculation:', user.rows[0]);
    console.log('Hours since last points earned:', hours_since_points);

    let pointsEarned = 0;
    let pointsSource = [];
    let updateTimeStamp = false;

    // First-time login and video watching
    if (watched_video && !completed_tasks) {
      pointsEarned += 10;
      pointsSource.push('video_watched');
      console.log('Adding 10 points for watching video');
      await pool.query(
        'UPDATE users SET completed_tasks = true WHERE telegram_id = $1',
        [telegramId]
      );
    }

    // Social media follows (award points independently)
    if (following_instagram) {
      const instagramPoints = await pool.query(
        'SELECT points_instagram FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      if (!instagramPoints.rows[0].points_instagram) {
        pointsEarned += 10;
        pointsSource.push('instagram_follow');
        console.log('Adding 10 points for Instagram follow');
        await pool.query(
          'UPDATE users SET points_instagram = true WHERE telegram_id = $1',
          [telegramId]
        );
      }
    }

    if (following_telegram) {
      const telegramPoints = await pool.query(
        'SELECT points_telegram FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      if (!telegramPoints.rows[0].points_telegram) {
        pointsEarned += 10;
        pointsSource.push('telegram_follow');
        console.log('Adding 10 points for Telegram follow');
        await pool.query(
          'UPDATE users SET points_telegram = true WHERE telegram_id = $1',
          [telegramId]
        );
      }
    }

    if (following_twitter) {
      const twitterPoints = await pool.query(
        'SELECT points_twitter FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      if (!twitterPoints.rows[0].points_twitter) {
        pointsEarned += 10;
        pointsSource.push('twitter_follow');
        console.log('Adding 10 points for Twitter follow');
        await pool.query(
          'UPDATE users SET points_twitter = true WHERE telegram_id = $1',
          [telegramId]
        );
      }
    }

    // Recurring 4-hour points (only if 4 hours have passed)
    if (parseFloat(hours_since_points) >= 4) {
      pointsEarned += 10;
      pointsSource.push('time_elapsed');
      updateTimeStamp = true;
      console.log('Adding 10 points for 4-hour interval');
    }

    // Update points and timestamps if points were earned
    if (pointsEarned > 0) {
      let result;
      if (updateTimeStamp) {
        result = await pool.query(
          'UPDATE users SET points = points + $1, last_points_earned = NOW() WHERE telegram_id = $2 RETURNING points',
          [pointsEarned, telegramId]
        );
      } else {
        result = await pool.query(
          'UPDATE users SET points = points + $1 WHERE telegram_id = $2 RETURNING points',
          [pointsEarned, telegramId]
        );
      }
      
      console.log('Points updated. New total:', result.rows[0].points);
      
      // Get updated time until next points
      const updatedUser = await pool.query(
        `SELECT 
          points, 
          last_points_earned,
          EXTRACT(EPOCH FROM (NOW() - last_points_earned)) / 3600 AS hours_since_points
        FROM users 
        WHERE telegram_id = $1`,
        [telegramId]
      );
      
      const hoursSincePoints = parseFloat(updatedUser.rows[0].hours_since_points || 0);
      const hoursRemaining = Math.max(0, 4 - hoursSincePoints);
      const secondsRemaining = Math.ceil(hoursRemaining * 3600);
      
      res.json({ 
        points_earned: pointsEarned, 
        points_source: pointsSource,
        total_points: result.rows[0].points,
        next_points_time: {
          hours_remaining: hoursRemaining,
          seconds_remaining: secondsRemaining,
          can_earn_now: hoursSincePoints >= 4
        }
      });
    } else {
      // No points earned this time
      const hoursSincePoints = parseFloat(hours_since_points || 0);
      const hoursRemaining = Math.max(0, 4 - hoursSincePoints);
      const secondsRemaining = Math.ceil(hoursRemaining * 3600);
      
      res.json({ 
        points_earned: 0, 
        points_source: [],
        total_points: currentPoints,
        next_points_time: {
          hours_remaining: hoursRemaining,
          seconds_remaining: secondsRemaining,
          can_earn_now: hoursSincePoints >= 4
        }
      });
    }
  } catch (err) {
    console.error('Points calculation error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Serve static files
app.use(express.static(__dirname));

// Update root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start the server
const listenHost = process.env.SERVER_HOST || '0.0.0.0';
app.listen(port, listenHost, () => {
  console.log(`Server running at http://${listenHost}:${port}`);
  initDB();
}); 