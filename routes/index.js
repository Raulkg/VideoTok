require('dotenv').config({path: __dirname + '/../.env'});
const TO_NUMBER = '13154207439';
const NEXMO_NUMBER = '';
const API_KEY = 'your key';
const API_SECRET = 'Your secret key';
const APP_ID = 'Your secret key';

const express = require('express');
OpenTok = require('opentok');
const router = express.Router();

let opentok;
let sessionId;
const apiKey = API_KEY;
const apiSecret = API_SECRET;

// Initialize OpenTok
opentok = new OpenTok(apiKey, apiSecret);

// Initialize nexmo
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  applicationId: APP_ID,
  privateKey: __dirname + '/../public/private.key',
});

// Create a session and store it in the express app
opentok.createSession(function(err, session) {
  if (err) throw err;
  sessionId = session.sessionId;
  // We will wait on starting the app until this is done
});

/* GET home page. */
router.get('/', function(req, res, next) {
  // generate a fresh token for this client
  const token = opentok.generateToken(sessionId);

  res.render('index', {
    title: 'OpenTok',
    apiKey: apiKey,
    sessionId: sessionId,
    token: token,
  });
});

router.get('/apidata', function(req, res, next) {
  // generate a fresh token for this client
  const token = opentok.generateToken(sessionId);

  res.json({
    title: 'OpenTok',
    apiKey: apiKey,
    sessionId: sessionId,
    token: token,
  });
});

router.get('/start', function(req, res) {
  const archiveOptions = {
    name: 'Open Tok Express React Demo',
    hasAudio: true,
    hasVideo: true,
    outputMode: 'composed',
  };
  if (outputMode === 'composed') {
    startOptions.layout = {type: 'horizontalPresentation'};
  }
  opentok.startArchive(sessionId, archiveOptions, function(err, archive) {
    console.log(err);

    res.json(archive);
  });
  res.json(archiveOptions);
});

router.get('/stop/:archiveId', function(req, res) {
  const archiveId = req.param('archiveId');
  opentok.stopArchive(archiveId, function(err, archive) {
    console.log(err);
    if (err) {
      return res.send(
          500,
          'Could not stop archive ' + archiveId + '. error=' + err.message,
      );
    }
    res.json(archive);
  });
});

router.get('/history', function(req, res) {
  const page = req.param('page') || 1;
  const offset = (page - 1) * 5;
  opentok.listArchives({offset: offset, count: 5}, function(
      err,
      archives,
      count,
  ) {
    if (err) {
      return res.send(500, 'Could not list archives. error=' + err.message);
    }
    res.json({
      archives: archives,
      showPrevious: page > 1 ? '/history?page=' + (page - 1) : null,
      showNext: count > offset + 5 ? '/history?page=' + (page + 1) : null,
    });
  });
});

router.get('/download/:archiveId', function(req, res) {
  const archiveId = req.param('archiveId');
  opentok.getArchive(archiveId, function(err, archive) {
    if (err) {
      return res.send(
          500,
          'Could not get archive ' + archiveId + '. error=' + err.message,
      );
    }
    res.redirect(archive.url);
  });
});

router.get('/delete/:archiveId', function(req, res) {
  const archiveId = req.param('archiveId');
  opentok.deleteArchive(archiveId, function(err) {
    if (err) {
      return res.send(
          500,
          'Could not stop archive ' + archiveId + '. error=' + err.message,
      );
    }
    res.redirect('/history');
  });
});

router.get('/send/:msg', function(req, res) {
  const message = req.param('msg');
  const from = 'Vonage APIs';
  const to = '13154207439';
  const text = 'Hello from Vonage SMS API - Rahul Demo';

  nexmo.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
      res.json(err);
    } else {
      if (responseData.messages[0]['status'] === '0') {
        res.json({Success: 'Message sent successfully.'});
      } else {
        res.json({
          msg: `Message failed with error: ${responseData.messages[0]['error-text']}`,
        });
      }
    }
  });
});

router.get('/call/:number', function(req, res) {
  const num = req.param('number');
  const ncco = [
    {
      action: 'talk',
      voiceName: 'Kendra',
      text: 'Hello This is Demo calling from localhost. How are you doing ',
    },
  ];

  async () => {
    nexmo.calls.create(
        {
          to: [{type: 'phone', number: num}],
          from: {type: 'phone', number: NEXMO_NUMBER},
          ncco,
        },
        (err, result) => {
          console.log(err || result);
        },
    );
  };
});

router.get('/verify', function(req, res) {
  let verifyRequestId;

  nexmo.verify.request(
      {
        number: '13154207439',
        brand: 'Vonage',
      },
      (err, result) => {
        if (err) {
          console.error(err);
        } else {
          verifyRequestId = result.request_id;
          console.log('request_id', verifyRequestId);
          res.json({request_id: verifyRequestId});
        }
      },
  );
});

router.get('/validate/:request_id', function(req, res) {
  const request_id = req.param('request_id');
  const code = req.query.code;

  nexmo.verify.check(
      {
        request_id: request_id,
        code: code,
      },
      (err, result) => {
        res.json({result: err ? err : result});
      },
  );
});

module.exports = router;
