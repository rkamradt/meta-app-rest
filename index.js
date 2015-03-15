/**
 *
 * Copyright 2015 Randal L Kamradt Sr.
 *
 * REST router.
 * @module meta-data/meta-rest
 */
/**
 * An internal function that creates a route for
 * a single model
 *
 * @param {Object} app   The Express Object
 * @param {Object} model basic JSON object that describes the model
 * @param {Object} store A store API
 */
var createRoutes = function(app, model, store) {
  var key = model.getKey();
  if(!key) { // ignore models without keys
    return;
  }
  app.get('/' + model.getName(), function(req, res) {
    store.findAll(function(err, result) {
      if(err) {
        res.status(500).send(err);
      } else {
        res.status(200).type('json').send(JSON.stringify(result));
      }
      res.end();
    });
  });
  app.get('/' + model.getName() + '/:id', function(req, res) {
    store.find(req.params.id, function(err, result) {
      if(err) {
        res.status(500).send(err);
      } else {
        if(!result) {
          res.status(404);
        } else {
          res.status(200).type('json').send(JSON.stringify(result));
        }
      }
      res.end();
    });
  });
  app.put('/' + model.getName() + '/:id', function(req, res) {
    var item = req.body;
    item[key.getName()] = req.params.id; // ensure id matches
    if(!model.isValid(item)) {
      res.status(400).send('invalid');
      res.end();
      return;
    }
    store.find(req.params.id, function(err, result) {
      if(err) {
        res.status(500).send(err);
        res.end();
      } else {
        if(!result) {
          res.status(404);
          res.end();
        } else {
          store.update(item, function(err, result) {
            if(err) {
              res.status(500).send(err);
            } else {
              res.status(200);
            }
            res.end();
          });
        }
      }
    });
  });
  app.post('/' + model.getName() + '/:id', function(req, res) {
    var item = req.body;
    item[key.getName()] = req.params.id; // ensure id matches
    if(!model.isValid(item)) {
      res.status(400).send('invalid');
      res.end();
      return;
    }
    store.add(item,function(err, result) {
      if(err) {
        res.status(500).send(err);
      } else {
        res.status(201);
      }
      res.end();
    });
  });
  app.delete('/' + model.getName() + '/:id', function(req, res) {
    store.remove(req.params.id, function(err, result) {
      if(err) {
        res.status(500).send(err);
      } else {
        res.status(204);
      }
      res.end();
    });
  });
};
/**
 * Add routes to Express for a basic rest web service. The
 * web service includes:
 *
 * GET returns the entire data set
 * GET :id returns a single document
 * POST {doc} creates a single document
 * PUT :id {doc} updates a single document
 * DELETE :id deletes a single document
 *
 * It creates routes for each model listed in the input file
 * It also creates a route for getting the meta-data
 *
 * TODO pass in a store factory to account for each model in models
 *
 * @param {Object} app   The Express Object
 * @param {Object} model basic JSON object that describes the models
 * @param {Object} store A store API
 */
module.exports = function(app, models, store) {
  for(var modelName in models.getModels()) {
    var model = models.getModel(modelName);
    createRoutes(app, model, store);
  }
  app.get('/metadata', function(req, res) {
    res.status(200).type('json').send(JSON.stringify(models._json));
    res.end();
  });
  app.get('/metadata/:id', function(req, res) {
    var model;
    for(var modelName in models.getModels()) {
      var m = models.getModel(modelName);
      if(m.getName() === req.params.id) {
        model = m;
        break;
      }
    }
    if(!model) {
      res.status(404).type('json');
    } else {
      res.status(200).type('json').send(JSON.stringify(model._json));
    }
    res.end();
  });
};
