#!/bin/bash
# Play $1

killall omxplayer.bin
omxplayer -b --no-osd cache/$1 > /dev/null

# Play in a window
# omxplayer --no-osd --win 0,780,533,1080 cache/$1 > /dev/null
