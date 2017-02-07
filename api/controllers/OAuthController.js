/**
 * Created by harryliu on 2/6/17.
 */

var https = require('https');
/**
 * OAuthController
 *
 * @description :: Server-side logic for open authentication
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  authorize: (req, res) =>{
    console.log('Authenticating with Github');
    let code = req.query['code'];

    var options = {
      host:'github.com',
      post: 80,
      method: 'POST',
      path: '/login/oauth/access_token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    var githubReq = https.request(options, (githubRes)=>{
      var body = '';
      githubRes.on('data', (chunk) => {
        body += chunk;
      });

      githubRes.on('end', () => {
        console.log(body);
        res.send(body);
        res.end();
      });
    });

    githubReq.write(JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }));

    githubReq.end();
  }
};
