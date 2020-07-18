# Keybase ID

Keybase ID is an identification and authentication library that relies on the [Keybase](https://keybase.io/) Core cryptography client. Keybase ID provides an easy, secure way to identify and authenticate Keybase users that are signing up or logging into your application. Keybase ID uses Keybase's unique [Saltpack](https://saltpack.org/) messaging scheme to authenticate and verify a Keybase user is who they claim to be, then uses Keybase, GitHub, and Twitter APIs (when provided) to further validate a user's identity, returning a calculated score of the validity of a user's "identity".

[More Info](#more-info)

## Installation

### Prerequisites

Keybase ID *requires* the Keybase Core cryptography client be installed. This repo can currently be found [here](https://github.com/keybase/client/tree/master/go). Once you have followed the instructions, you should have a `keybase` executable built, which you will need to pass as an argument into Keybase ID. You should be able to run the following command in your command line, and see a version/commit number displayed:

`keybase -v`

### Installing

After the Keybase Core client has been installed, you may now install the npm package using the command below:

`npm install keybase-id`

## Usage

The Keybase ID library provides a `KeybaseId` class which has a mandatory `keybasePath` parameter and optional `minKbScore`, `twitterApiKey`, and `twitterApiSecret` parameters. All of these parameters, including the required `keybasePath`, can be specified as environment variables also, without having to be passed in as options to the KeybaseId class. After initializing an instance of the `KeybaseId` class, you will typically call the `authenticate` method, passing the signed message, the original message it is being verified against, and the Keybase username being verified. The `authenticate` method will return true if the specified Keybase username has signed the specified message exactly, and their Keybase Score is greater than or equal to `minKbScore`, otherwise it will return false.

### Options

| Option Name | Environment Variable Name | Details | Example |
|     :-:     |           :-:             |   :-:   |   :-:   |
| `keybasePath` | `KEYBASEID_KEYBASE` | The relative or absolute path to a built Keybase Core client executable. | `keybase`
| `minKbScore` | `KEYBASEID_SCORE` | The minimum [KB Score](#keybase-score-kb-score) a user must have to pass authentication.  | `75`
| `twitterApiKey` | `KEYBASEID_TWITTER_KEY` | Your custom Twitter API Key, used for checking age and follower count of Twitter accounts. | `ABCD1234`
| `twitterApiSecret` | `KEYBASEID_TWITTER_SECRET` | Your custom Twitter API Secret, used for checking age and follower count of Twitter accounts. | `1234ABCD`

### Methods

```javascript
/**
   * Verifies a user signed a message with certain text, then checks that user meets the `minKbScore`
   *
   * @param {string} message The signed message from the user
   * @param {string} verifyTxt The text that the signed message is being compared against. Must match exactly
   * @param {string} username The username of the user attempting authentication
   *
   * @returns {boolean} True if the user's message can be verified and the user's KB Score is above the `minKbScore`, or false if the user's score is below the `minKbScore`. Throws an `Error` if the user's message could not be verified
   */
async authenticate(message, verifyTxt, username)
```

```javascript
/**
   * Returns either the numeric total of a user's KB Score, or the entire user's score object if `details` is true
   *
   * @param {string} username The Keybase username of a user to get the KB score for
   * @param {boolean} details Set to true to receive the entire user's score object, including total numeric score
   *
   * @returns {any} Either the numeric total of a user's KB Score, or the entire user's score object if `details` is passed
   */
async scoreUser(username, details)
```

```javascript
/**
   * Verifies that `message` was signed by `username` and it matches `verifyTxt`
   *
   * @param {string} message The signed message being verified
   * @param {string} verifyTxt The text the `message` is being verified against
   * @param {string} username The username the message is being verified as signed by
   *
   * @returns {bool} True if `message` was signed by `username` and its content matches `verifyTxt`, or false otherwise
   */
async verifyUserMessage(message, verifyTxt, username)
```

```javascript
/**
   * Verifies that the signed `message` content matches `verifyTxt`
   *
   * @param {string} message The signed message being verified
   * @param {string} verifyTxt The text the `message` is being verified against
   *
   * @returns {bool} True if the signed `message` content matches `verifyTxt`, or false otherwise
   */
async verifyMessage(message, verifyTxt)
```

## Example

```javascript
const KeybaseId = require('keybase-id');

const TEST_MESSAGE =
  'BEGIN KEYBASE SALTPACK SIGNED MESSAGE. kXR7VktZdyH7rvq v5weRa0zkFyr6YL d3W8OHdrkfXresG pb2HM2IGZNEwDU1 TcXTRZKvzcY716H FTkrkpBY5fnK0B5 Ugyluzvw5afLnCr Bn9tNpmWQPxck7W ymTvx2SW1AIC4Wh 0rRHwAGWMBthMmo QxPE8S8cpgDFHUX EJkOeq79JWwq4bM PWbWAydDkmK. END KEYBASE SALTPACK SIGNED MESSAGE.';

const keybaseId = new KeybaseId({
  keybasePath: 'keybase',
  minKbScore: 75,
  twitterApiKey: 'abcd1234KEY',
  twitterApiSecret: '1234abcdSECRET',
});

keybaseId
  .scoreUser('rickjerrity', true)
  .then((score) => {
    console.log(score);
  })
  .catch((err) => {
    console.error(err);
  });

keybaseId
  .authenticate(TEST_MESSAGE, 'test', 'rickjerrity')
  .then((authenticated) => {
    console.log(authenticated);

    // true
  })
  .catch((err) => {
    console.error(err);

    // Could not verify user message.
  });
```

## More Info

### Why create Keybase ID?

Email addresses and phone numbers have become some of the most popular means of authentication and identifications on the internet, both of which use communicate using protocols that were not designed for those purposes. The email and phone systems have their own flaws, and have not done a great job so far in stopping trolls and bots in user signups, even though that is part of what they are used for. I think something needs to be done to work towards a new solution. Emails and phones should be for communication, not identification or authentication. Keybase has done great work laying the foundation for cryptographically proving ownership of various online identities, now Keybase ID is working to standardize what ownership of these identities *means* in an automated manner.

A blog post explaining some of these ideas in more detail can be found [here](https://blackhole.dev/keybase-id).

### Passport Keybase ID

An [Express](https://expressjs.com/) [Passport](http://www.passportjs.org/) middleware Strategy has been made, which depends on this repo/package. The Keybase Passport strategy can be found on [GitHub](https://github.com/rickjerrity/passport-keybase) and [NPM](https://npm.com/passport-keybase). More information and examples can be found in the README of that repo/package.

### How is the user's identity score calculated?

A user's score is calculated using a variety of factors based off the proofs associated with their Keybase account. Proofs that require "more involved" verification than others, earn more points than those that are "easier" to prove. An example would be how Twitter and GitHub typically require verified a phone number or email when signing up, whereas Reddit and Hackernews typically do not. Another example is how DNS verified ownership of websites proves access to DNS records, and a generic website proof using a hosted text file simply proves ability to upload files. This is a list of all the proofs that Keybase ID looks at when calculating a user's score, and the scoring scale associated with each one.

* Generic Website Proof (limit 2): +5 each (10 possible)
* DNS Website (limit 2): +10 each (20 possible)
* Twitter/GitHub: +10 each (20 possible)
* Reddit/Hackernews: +3 each (6 possible)
* Mobile/Desktop Device (limit 3): +4 each (12 possible)
* Average Proof Age: (5 possible)
* Average Followers: (12 possible)
  * Keybase: (5 possible)
    * 0 Followers: 0
    * 2-5 Followers: 1
    * 6-10 Followers: 2
    * 11-20 Followers: 3
    * 21-50 Followers: 4
    * 51+ Followers: 5
  * Twitter: (3 possible) * only available when Twitter API Key/Secret are passed in, otherwise these points are split between GitHub and Keybase
    * 0 Followers: 0
    * 51-300 Followers: 1
    * 301-2000 Followers: 2
    * 2001+ Followers: 3
  * GitHub: (4 possible)
    * 0 Followers: 0
    * 2-5 Followers: 1
    * 6-10 Followers: 2
    * 11-20 Followers: 3
    * 21+ Followers: 4
* Average Account Age (15 possible)
  * Keybase: (6 possible)
    * 0-30 Days Old: 0
    * 31-90 Days: 1
    * 91-180 Days: 2
    * 181-365 Days: 3
    * 1-2 Years: 4
    * 2-3 Years: 5
    * 3+ Years: 6
  * Twitter: (4 possible) * only available when Twitter API Key/Secret are passed in, otherwise these points are split between GitHub and Keybase
    * 0 Days Old: 0
    * 31-90 Days: 1
    * 91 Days-2 Years: 2
    * 2-4 Years: 3
    * 4+ Years: 4
  * GitHub: (5 possible)
    * 0-30 Days Old: 0
    * 31-90 Days: 1
    * 91-365 Days: 2
    * 1-2 Years: 3
    * 2-3 Years: 4
    * 3+ Years: 5

Figuring out this point system was the most difficult part of this project and is the part most up for discussion. This was formed off *a single person's opinion* of how these proofs should be scored, given a scale of 0-100, using the proofs that are currently available on the Keybase system. I am sure this system can be improved and things will need to be added, changed, and removed until a *community* can agree on what constitutes the various levels of identification.

### Keybase Score (KB Score)

These are the various identity strengths correlating to the scores generated using the above scoring system. This is another big part of this project that is up for discussion and would be best determined by a community decision.

Total Possible: 100

* Positive Identity: 90+
* Accurate Identity: 75+
* Passable Identity: 51+
* Weak Identity: 26+
* Unknown Identity: 0+

## Contributing

Definitely looking for people to contribute. This project needs unit tests pretty desparately, so that'd be a great place to start! Also looking to get more eyes and brains on the overall scoring system, so feel free to make issues regarding that or DM [@rickjerrity](https://twitter.com/rickjerrity) on Twitter and we can connect more on Discord or something.

## License

MIT License.
