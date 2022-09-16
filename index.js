'use strict';
require('dotenv').config();
var cronJob = require('cron').CronJob;
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_KEY,
);

var cronJ1 = new cronJob(
  `*/${process.env.TIME_LIMIT} * * * * *`,
  async function () {
    listOfPins();
  },
  undefined,
  true,
  'GMT',
);

const testPinataAuthentication = async () => {
  let result = await pinata
    .testAuthentication()
    .catch((err) =>
      console.log('Error while connecting to Pinata Server -> %o', err),
    );

  if (!result) return;
  console.log(
    `Connection to Pinata Server ${
      result.authenticated ? 'successful !' : 'failed !'
    }`,
  );
};

const unpinByHash = async (hash) => {
  try {
    await pinata.unpin(hash);
  } catch (err) {
    console.log(err);
  }
};

const listOfPins = async () => {
  const filters = {
    status: 'pinned',
    pageLimit: 10,
  };
  try {
    console.log('Unpinning pinned files in progress...');
    var list = await pinata.pinList(filters);
    console.log(list.count);
    if (list.count === 0) {
      console.log('Stopping cron job. All files have been unpined...');
      cronJ1.stop();
      process.exit(0);
    }
    var pins = list.rows.map((t) => t.ipfs_pin_hash);
    pins.forEach(async (p) => {
      await unpinByHash(p);
    });
  } catch (err) {
    console.log(err);
  }
};

if (require.main === module) {
  cronJ1.start();
}
