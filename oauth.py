import httplib2
import logging
import os
import pickle
import webapp2

from apiclient.discovery import build
from oauth2client.appengine import oauth2decorator_from_clientsecrets
from oauth2client.client import AccessTokenRefreshError
from google.appengine.api import memcache


# CLIENT_SECRETS, name of a file containing the OAuth 2.0 information for this
# application, including client_id and client_secret, which are found
# on the API Access tab on the Google APIs
# Console <http://code.google.com/apis/console>
CLIENT_SECRETS = os.path.join(os.path.dirname(os.path.dirname(__file__)),
    'client_secrets.json')

# Helpful message to display in the browser if the CLIENT_SECRETS file
# is missing.
MISSING_CLIENT_SECRETS_MESSAGE = """
<h1>Warning: Please configure OAuth 2.0</h1>
<p>
To make this sample run you will need to populate the client_secrets.json file
found at:
</p>
<p>
<code>%s</code>.
</p>
<p>with information found on the <a
href="https://code.google.com/apis/console">APIs Console</a>.
</p>
""" % CLIENT_SECRETS


http = httplib2.Http(memcache)
service = build("plus", "v1", http=http)
decorator = oauth2decorator_from_clientsecrets(
    CLIENT_SECRETS,
    'https://www.googleapis.com/auth/plus.me',
    MISSING_CLIENT_SECRETS_MESSAGE)

class GetAuthorizeURL(webapp2.RequestHandler):
  @decorator.oauth_aware
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write( decorator.authorize_url() );
    variables = {
        'url': decorator.authorize_url(),
        'has_credentials': decorator.has_credentials()
        }
    self.render_response('grant.html', **variables)

class GetCredentials(webapp2.RequestHandler):
  #@decorator.oauth_required
  @decorator.oauth_aware
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    if decorator.has_credentials():
      try:
        http = decorator.http()
        user = service.people().get(userId='me').execute(http)
        text = 'Hello, %s!' % user['displayName']

        self.response.out.write( text );
      except AccessTokenRefreshError:
        self.redirect('/')
    else:
      self.response.out.write( "Nope" );
    
app = webapp2.WSGIApplication([
  ('/get_authorize_url', GetAuthorizeURL),
  ('/get_credentials', GetCredentials),
  (decorator.callback_path, decorator.callback_handler())
])
