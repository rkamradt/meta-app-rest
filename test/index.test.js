var should = require('should');
var request = require('supertest');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var fs = require('fs');
var morgan = require('morgan');
var memstore = require('meta-app-mem');
var modelsFactory = require('meta-app');
var router = require('../index');

var json = JSON.parse(fs.readFileSync('test/meta-data.json'));
var models = modelsFactory(json);
var store = memstore(models.getModel('User'));

describe('Rest API with mem storage', function(){
  var app;
  before(function(done) {
    app = express();

    app.use(bodyParser.urlencoded({extended: true}));

    // parse application/json
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(morgan("dev", { format: 'dev', immediate: true }));
    router(app, models, store);
    done();
  });
  it('should be able to insert a new User', function(done) {
    var body = {
      "firstName": "Randal",
      "lastName": "Kamradt",
      "email": "randysr@kamradtfamily.net",
      "password": "RjklstTJR"
    };
    request(app)
      .post('/User/randysr@kamradtfamily.net')
      .send(body)
      .expect(201) //Status code
      .end(function(err,res) {
        if (err) {
          throw err;
        }
        done();
    });
  });
  it('should reject an add if email is bad', function(done) {
    var body = {
      "firstName": "Randal",
      "lastName": "Kamradt",
      "email": "randysrkamradtfamily.net",
      "password": "RjklstTJR"
    };
    request(app)
      .post('/User/randysrkamradtfamily.net')
      .send(body)
      .expect(400) //Status code
      .end(function(err,res) {
        if (err) {
          throw err;
        }
        done();
    });
  });
  it('should be able to find a User by email', function(done) {
    request(app)
      .get('/User/randysr@kamradtfamily.net')
      .expect(200) //Status code
      .expect('Content-Type', /json/)
      .end(function(err,res) {
        if (err) {
          throw err;
        }
        res.body.should.be.instanceOf(Object);
        res.body.should.have.property('firstName', 'Randal');
        res.body.should.have.property('lastName', 'Kamradt');
        done();
    });
  });
  it('should be able to update a User by email', function(done) {
    request(app)
        .get('/User/randysr@kamradtfamily.net')
        .expect(200) //Status code
        .expect('Content-Type', /json/)
        .end(function(err,res) {
      if (err) {
        throw err;
      }
      res.body.should.be.instanceOf(Object);
      res.body.should.have.property('firstName', 'Randal');
      res.body.should.have.property('lastName', 'Kamradt');
      res.body.firstName = 'Randy';
      request(app)
          .put('/User/randysr@kamradtfamily.net')
          .send(res.body)
          .expect(200) //Status code
          .end(function(err,res) {
        if (err) {
          throw err;
        }
        request(app)
            .get('/User/randysr@kamradtfamily.net')
            .expect(200) //Status code
            .expect('Content-Type', /json/)
            .end(function(err,res) {
          if (err) {
            throw err;
          }
          res.body.should.be.instanceOf(Object);
          res.body.should.have.property('firstName', 'Randy');
          res.body.should.have.property('lastName', 'Kamradt');
          done();
        });
      });
    });
  });
  it('should be able to delete a User by email', function(done) {
    request(app)
      .delete('/User/randysr@kamradtfamily.net')
      .expect(204) //Status code
      .end(function(err,res) {
        if (err) {
          throw err;
        }
        request(app)
          .get('/User/randysr@kamradtfamily.net')
          .expect(404) //Status code
          .end(function(err,res) {
            if (err) {
              throw err;
            }
            done();
        });
    });
  });
  it('should be able to find the metadata for User', function(done) {
    request(app)
      .get('/metadata/User')
      .expect(200) //Status code
      .expect('Content-Type', /json/)
      .end(function(err,res) {
        if (err) {
          throw err;
        }
        res.body.should.be.instanceOf(Object);
        res.body.should.have.property('name', 'User');
        done();
    });
  });
  it('should be able to find all metadata', function(done) {
    request(app)
      .get('/metadata')
      .expect(200) //Status code
      .expect('Content-Type', /json/)
      .end(function(err,res) {
        if (err) {
          throw err;
        }
        res.body.should.be.instanceOf(Object);
        res.body.should.have.property('models');
        res.body.models.should.be.instanceOf(Array);
        res.body.models.should.have.length(2);
        done();
    });
  });
});
