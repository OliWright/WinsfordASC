# config.py

from authomatic.providers import oauth2, oauth1, gaeopenid
import authomatic

CONFIG = {
    
    'twitter': {
           
        # Provider class
        'class_': oauth1.Twitter,
        
        # Twitter is an AuthorizationProvider so we need to set several other properties too:
        'consumer_key': '########################',
        'consumer_secret': '########################',
    },
    
    'facebook': {
           
        # Provider class
        'class_': oauth2.Facebook,
        
        # Facebook is an AuthorizationProvider too.
        'consumer_key': '########################',
        'consumer_secret': '########################',
        
        # But it is also an OAuth 2.0 provider and it needs scope.
        'scope': ['user_about_me', 'email', 'publish_stream', 'read_stream'],
    },
    
    'google': {
    
        # Provider class
        'class_': oauth2.Google,
        
        # Google is an AuthorizationProvider too.
        'consumer_key': '287569754424-d9ipji8k7r27jkiil0931ffrckerf6tb.apps.googleusercontent.com',
        'consumer_secret': '_9_dzcaxwF4a2n3TeAvO9Zi7',
        'id': authomatic.provider_id(),
 
        # But it is also an OAuth 2.0 provider and it needs scope.
        'scope': oauth2.Google.user_info_scope + [
            'https://www.googleapis.com/auth/calendar',
            'https://mail.google.com/mail/feed/atom',
            'https://www.googleapis.com/auth/drive',
            'https://gdata.youtube.com'],
        '_apis': {
            'List your calendars': ('GET', 'https://www.googleapis.com/calendar/v3/users/me/calendarList'),
            'List your YouTube playlists': ('GET', 'https://gdata.youtube.com/feeds/api/users/default/playlists?alt=json'),
        },
    }
    
}
