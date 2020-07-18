const util = require('util');
const exec = util.promisify(require('child_process').exec);

const keybase = require('./services/keybase');
const github = require('./services/github');
const twitter = require('./services/twitter');

const POSITIVE_ID_MIN_SCORE = 90;
const ACCURATE_ID_MIN_SCORE = 75;
const PASSABLE_ID_MIN_SCORE = 51;
const WEAK_ID_MIN_SCORE = 26;

const DEFAULT_MIN_KEYBASE_SCORE = PASSABLE_ID_MIN_SCORE;

class KeybaseId {
  /**
   *Creates an instance of KeybaseId.

   * @param {*} options { keybasePath, minKbScore, twitterApiKey, twitterApiSecret }
   * @param {string} options.keybasePath Local path to keybase core client executable.
   * @param {Number} options.minKbScore Minimum KB Score for user authentication. Default is `Passable Identity` or better.
   * @param {string} options.twitterApiKey Twitter API key to collect Twitter specific information. This must be passed along with `twitterApiSecret`.
   * @param {string} options.twitterApiSecret Twitter API secret to collect Twitter specific information. This must be passed along with `twitterApiKey`.
   *
   * @memberof KeybaseId
   */
  constructor({ keybasePath, minKbScore, twitterApiKey, twitterApiSecret }) {
    this._keybasePath = keybasePath || process.env.KEYBASEID_KEYBASE;
    this._minKbScore = minKbScore || process.env.KEYBASEID_SCORE || DEFAULT_MIN_KEYBASE_SCORE;
    this._twitterApiKey = twitterApiKey || process.env.KEYBASEID_TWITTER_KEY;
    this._twitterApiSecret = twitterApiSecret || process.env.KEYBASEID_TWITTER_SECRET;

    if (!this._keybasePath) {
      throw new TypeError('No keybasePath option was specified and no KEYBASEID_KEYBASE environment variable was found. Please specify one.');
    } else {
      exec(`${this._keybasePath} --version`).catch(() => {
        console.log(`* WARNING *: KeybaseId failed to run version command using keybasePath/KEYBASEID_KEYBASE of: ${this._keybasePath}`);
      });
    }
  }

  get minKbScore() {
    return this._minKbScore;
  }

  get keybasePath() {
    return this._keybasePath;
  }

  /**
   * Decrypts a Saltpack `message`, verifying its contents against `verifyTxt` and an optional `username`
   *
   * @param {*} message The message being verified and/or decrypted
   * @param {*} verifyTxt The text which the message is being compared to
   * @param {*} username The username which the message signature is being checked against
   *
   * @returns {boolean} True if `message` Saltpack content matches `verifyTxt`, and it was signed by `username` (if specified), or false otherwise
   */
  _saltpackVerify = async (message, verifyTxt, username) => {
    let result = false;

    try {
      let command = `${this._keybasePath} verify -m "${message}"`;

      if (username) {
        command += ` -S ${username}`;
      }

      const { stdout } = await exec(command);

      if (stdout) {
        if (verifyTxt && stdout === verifyTxt) {
          result = true;
        }
      }
    } catch (ex) {
      // suppress exceptions, keybase throws errors on failed verifications
    }

    return result;
  };

  /**
   * Returns either the numeric total of a user's KB Score, or the entire user's score object if `details` is true
   *
   * @param {string} username The Keybase username of a user to get the KB score for
   * @param {boolean} details Set to true to receive the entire user's score object, including total numeric score
   *
   * @returns {any} Either the numeric total of a user's KB Score, or the entire user's score object if `details` is passed
   *
   * @memberof KeybaseId
   */
  scoreUser = async (username, details) => {
    let userScore = await keybase.scoreUser(username);
    let githubScore = await github.scoreUser(username);

    let score = { ...userScore, ...githubScore };

    // check if Twitter values are passed in and get Twitter score if so
    if (this._twitterApiKey && this._twitterApiSecret) {
      let twitterScore = await twitter.scoreUser(username, this._twitterApiKey, this._twitterApiSecret);

      score = { ...score, ...twitterScore };
    } else {
      // otherwise, distribute Twitter score points among github/keybase scores
      score.keybaseAge += 2;
      score.githubAge += 2;

      score.keybaseFollowers += 2;
      score.githubFollowers += 1;
    }

    let total = Object.values(score).reduce((sum, curr) => sum + curr);

    if (details) {
      let identity;

      if (total < WEAK_ID_MIN_SCORE) {
        identity = 'Unknown';
      } else if (total < PASSABLE_ID_MIN_SCORE) {
        identity = 'Weak';
      } else if (total < ACCURATE_ID_MIN_SCORE) {
        identity = 'Passable';
      } else if (total < POSITIVE_ID_MIN_SCORE) {
        identity = 'Accurate';
      } else if (total >= POSITIVE_ID_MIN_SCORE) {
        identity = 'Positive';
      }

      return { score, total, identity };
    } else {
      return total;
    }
  };

  /**
   * Verifies a user signed a message with certain text, then checks that user meets the `minKbScore`
   *
   * @param {string} message The signed message from the user
   * @param {string} verifyTxt The text that the signed message is being compared against. Must match exactly
   * @param {string} username The username of the user attempting authentication
   *
   * @returns {boolean} True if the user's message can be verified and the user's KB Score is above the `minKbScore`, or false if the user's score is below the `minKbScore`. Throws an `Error` if the user's message could not be verified
   *
   * @memberof KeybaseId
   */
  authenticate = async (message, verifyTxt, username) => {
    if (await this.verifyUserMessage(message, verifyTxt, username)) {
      let score = await this.scoreUser(username);

      if (score >= this._minKbScore) {
        return true;
      } else {
        return false;
      }
    } else {
      throw new Error('Could not verify user message.');
    }
  };

  /**
   * Verifies that `message` was signed by `username` and it matches `verifyTxt`
   *
   * @param {string} message The signed message being verified
   * @param {string} verifyTxt The text the `message` is being verified against
   * @param {string} username The username the message is being verified as signed by
   *
   * @returns {bool} True if `message` was signed by `username` and its content matches `verifyTxt`, or false otherwise
   *
   * @memberof KeybaseId
   */
  verifyUserMessage = async (message, verifyTxt, username) => {
    return await this._saltpackVerify(message, verifyTxt, username);
  };

  /**
   * Verifies that the signed `message` content matches `verifyTxt`
   *
   * @param {string} message The signed message being verified
   * @param {string} verifyTxt The text the `message` is being verified against
   *
   * @returns {bool} True if the signed `message` content matches `verifyTxt`, or false otherwise
   *
   * @memberof KeybaseId
   */
  verifyMessage = async (message, verifyTxt) => {
    return await this._saltpackVerify(message, verifyTxt);
  };
}

module.exports = KeybaseId;
