const moment = require('moment');
const fetch = require('../utils/fetch');

const API_USER = 'https://keybase.io/_/api/1.0/user/lookup.json?fields=basics,proofs_summary,devices&username=';
const API_CARD = 'https://keybase.io/_/api/1.0/user/card.json?username=';
const API_SIGS = 'https://keybase.io/_/api/1.0/sig/get.json?uid=';

async function getUser(username) {
  let user, data;

  try {
    data = await fetch(API_USER + username);
  } catch (ex) {
    // suppress
  }

  if (data && data.status && data.status.code === 0 && data.them) {
    user = data.them;
  }

  return user;
}

async function getUserFollowSummary(username) {
  let followers, data;

  try {
    data = await fetch(API_CARD + username);
  } catch (ex) {
    // suppress
  }

  if (data && data.status && data.status.code === 0 && data.follow_summary) {
    followers = data.follow_summary.followers;
  }

  return followers;
}

async function getSigs(uid) {
  let sigs, data;

  try {
    data = await fetch(API_SIGS + uid);
  } catch (ex) {
    // suppress
  }

  if (data && data.status && data.status.code === 0 && data.sigs) {
    sigs = data.sigs;
  }

  return sigs;
}

function calculateFollowerScore(followers) {
  if (followers < 2) {
    return 0;
  } else if (followers < 6) {
    return 1;
  } else if (followers < 11) {
    return 2;
  } else if (followers < 21) {
    return 3;
  } else if (followers < 51) {
    return 4;
  } else if (followers >= 51) {
    return 5;
  }

  return 0;
}

function calculateUserScore(user, sigs, score) {
  if (sigs && sigs.length > 0) {
    let averageAgeDays = 0;

    sigs.forEach((sig) => {
      averageAgeDays += moment().diff(moment(sig.ctime * 1000), 'd');
    });

    averageAgeDays = averageAgeDays / sigs.length;

    let averageAgeScore;
    if (averageAgeDays < 365) {
      if (averageAgeDays < 31) {
        averageAgeScore = 0;
      } else if (averageAgeDays < 91) {
        averageAgeScore = 1;
      } else if (averageAgeDays < 365) {
        averageAgeScore = 2;
      }
    } else if (averageAgeDays >= 365) {
      let averageAgeYears = averageAgeDays / 365;

      if (averageAgeYears < 2) {
        averageAgeScore = 3;
      } else if (averageAgeYears < 3) {
        averageAgeScore = 4;
      } else if (averageAgeYears >= 3) {
        averageAgeScore = 5;
      }
    }

    score.avgProofAge = averageAgeScore;
  }

  if (user.proofs_summary) {
    user.proofs_summary.all.forEach((proof) => {
      switch (proof.proof_type) {
        case 'twitter':
          score.twitter = 10;
          break;

        case 'github':
          score.github = 10;
          break;

        case 'reddit':
          score.reddit = 3;
          break;

        case 'hackernews':
          score.hackernews = 3;
          break;

        case 'dns':
          score.dnsWebsite = score.dnsWebsite + 10 > 20 ? 20 : score.dnsWebsite + 10;
          break;

        case 'generic_web_site':
          score.genericWebsite = score.genericWebsite + 5 > 10 ? 10 : score.genericWebsite + 5;
          break;

        default:
          break;
      }
    });
  }

  if (user.devices) {
    Object.keys(user.devices).forEach((deviceId) => {
      const device = user.devices[deviceId];

      if (device.type === 'desktop' || device.type === 'mobile') {
        score.mobileDesktopDevice = score.mobileDesktopDevice + 4 > 12 ? 12 : score.mobileDesktopDevice + 4;
      }
    });
  }

  if (user.basics) {
    let accountAgeDays = moment().diff(moment(user.basics.ctime * 1000), 'd');

    let ageScore;
    if (accountAgeDays < 365) {
      if (accountAgeDays < 30) {
        ageScore = 0;
      } else if (accountAgeDays < 91) {
        ageScore = 1;
      } else if (accountAgeDays < 181) {
        ageScore = 2;
      } else if (accountAgeDays < 365) {
        ageScore = 3;
      }
    } else if (accountAgeDays >= 365) {
      let accountAgeYears = accountAgeDays / 365;

      if (accountAgeYears < 2) {
        ageScore = 4;
      } else if (accountAgeYears < 3) {
        ageScore = 5;
      } else if (accountAgeYears >= 3) {
        ageScore = 6;
      }
    }

    score.keybaseAge = ageScore;
  }
}

async function scoreUser(username) {
  const user = await getUser(username);
  const score = {
    genericWebsite: 0,
    dnsWebsite: 0,
    twitter: 0,
    github: 0,
    reddit: 0,
    hackernews: 0,
    mobileDesktopDevice: 0,
    keybaseFollowers: 0,
    keybaseAge: 0,
    avgProofAge: 0,
  };

  if (user) {
    const followers = await getUserFollowSummary(username);
    const sigs = await getSigs(user.id);

    if (followers) {
      score.keybaseFollowers = calculateFollowerScore(followers);
    }

    calculateUserScore(user, sigs, score);
  }

  return score;
}

module.exports = {
  scoreUser,
};
