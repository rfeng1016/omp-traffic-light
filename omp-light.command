#!/bin/zsh
cd "$(dirname "$0")"
if [ ! -x "./OmpTrafficLight" ] || [ "OmpTrafficLight.swift" -nt "OmpTrafficLight" ]; then
  swiftc -framework Cocoa OmpTrafficLight.swift -o OmpTrafficLight || exit 1
fi
./OmpTrafficLight
