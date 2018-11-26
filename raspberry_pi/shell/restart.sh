#!/bin/bash
setterm --cursor off
clear
sudo killall cec-client -q > /dev/null
sudo nodejs --max_old_space_size=512 bin/main 
setterm --cursor on