const moment = require('moment');
const fetch = require('../utils/fetch');

const API_USER = 'https://api.github.com/users/';

async function getUser(username) {
  let user, data;

  try {
    data = await fetch(API_USER + username);
  } catch (ex) {
    console.error(ex);
    // suppress
  }

  if (data && data.created_at) {
    user = data;
  }

  return user;
}

function calculateUserScore(user, score) {
  if (user.followers) {
    if (user.followers < 2) {
      score.githubFollowers = 0;
    } else if (user.followers < 6) {
      score.githubFollowers = 1;
    } else if (user.followers < 11) {
      score.githubFollowers = 2;
    } else if (user.followers < 21) {
      score.githubFollowers = 3;
    } else if (user.followers > 21) {
      score.githubFollowers = 4;
    }
  }

  if (user.created_at) {
    let accountAgeDays = moment().diff(moment(user.created_at), 'd');

    let ageScore;
    if (accountAgeDays < 365) {
      if (accountAgeDays < 31) {
        ageScore = 0;
      } else if (accountAgeDays < 91) {
        ageScore = 1;
      } else if (accountAgeDays < 365) {
        ageScore = 2;
      }
    } else if (accountAgeDays >= 365) {
      let accountAgeYears = accountAgeDays / 365;

      if (accountAgeYears < 2) {
        ageScore = 3;
      } else if (accountAgeYears < 3) {
        ageScore = 4;
      } else if (accountAgeYears >= 3) {
        ageScore = 5;
      }
    }

    score.githubAge = ageScore;
  }
}

async function scoreUser(username) {
  const user = await getUser(username);
  const score = {
    githubFollowers: 0,
    githubAge: 0,
  };

  if (user) {
    calculateUserScore(user, score);
  }

  return score;
}

module.exports = {
  scoreUser,
};
