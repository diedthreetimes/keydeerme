#/usr/bin/bash
# Note: This deploy script assumes the same username on the host
# Its surprising a similar deploy script doesn't exist already
meteor build .
scp keydeerme.tar.gz keydeer.me:~
# The way we move the bundle probably kills any seamless deploy. 
#  This seems to require a change in how meteor is served.
ssh keydeer.me 'tar -zxf keydeerme.tar.gz; rm -rf /var/www/keydeer.me; mv bundle /var/www/keydeer.me; cd /var/www/keydeer.me/programs/server && npm install; cd ../../; mkdir tmp; mv programs/web.browser/app public; touch tmp/restart.txt'

# Todo we probably need to touch restart also 
