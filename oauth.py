import httplib2
import logging
#import os
#import pickle
import webapp2
from static_data import StaticData

from apiclient.discovery import build
from oauth2client import util
#from oauth2client.appengine import oauth2decorator_from_clientsecrets
from oauth2client.appengine import OAuth2Decorator
from oauth2client.client import AccessTokenRefreshError
from oauth2client import clientsecrets
from google.appengine.api import memcache

class OAuth2DecoratorFromClientSecretsString(OAuth2Decorator):
  """An OAuth2Decorator that builds from a clientsecrets string.

  Uses a clientsecrets string as the source for all the information when
  constructing an OAuth2Decorator.

  Example:

    decorator = OAuth2DecoratorFromClientSecretsString(
      secrets,
      scope='https://www.googleapis.com/auth/plus')


    class MainHandler(webapp.RequestHandler):

      @decorator.oauth_required
      def get(self):
        http = decorator.http()
        # http is authorized with the user's Credentials and can be used
        # in API calls
  """

  @util.positional(3)
  def __init__(self, secrets, scope):
    """Constructor

    Args:
      secrets: string, Client secrets.
      scope: string or iterable of strings, scope(s) of the credentials being
        requested.
    """
    client_type, client_info = clientsecrets.loads(secrets)
    if client_type not in [
        clientsecrets.TYPE_WEB, clientsecrets.TYPE_INSTALLED]:
      raise InvalidClientSecretsError(
          'OAuth2Decorator doesn\'t support this OAuth 2.0 flow.')
    constructor_kwargs = {
      'auth_uri': client_info['auth_uri'],
      'token_uri': client_info['token_uri'],
      'message': 'Missing client secrets',
    }
    revoke_uri = client_info.get('revoke_uri')
    if revoke_uri is not None:
      constructor_kwargs['revoke_uri'] = revoke_uri
    logging.info( "Constructing OAuth2Decorator for scope " + scope )
    super(OAuth2DecoratorFromClientSecretsString, self).__init__(
        client_info['client_id'], client_info['client_secret'],
        scope, **constructor_kwargs)
    self._message = 'Please configure your application for OAuth 2.0.'


@util.positional(2)
def oauth2decorator_from_clientsecrets_string(secrets, scope):
  """Creates an OAuth2Decorator populated from a clientsecrets file.

  Args:
    secrets: string, Client secrets.
    scope: string or list of strings, scope(s) of the credentials being
      requested.

  Returns: An OAuth2Decorator

  """
  return OAuth2DecoratorFromClientSecretsString(secrets, scope)

http = httplib2.Http(memcache)
service = build("plus", "v1", http=http)
credentials = StaticData.get_credentials()
decorator = oauth2decorator_from_clientsecrets_string( 
    credentials,
    'https://www.googleapis.com/auth/plus.me')
    
app = webapp2.WSGIApplication([
  (decorator.callback_path, decorator.callback_handler())
])
