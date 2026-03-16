const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');

describe('GET /', () => {
    it('should respond with 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.status).to.equal(200);
    });
});

describe('GET /login', () => {
    it('should respond with 200 OK', async () => {
        const res = await request(app).get('/login');
        expect(res.status).to.equal(200);
    });
});

describe('GET /challenges without login', () => {
    it('should redirect to /login', async () => {
        const res = await request(app).get('/challenges');
        expect(res.status).to.equal(302);
        expect(res.header.location).to.equal('/login');
    });
});
