const supertest = require('supertest');
const path = require('path');
const app = require('./server');
const { isTypedArray } = require('util/types');

describe('File Upload', () => {
    it('should upload a file', async () => {
      const response = await supertest(app)
        .post('/upload')
        .attach('file', path.join(__dirname, "/testfile/Mengmeng's Resume.pdf")); // Adjust the file path
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expect.anything()); // Adjust based on your actual response
    });
  });