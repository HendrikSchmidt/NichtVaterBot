'use strict';

require('greenlock-express').create({

    // Let's Encrypt v2 is ACME draft 11
    version: 'draft-11'

    // Note: If at first you don't succeed, switch to staging to debug
    // https://acme-staging-v02.api.letsencrypt.org/directory
    , server: 'https://acme-staging-v02.api.letsencrypt.org/directory'

    // Where the certs will be saved, MUST have write access
    , configDir: '~/ssl/'

    // You MUST change this to a valid email address
    , email: 'hendriknas@gmail.com'

    // You MUST change these to valid domains
    // NOTE: all domains will validated and listed on the certificate
    , approveDomains: [ 'nichtvaterbot.openode.io', 'www.nichtvaterbot.openode.io' ]

    // You MUST NOT build clients that accept the ToS without asking the user
    , agreeTos: true

    , app: require('express')().use('/', function (req, res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end('Hello, World!\n\n💚 🔒.js');
    })

    // Join the community to get notified of important updates
    , communityMember: true

    // Contribute telemetry data to the project
    , telemetry: true

//, debug: true

}).listen(80, 443);