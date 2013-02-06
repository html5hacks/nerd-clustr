exports = module.exports = function(req, res, options) {
  /* options = {
    from: String, 
    to: String,
    cc: String,
    bcc: String,
    text: String,
    textPath String,
    html: String,
    htmlPath: String,
    attachements: [String],
    success: Function,
    error: Function
  } */
  
  var renderText = function(callback) {
    res.render(options.textPath, options.locals, function(err, text) {
      if (err) {
        callback(err, null);
      }
      else {
        options.text = text;
        return callback(null, 'done rendering text');
      }
    });
  };
  
  var renderHtml = function(callback) {
    res.render(options.htmlPath, options.locals, function(err, html) {
      if (err) {
        callback(err, null);
      }
      else {
        options.html = html;
        return callback(null, 'done rendering html');
      }
    });
  };
  
  var renderers = [];
  if (options.textPath) renderers.push(renderText);
  if (options.htmlPath) renderers.push(renderHtml);
  
  //render templates
  require('async').parallel(
    renderers,
    function(err, results){
      if (err) {
        options.error('Email template render failed. '+ err);
        return;
      }
      
      //build attachements
      var attachements = [];
      
      //html alternative
      if (options.html) {
        attachements.push({ data: options.html, alternative: true });
      }
      
      //other attachments
      if (options.attachments) {
        for (var i = 0 ; i < options.attachments.length ; i++) {
          attachements.push(options.attachments[i]);
        }
      }
      
      //send email
      var emailjs = require('emailjs/email');
      var emailer = emailjs.server.connect( req.app.get('email-credentials') );
      emailer.send({
        from: options.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        attachment: attachements
      }, function(err, message) {
        if (err) {
          options.error('Email failed to send. '+ err);
          return;
        }
        else {
          options.success(message);
          return;
        }
      });
    }
  );
}
