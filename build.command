#!/bin/zsh
cd "$(dirname "$0")"
swiftc -framework Cocoa OmpTrafficLight.swift -o OmpTrafficLight
