# -*- coding: utf-8 -*-
"""The App Engine Transport Adapter for requests.

This requires a version of requests >= 2.8.0.
"""
import requests
from requests import adapters
from requests import sessions

from .. import exceptions as exc
from .._compat import gaecontrib


class AppEngineAdapter(adapters.HTTPAdapter):
    """A transport adapter for Requests to use urllib3's GAE support.

    When deploying to Google's App Engine service, some of Requests'
    functionality is broken. There is underlying support for GAE in urllib3.
    This functionality, however, is opt-in and needs to be enabled explicitly
    for Requests to be able to use it.

    Example usage:

    .. code-block:: python

        >>> import requests
        >>> import ssl
        >>> from requests_toolbelt.adapters import appengine
        >>> s = requests.Session()
        >>> if using_appengine():
        ...    s.mount('http://', appengine.AppEngineAdapter())
        ...    s.mount('https://', appengine.AppEngineAdapter())
        ...
        >>>
    """

    def __init__(self, validate_certificate=True, *args, **kwargs):
        if gaecontrib is None:
            raise exc.VersionMismatchError(
                "The toolbelt requires at least Requests 2.8.0 to be "
                "installed. Version {0} was found instead.".format(
                    requests.__version__
                )
            )
        self._validate_certificate = validate_certificate
        super(AppEngineAdapter, self).__init__(self, *args, **kwargs)

    def init_poolmanager(self, connections, maxsize, block=False):
        self.poolmanager = gaecontrib.AppEngineManager(
            validate_certificate=self._validate_certificate
        )

def monkeypatch():
    """Sets up all Sessions to use AppEngineAdapter by default.

    If you don't want to deal with constructing and configuring your own Sessions,
    or if you use libraries that call the requests API directly (ie requests.post),
    then you may prefer to monkeypatch and auto-configure all newly-constructed Sessions.
    """
    # HACK: We should consider modifying urllib3 to support this as an explicit module-level variable.
    sessions.HTTPAdapter = AppEngineAdapter
