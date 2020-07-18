const axios = require('axios');
const moment = require('moment');

const API_TOKEN = 'https://api.twitter.com/oauth2/token';
const API_USER = 'https://api.twitter.com/1.1/users/show.json?screen_name=';

async function getToken(apiKey, apiSecret) {
  let token;
  const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  try {
    const response = await axios.post(API_TOKEN, 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (response.data && response.data.access_token) {
      token = response.data.access_token;
    }
  } catch (ex) {
    // suppress
  }

  return token;
}

async function getUser(username, apiKey, apiSecret) {
  let user;
  const bearer = await getToken(apiKey, apiSecret);

  if (bearer) {
    try {
      const response = await axios.get(API_USER + username, {
        headers: {
          Authorization: `Bearer ${bearer}`,
        },
      });

      if (response.data && response.data.created_at) {
        user = response.data;
      }
    } catch (ex) {
      // suppress
    }
  }

  return user;
}

function calculateUserScore(user, score) {
  if (user.followers_count) {
    if (user.followers_count < 51) {
      score.twitterFollowers = 0;
    } else if (user.followers_count < 301) {
      score.twitterFollowers = 1;
    } else if (user.followers_count < 2001) {
      score.twitterFollowers = 2;
    } else if (user.followers_count > 2001) {
      score.twitterFollowers = 3;
    }
  }

  if (user.created_at) {
    let accountAgeDays = moment().diff(moment(new Date(user.created_at)), 'd');

    let ageScore;
    if (accountAgeDays < 730) {
      if (accountAgeDays < 31) {
        ageScore = 0;
      } else if (accountAgeDays < 91) {
        ageScore = 1;
      } else if (accountAgeDays < 730) {
        ageScore = 2;
      }
    } else if (accountAgeDays >= 730) {
      let accountAgeYears = accountAgeDays / 365;

      if (accountAgeYears < 4) {
        ageScore = 3;
      } else if (accountAgeYears > 4) {
        ageScore = 4;
      }
    }

    score.twitterAge = ageScore;
  }
}

async function scoreUser(username, apiKey, apiSecret) {
  const user = await getUser(username, apiKey, apiSecret);
  const score = {
    twitterFollowers: 0,
    twitterAge: 0,
  };

  if (user) {
    calculateUserScore(user, score);
  }

  return score;
}

module.exports = {
  scoreUser,
};
