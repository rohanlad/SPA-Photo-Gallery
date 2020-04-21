'use strict';

const request = require('supertest');
const server = require('./app.js');

describe('Test the login service', () => {
    test('POST /api/auth succeeds if the credentials are correct', () => {
        var body = { email_address: 'f@f.com', password: 'yu' };
        return request(server)
            .post('/api/auth')
            .send(body)
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/Successfully logged in/);
    });

    test('POST /api/auth does not allow login if the credentials are incorrect', () => {
        var body = { email_address: 'incorrect@email.com', password: 'invalid_pw' };
        return request(server)
            .post('/api/auth')
            .send(body)
            .expect(401)
            .expect('Content-type', /json/)
            .expect(/Those credentials are incorrect/);
    });

    test('POST /api/auth does not allow login if email is empty', () => {
        var body = { password: 'password' };
        return request(server)
            .post('/api/auth')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/A valid email address must be provided/);
    });

    test('POST /api/auth does not allow login if password is empty', () => {
        var body = { email_address: 'f@f.com' };
        return request(server)
            .post('/api/auth')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/Password cannot be empty/);
    });
});

describe('Test the register service', () => {
    test('POST /api/newaccount requires an email that is not already taken', () => {
        var body = { email_address: 'joe@bloggs.com', password: 'yu' };
        return request(server)
            .post('/api/newaccount')
            .send(body)
            .expect(409)
            .expect('Content-type', /json/)
            .expect(/That email address is already in use/);
    });

    test('POST /api/newaccount does not allow register when email is empty', () => {
        var body = { password: 'yu' };
        return request(server)
            .post('/api/newaccount')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/A valid email address must be provided/);
    });

    test('POST /api/newaccount does not allow register when password is empty', () => {
        var body = { email_address: 'test@newaccount.com' };
        return request(server)
            .post('/api/newaccount')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/Password cannot be empty/);
    });

    test('POST /api/newaccount registers a new account successfully', () => {
        var body = { email_address: 'test098@testing345test.com', password: 'random' };
        return request(server)
            .post('/api/newaccount')
            .send(body)
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/Account successfully registered/);
    });

    test('POST /api/deleteTestAccount deletes the test account successfully', () => {
        return request(server)
            .post('/api/deleteTestAccount')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/Account successfully deleted/);
    });
});

describe('Test the check authenticity service', () => {
    test('GET /api/checkperms succeeds', () => {
        return request(server)
            .get('/api/checkperms')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/unauthenticated/);
    });
});

describe('Test the service that retrieves the image sources', () => {
    test('GET /api/getImageSources succeeds', () => {
        return request(server)
            .get('/api/getImageSources')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/Arguably the greatest figure in British sporting history/);
    });
});

describe('Test the service that retrieves the user leaderboard', () => {
    test('GET /api/getUserLeaderboard succeeds', () => {
        return request(server)
            .get('/api/getUserLeaderboard')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/joe@bloggs.com/);
    });
});

describe('Test the service that retrieves comments', () => {
    test('GET /api/getComments succeeds', () => {
        return request(server)
            .get('/api/getComments')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/unbelieveable stuff/);
    });

    test('GET /api/getComments succeeds with specific parameter', () => {
        return request(server)
            .get('/api/getComments?source=' + encodeURIComponent(
                'https://i.pinimg.com/originals/aa/95/95/aa959524121414626cbb42322575fd9d.jpg'))
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/wonderful wonderful goal/);
    });

    test('GET /api/getComments responds when no comments have been uploaded', () => {
        return request(server)
            .get('/api/getComments?source=' + encodeURIComponent('not_real.jpg'))
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/No comments have been submitted for this photo yet./);
    });
});

describe('Test the upload photo service', () => {
    test('POST /api/uploadPhoto requires image src link', () => {
        var body = { caption: 'this is my caption' };
        return request(server)
            .post('/api/uploadPhoto')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/Image source link cannot be empty/);
    });

    test('POST /api/uploadPhoto requires caption', () => {
        var body = { source_link: 'random_src_link.png' };
        return request(server)
            .post('/api/uploadPhoto')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/Caption cannot be empty/);
    });

    test('POST /api/uploadPhoto requires authenticated user', () => {
        var body = { source_link: 'random_src_link.png', caption: 'this is my caption' };
        return request(server)
            .post('/api/uploadPhoto')
            .send(body)
            .expect(403)
            .expect('Content-type', /json/)
            .expect(/There is no valid cookie to determine authenticity/);
    });
});

describe('Test the submit comment service', () => {
    test('POST /api/submitComment requires image src link', () => {
        var body = { comment: 'this is my comment' };
        return request(server)
            .post('/api/submitComment')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/Image source link cannot be empty/);
    });

    test('POST /api/submitComment requires comment', () => {
        var body = { source_link: 'random_src_link.png' };
        return request(server)
            .post('/api/submitComment')
            .send(body)
            .expect(422)
            .expect('Content-type', /json/)
            .expect(/Comment cannot be empty/);
    });

    test('POST /api/submitComment requires authenticated user', () => {
        var body = { source_link: 'random_src_link.png', comment: 'this is my comment' };
        return request(server)
            .post('/api/submitComment')
            .send(body)
            .expect(403)
            .expect('Content-type', /json/)
            .expect(/There is no valid cookie to determine authenticity/);
    });
});
