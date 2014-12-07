# config.py

from authomatic.providers import oauth2, oauth1, gaeopenid
import authomatic

from static_data import StaticData
import json

credentials = json.loads( StaticData.get_credentials() )

print( "Key: " + credentials["google"]["key"] )

CONFIG = {
    
    'twitter': {
           
        # Provider class
        'class_': oauth1.Twitter,
        
        # Twitter is an AuthorizationProvider so we need to set several other properties too:
        'consumer_key': credentials["twitter"]["key"],
        'consumer_secret': credentials["twitter"]["secret"],
    },
    
    'facebook': {
           
        # Provider class
        'class_': oauth2.Facebook,
        
        # Facebook is an AuthorizationProvider too.
        'consumer_key': credentials["facebook"]["key"],
        'consumer_secret': credentials["facebook"]["secret"],
        
        # But it is also an OAuth 2.0 provider and it needs scope.
        'scope': ['user_about_me', 'email', 'publish_stream', 'read_stream'],
    },
    
    'google': {
    
        # Provider class
        'class_': oauth2.Google,
        
        # Google is an AuthorizationProvider too.
        'consumer_key': credentials["google"]["key"],
        'consumer_secret': credentials["google"]["secret"],
        'id': authomatic.provider_id(),
 
        # But it is also an OAuth 2.0 provider and it needs scope.
        'scope': oauth2.Google.user_info_scope,
        
        #'offline': True,
    }
    
}
