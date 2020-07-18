const KeybaseId = require('../lib');

let options;

beforeEach(() => {
  options = {
    keybasePath: 'keybase',
    minKbScore: 0,
    twitterApiKey: 'abcd1234_Test_Twitter_Api_Key',
    twitterApiSecret: '1234abcd_Test_Twitter_Api_Secret',
  };
});

describe('KeybaseId', () => {
  describe('instance', () => {
    test('should throw if constructed without a keybasePath option', () => {
      options.keybasePath = undefined;

      expect(() => {
        new KeybaseId(options);
      }).toThrow(TypeError);

      expect(() => {
        new KeybaseId(options);
      }).toThrow('No keybasePath option was specified');
    });
  });
});
