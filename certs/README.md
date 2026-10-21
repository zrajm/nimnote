Configuring Lighttpd to Use CGI, HTTPS and Basic Auth
=====================================================
I created the following config file. (`nomi` is the name for my machine on my
home network and I use it to access this machine from other machines on my home
network.)


Basic Auth
----------
First, lets set up the Basic Auth related stuff. For Basic Auth to work, enable
the Lighttpd module 'auth', like so.

```
# sudo lighttpd-enable-mod auth
```

Also, a password file is needed. The below config points to
`/etc/lighttpd/password-dedyn`, so lets write a password to that using the
currently logged in user's username (`$USER`), and give it the right
permissions with:

```
# echo "$USER:$(openssl passwd -apr1)" | sudo tee /etc/lighttpd/password-dedyn
# sudo chown root:www-data /etc/lighttpd/password-dedyn
# sudo chmod 640 /etc/lighttpd/password-dedyn
```


Site Config
-----------
Basic parameters for site.

File: `/etc/lighttpd/conf-available/50-nimnote-localhost.conf`

```
# Virtual host for local development site 'dedyn.nomi'/'dedyn.localhost'.
# (This also allows for CGI in `/api/FILE`.)

$HTTP["host"] =~ "^nimnote\.(localhost|nomi)$" {
    server.document-root        = "/home/zrajm/Web/lal.dedyn.io"
    server.errorlog             = "/var/log/lighttpd/error-nimnote-localhost.log"
    #accesslog.filename          = "/var/log/lighttpd/access-nimnote-localhost.log"
    #server.error-handler-404    = "/e404.php"
    index-file.names            = ("index.html", "index.txt")

    # Basic auth only for /nimnote/ (and everything below it).
    auth.backend                   = "htpasswd"
    auth.backend.htpasswd.userfile = "/etc/lighttpd/password-dedyn"
    auth.require                   = ("/nimnote/" => (
        "method"  => "basic",
        "realm"   => "nimnote",
        "require" => "valid-user"
    ))

    # CGI only for executable files inside any /api/ directory.
    $HTTP["url"] =~ "/api/[^/]*$" {
        cgi.assign = ( "" => "" )          # no interpreter: run the file itself
        cgi.execute-x-only = "enable"      # only files with the +x bit
    }
}

#EOF
```

Then enable the above using the command.

```
# sudo lighttpd-enable-mod nimnote-localhost
Enabling nimnote-localhost: ok
Run "service lighttpd force-reload" to enable changes
# sudo service lighttpd force-reload
```

Now, to test the result, run the following command.

```
# curl -v 'https://nimnote.localhost/nimnote/api/list'
```

And if the following command ends in a JSON, you know you've succeeded. (If it
outputs a shell script, then the script isn't really.


File: `/etc/hosts`

```
127.0.0.1  nimnote.localhost nimnote.nomi
```

<!--EOF-->
