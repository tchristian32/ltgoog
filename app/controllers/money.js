var express = require('express'),
  router = express.Router(),  
  Article = require('../models/article');

var offerRepo = require('offers/processes/offers.js');
var https = require('https');

router.get('/', function (req, res, next) {
  var articles = [new Article(), new Article()];
  res.end('Hello');
});

router.post('/', function (req, res, next) {
      var search = req.body.search;
    //req.assert('search', 'Please enter a search').notEmpty();

    //var errors = req.validationErrors();
    //if( !errors){ 
        var luis = '';
        https.get({
            host: 'api.projectoxford.ai',
            path: '/luis/v1/application?id=412057c4-4da3-4cfa-ac6f-a75faf4ed1cf&subscription-key=da80cbb845a84438a67437d953630c05&q=' + encodeURIComponent(search)
        }, function (res) {
            res.on('data', function (data) {
                luis += data.toString();
            });

            res.on('error', function (err) {
                console.log ('Error: ' + err.message);
            })

            res.on('end', luisDone);
        });

        function luisDone() {
            var results = JSON.parse(luis);
            var strZip = '';
            var strProduct = '';
            var strLoanAmount = '';

            if (results.intents && results.intents[0] && results.intents[0].intent && results.intents[0].intent === 'Product Type') {
                results.entities.forEach(function(entity) {
                    switch (entity.type) {
                        case 'Zip':
                            strZip = entity.entity; 
                            break;
                        case 'Product':
                            strProduct = entity.entity;
                            break;
                        case 'builtin.money':
                            strLoanAmount = entity.entity;
                            break;
                        default:
                            console.log(entity);
                            break;
                    }
                });

                var loanAmount = strLoanAmount.split(' ');
                var retResult = "Great, I found 35 " + strProduct + " offers for a " + strLoanAmount + " home in " + strZip;
                var request = {
                    query: {
                        "bankruptcyDischarged": "NEVER",
                        "cashoutAmount": "0",
                        "city": "Charlotte",
                        "esourceId": "6131666",
                        "estDownPayment": "65000",
                        "estPurchPrice": loanAmount[1] + loanAmount[3],
                        "estimatedCreditScoreBand": "EXCELLENT",
                        "foreclosureDischarged": "NEVER",
                        "formVariation": "0-0-1-1-0-1-0-0-1-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-0-1-1-0-0-1",
                        "fullName": "undefined+undefined",
                        "ipAddress": "12.152.10.63",
                        "mortgageBalance": "160000",
                        "offerVariation": "CE2",
                        "partnerTrackingId": "755fcb9d-07b9-2202-cfc1-5257a6a1f9be",
                        "phoneMask": "false",
                        "propertyType": "SINGLEFAMDET",
                        "propertyUse": "OWNEROCCUPIED",
                        "propertyZipCode": "28277",
                        "realEstateValue": "200000",
                        "requestedLoanType": strProduct.toUpperCase(),
                        "secondMortgageBalance": "0",
                        "state": "NC",
                        "veteranStatusType": "NO",
                        "hasVaLoan":"NO",
                        "zipcode": strZip
                    }
                }

                offerRepo.get(request, function (err, myOffers) {
                    if (err) {
                        console.log(err);
                    } else if (myOffers) {
                        res.end(JSON.stringify(myOffers, null, 4));
                    } else {
                        res.end(retResult);
                    }
                });
            } else {
                res.end(luis);
            }
        }
        //res.end('Search: ' + search);  
        // sendEmail(function(){
        //     res.render('money', { 
        //         title: 'My Page',
        //         success: true
        //     });
        // });
    //}
    // else {
    //     res.end('Search error: ' + errors);
        // res.render('money', { 
        //     title: 'My Page',
        //     errors: errors
        // });
    //}   
});

module.exports = function (app) {
  app.use('/money', router);
};